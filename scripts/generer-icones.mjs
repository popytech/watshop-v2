/**
 * Fabrique les icônes de Watshop à partir d'une seule définition de dessin.
 *
 *     node scripts/generer-icones.mjs
 *
 * Aucune dépendance : `zlib` suffit à écrire un PNG, et le dessin est calculé
 * pixel par pixel. Ajouter `sharp` pour cinq images qui changent une fois par an
 * aurait alourdi l'installation de tout le monde.
 *
 * Le tracé est décrit par des fonctions de distance plutôt que par des chemins :
 * un pixel est dedans ou dehors selon une inégalité, ce qui permet de le
 * suréchantillonner — seize sondes par pixel — et d'obtenir des bords lissés
 * sans moteur de rendu.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

// La couleur de marque, celle du token --primary dans globals.css.
const VERT = [18, 140, 74];
const BLANC = [255, 255, 255];

/** Distance signée à un rectangle aux coins arrondis, centré en (cx, cy). */
function rectArrondi(x, y, cx, cy, demiLargeur, demiHauteur, rayon) {
  const dx = Math.abs(x - cx) - (demiLargeur - rayon);
  const dy = Math.abs(y - cy) - (demiHauteur - rayon);
  const dehors = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return dehors + Math.min(Math.max(dx, dy), 0) - rayon;
}

/**
 * Le sac : un corps arrondi, et une anse en demi-cercle évidée par-dessus.
 *
 * L'ancienne icône se lisait comme un cadenas — corps trop haut, anse trop
 * étroite. Le corps est ici plus large que haut et l'anse plus fine, ce qui
 * lève l'ambiguïté à seize pixels comme à cinq cents.
 */
function dansLeSac(x, y) {
  // Repère normalisé : le carré va de 0 à 1.
  //
  // Un cadenas a un corps plus haut que large et un arceau étroit. Un sac a
  // l'inverse : une base large et une anse qui couvre une bonne part de cette
  // largeur. C'est ce rapport, plus que le détail du tracé, qui distingue les
  // deux d'un coup d'œil — y compris à seize pixels.
  const corps = rectArrondi(x, y, 0.5, 0.635, 0.26, 0.185, 0.05) <= 0;

  // Anse elliptique, plus large que haute, et posée assez bas pour recouper le
  // haut du corps : elle paraît attachée au sac, non suspendue au-dessus.
  const dxAnse = (x - 0.5) / 0.175;
  const dyAnse = (y - 0.47) / 0.145;
  const rayonAnse = Math.hypot(dxAnse, dyAnse);
  const epaisseur = 0.32;
  const anse = dyAnse <= 0 && rayonAnse <= 1 && rayonAnse >= 1 - epaisseur;

  return corps || anse;
}

function couleurEn(x, y) {
  // Hors de la tuile arrondie : transparent.
  if (rectArrondi(x, y, 0.5, 0.5, 0.5, 0.5, 0.22) > 0) return null;
  return dansLeSac(x, y) ? BLANC : VERT;
}

/** Rend une image carrée, seize sondes par pixel pour lisser les bords. */
function dessiner(taille) {
  const pixels = Buffer.alloc(taille * taille * 4);
  const sondes = 4; // 4×4

  for (let py = 0; py < taille; py += 1) {
    for (let px = 0; px < taille; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < sondes; sy += 1) {
        for (let sx = 0; sx < sondes; sx += 1) {
          const x = (px + (sx + 0.5) / sondes) / taille;
          const y = (py + (sy + 0.5) / sondes) / taille;
          const c = couleurEn(x, y);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 255;
          }
        }
      }

      const total = sondes * sondes;
      const i = (py * taille + px) * 4;
      // Moyenne pondérée par la couverture : un pixel à moitié dedans prend la
      // couleur du dessin et la moitié de son opacité.
      const couvre = a / 255;
      pixels[i] = couvre ? Math.round(r / couvre) : 0;
      pixels[i + 1] = couvre ? Math.round(g / couvre) : 0;
      pixels[i + 2] = couvre ? Math.round(b / couvre) : 0;
      pixels[i + 3] = Math.round(a / total);
    }
  }

  return pixels;
}

// ── Encodage PNG ────────────────────────────────────────────────────────────

const TABLE_CRC = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const octet of buffer) c = TABLE_CRC[(c ^ octet) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, donnees) {
  const nom = Buffer.from(type, "ascii");
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([nom, donnees])));
  return Buffer.concat([longueur, nom, donnees, crc]);
}

function encoderPng(pixels, taille) {
  // Chaque ligne est précédée de son octet de filtre — 0, aucun filtre.
  const brut = Buffer.alloc(taille * (taille * 4 + 1));
  for (let y = 0; y < taille; y += 1) {
    brut[y * (taille * 4 + 1)] = 0;
    pixels.copy(brut, y * (taille * 4 + 1) + 1, y * taille * 4, (y + 1) * taille * 4);
  }

  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(taille, 0);
  entete.writeUInt32BE(taille, 4);
  entete[8] = 8; // 8 bits par canal
  entete[9] = 6; // RVB + alpha
  entete[10] = 0; // compression standard
  entete[11] = 0; // filtrage standard
  entete[12] = 0; // pas d'entrelacement

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", entete),
    chunk("IDAT", deflateSync(brut, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Sortie ──────────────────────────────────────────────────────────────────

const SORTIES = [
  ["public/icone-192.png", 192],
  ["public/icone-512.png", 512],
  ["public/apple-icon.png", 180],
];

for (const [chemin, taille] of SORTIES) {
  const png = encoderPng(dessiner(taille), taille);
  writeFileSync(chemin, png);
  console.log(`  ${String(taille).padStart(3)}×${String(taille).padEnd(3)} ${(png.length / 1024).toFixed(1).padStart(5)} Ko  ${chemin}`);
}

/**
 * Le favicon, en ICO contenant trois PNG.
 *
 * Un fichier ICO peut embarquer des PNG tels quels depuis Windows Vista, ce qui
 * évite d'écrire un encodeur bitmap en plus. Trois tailles : 16 pour l'onglet,
 * 32 pour la barre de favoris, 48 pour le raccourci de bureau — le navigateur
 * choisit celle qui lui convient plutôt que de rééchantillonner la seule
 * disponible.
 */
function encoderIco(tailles) {
  const images = tailles.map((t) => encoderPng(dessiner(t), t));

  const entete = Buffer.alloc(6);
  entete.writeUInt16LE(0, 0); // réservé
  entete.writeUInt16LE(1, 2); // 1 = icône
  entete.writeUInt16LE(images.length, 4);

  let decalage = 6 + images.length * 16;
  const entrees = images.map((png, i) => {
    const e = Buffer.alloc(16);
    // 0 signifie 256 : la taille tient sur un octet dans ce format.
    e[0] = tailles[i] >= 256 ? 0 : tailles[i];
    e[1] = tailles[i] >= 256 ? 0 : tailles[i];
    e[2] = 0; // palette
    e[3] = 0; // réservé
    e.writeUInt16LE(1, 4); // plans
    e.writeUInt16LE(32, 6); // bits par pixel
    e.writeUInt32BE(0, 8);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(decalage, 12);
    decalage += png.length;
    return e;
  });

  return Buffer.concat([entete, ...entrees, ...images]);
}

const ico = encoderIco([16, 32, 48]);
writeFileSync("src/app/favicon.ico", ico);
console.log(`  16/32/48  ${(ico.length / 1024).toFixed(1).padStart(5)} Ko  src/app/favicon.ico`);
