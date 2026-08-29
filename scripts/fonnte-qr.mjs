// Récupère un QR code de connexion Fonnte et l'enregistre en PNG.
//
// Sert quand l'appareil WhatsApp s'est déconnecté (device_status "disconnect") :
// aucune notification de commande ne part tant qu'il ne l'est pas. Le QR se
// génère avec le seul FONNTE_TOKEN, sans passer par le tableau de bord Fonnte.
//
//   node scripts/fonnte-qr.mjs
//
// Puis, sur le téléphone qui porte le numéro de l'appareil Fonnte :
// WhatsApp → Appareils connectés → Connecter un appareil → scanner le PNG.
//
// Le QR expire en une poignée de secondes : relancer le script autant de fois
// que nécessaire.

import { readFileSync, writeFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const token = env
  .split(/\r?\n/)
  .find((l) => l.startsWith("FONNTE_TOKEN="))
  ?.slice("FONNTE_TOKEN=".length)
  .trim();

if (!token) {
  console.error("FONNTE_TOKEN absent de .env.local");
  process.exit(1);
}

const etat = await (
  await fetch("https://api.fonnte.com/device", {
    method: "POST",
    headers: { Authorization: token },
  })
).json();

console.log(
  `appareil « ${etat.name} » (${etat.device}) — état : ${etat.device_status} — ` +
    `forfait ${etat.package}, ${etat.messages}/${etat.quota} messages, expire le ${etat.expired}`,
);

if (etat.device_status === "connect") {
  console.log("déjà connecté : rien à faire.");
  process.exit(0);
}

const qr = await (
  await fetch("https://api.fonnte.com/qr", {
    method: "POST",
    headers: { Authorization: token },
  })
).json();

if (!qr.url) {
  console.error("pas de QR renvoyé : " + JSON.stringify(qr).slice(0, 200));
  process.exit(1);
}

const sortie = new URL("../fonnte-qr.png", import.meta.url);
writeFileSync(sortie, Buffer.from(qr.url, "base64"));

console.log(`QR enregistré : ${sortie.pathname.slice(1)}`);
console.log(`scanner depuis WhatsApp sur le +${etat.device} — il expire vite.`);
