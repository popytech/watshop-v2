import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ProxyAgent } from "undici";

/*
 * GNAKRYPAY — client de la passerelle.
 *
 * GNAKRYPAY est notre marque ; l'encaissement passe pour l'instant par Djomy,
 * qui couvre Orange Money, MTN MoMo et Kulu en Guinée. Ce fichier est le seul
 * du projet à le savoir : au-delà, tout parle de GNAKRYPAY, et le jour où
 * l'infrastructure devient la nôtre, c'est ce module qui change, lui seul.
 *
 * Un point qu'aucun code ne peut régler : l'invite qui s'affiche sur le
 * téléphone du payeur vient de l'opérateur, et porte le nom du marchand
 * enregistré chez lui. Pour qu'elle lise GNAKRYPAY, il faut le demander au
 * prestataire — ce n'est pas une question d'implémentation.
 *
 * Authentification, telle que la spécifie leur documentation :
 *   X-API-KEY: <clientId>:<HMAC-SHA256(clientId, clientSecret) en hexadécimal>
 * puis POST /v1/auth pour un jeton Bearer, exigé avec la clé sur chaque appel.
 */

/*
 * L'adresse de production est api.djomy.africa, confirmée par le prestataire.
 *
 * Elle est derrière Cloudflare, qui filtre selon l'adresse d'origine : depuis un
 * poste, on reçoit un 403 « edge » (page HTML, cdn-cgi/content) avant même
 * d'atteindre l'application — ni le User-Agent ni aucun en-tête n'y changent
 * rien, c'est un filtrage par IP/ASN. Le verdict dépend donc de QUI appelle :
 * un échec local ne dit rien du sort d'un appel parti de Vercel. Le seul test
 * qui tranche est `?diagnostic=passerelle`, lancé depuis l'hébergement.
 *
 * À ne pas confondre avec prod-api.djomy.africa : cet hôte répond (health 200)
 * mais n'exécute pas le filtre d'authentification par clé — une clé valide et
 * une clé fausse y reçoivent le même refus générique. Ce n'est pas l'API de
 * production ; api.djomy.africa l'est.
 */
const BASE_URL = process.env.GNAKRYPAY_API_URL ?? "https://api.djomy.africa";
const CLIENT_ID = process.env.GNAKRYPAY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GNAKRYPAY_CLIENT_SECRET ?? "";
/*
 * La clé qui signe les webhooks.
 *
 * La documentation dit « signé avec la clé secrète, accessible depuis l'espace
 * développeur », et cet espace n'expose qu'un seul secret : celui du client.
 * Les deux ne font donc qu'un, et l'exiger dans une variable séparée revenait à
 * demander deux fois la même chose — avec le risque qu'on l'oublie et que tous
 * les retours de paiement soient refusés en silence.
 *
 * La variable reste lisible pour le jour où le prestataire les séparera.
 */
const WEBHOOK_SECRET = process.env.GNAKRYPAY_WEBHOOK_SECRET?.trim() || CLIENT_SECRET;

/** Méthodes réellement ouvertes en Guinée. Les autres sont annoncées « bientôt ». */
export const METHODES = [
  { id: "OM", label: "Orange Money" },
  { id: "MOMO", label: "MTN Mobile Money" },
  { id: "KULU", label: "Kulu" },
] as const;

export type Methode = (typeof METHODES)[number]["id"];

/** Statuts renvoyés par la passerelle. */
export type StatutPasserelle =
  | "CREATED"
  | "AUTHORIZED"
  | "PENDING"
  | "SUCCESS"
  | "CAPTURED"
  | "FAILED"
  | "CANCELLED"
  | "TIMEOUT";

export type PaiementCree = {
  transactionId: string;
  status: StatutPasserelle;
  /** Présente quand le payeur doit finir sur une page hébergée. */
  paymentUrl: string | null;
};

/** La passerelle est-elle configurée ? Sans clés, on n'affiche pas le bouton. */
export function estConfiguree(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

function signer(message: string, secret: string): string {
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

/*
 * Notre domaine public, tel qu'il apparaît dans Origin/Referer.
 *
 * Le prestataire a autorisé « le nom de domaine » de Watshop sur sa passerelle.
 * Une règle de pare-feu qui filtre sur un domaine ne peut regarder que ces deux
 * en-têtes — une requête serveur ne transporte rien d'autre qui dise d'où elle
 * vient. On les joint donc à chaque appel : si l'autorisation porte bien là,
 * c'est ce qui la déclenche.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "https://watshop.africa";

/*
 * En-têtes joints à chaque appel.
 *
 * L'API de la passerelle est derrière Cloudflare, qui refuse nos requêtes par un
 * 403 accompagné d'une page HTML — un blocage en amont, avant l'application. Le
 * User-Agent et Accept décrivent honnêtement un client HTTP ; Origin et Referer
 * portent notre domaine, celui que le prestataire dit avoir autorisé.
 *
 * Si le 403 persiste malgré ça, c'est que le filtre porte sur l'adresse IP et
 * non sur le domaine, et il faudra alors faire sortir nos appels par une IP fixe
 * que le prestataire autorisera (GNAKRYPAY_PROXY_URL) — aucun en-tête n'y pourra
 * rien.
 */
const ENTETES_COMMUNES = {
  "User-Agent": "Watshop/1.0 (+https://watshop.africa)",
  Accept: "application/json",
  "Content-Type": "application/json",
  Origin: SITE_URL,
  Referer: `${SITE_URL}/`,
};

/** `X-API-KEY`, à joindre à toutes les requêtes, jeton compris. */
function cleApi(): string {
  return `${CLIENT_ID}:${signer(CLIENT_ID, CLIENT_SECRET)}`;
}

/*
 * Sortie par une IP fixe, quand la passerelle filtre sur l'adresse d'origine.
 *
 * Le pare-feu du prestataire bloque les IP d'hébergement, et celle de Vercel
 * change d'un appel à l'autre : impossible de la faire autoriser. La parade est
 * de faire transiter *uniquement* les appels de la passerelle par un proxy à IP
 * fixe (un petit serveur à nous, ou un proxy managé), et de donner cette IP —
 * seule et stable — au prestataire pour sa liste blanche.
 *
 * GNAKRYPAY_PROXY_URL porte l'adresse du proxy (http://[user:pass@]hote:port).
 * Absente, tout part en direct comme avant — la variable est le seul
 * interrupteur, et rien d'autre dans le code ne bouge.
 */
const PROXY_URL = process.env.GNAKRYPAY_PROXY_URL?.trim();

const dispatcher = PROXY_URL ? construireProxy(PROXY_URL) : undefined;

function construireProxy(url: string): ProxyAgent | undefined {
  try {
    const u = new URL(url);
    // Proxy managé (QuotaGuard, Fixie…) : les identifiants voyagent dans l'URL.
    // undici ne les transforme pas seul en en-tête d'authentification — on le
    // fait ici, et on retire le userinfo de l'URI passée à l'agent.
    if (u.username || u.password) {
      const identifiants = `${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}`;
      const token = `Basic ${Buffer.from(identifiants).toString("base64")}`;
      return new ProxyAgent({ uri: `${u.protocol}//${u.host}`, token });
    }
    return new ProxyAgent(url);
  } catch {
    // Une URL de proxy illisible ne doit pas faire tomber tout le module au
    // chargement : on repart en direct, et le diagnostic signalera l'absence.
    return undefined;
  }
}

/*
 * `dispatcher` n'est pas dans le type standard de `fetch`, mais le fetch de Node
 * (undici) le lit : c'est ainsi qu'on choisit par où sort la requête. Ce petit
 * enrobage l'ajoute quand un proxy est configuré, et ne touche à rien sinon.
 */
function options(init: RequestInit): RequestInit {
  return dispatcher ? ({ ...init, dispatcher } as RequestInit) : init;
}

/*
 * Le jeton est mémorisé le temps de sa validité.
 *
 * Redemander un jeton à chaque appel doublerait les allers-retours et se
 * ferait limiter au débit. La marge de trente secondes évite d'en présenter un
 * qui expire pendant le trajet.
 */
let jeton: { valeur: string; expireA: number } | null = null;
const MARGE_MS = 30_000;

async function obtenirJeton(): Promise<string> {
  if (jeton && jeton.expireA > Date.now()) return jeton.valeur;

  const reponse = await fetch(
    `${BASE_URL}/v1/auth`,
    options({
      method: "POST",
      headers: { ...ENTETES_COMMUNES, "X-API-KEY": cleApi() },
      body: "{}",
      cache: "no-store",
    }),
  );

  if (!reponse.ok) {
    throw new Error(`GNAKRYPAY : authentification refusée (${reponse.status})`);
  }

  const corps = (await reponse.json()) as {
    data?: { accessToken?: string; expiresIn?: number };
  };
  const acces = corps.data?.accessToken;
  if (!acces) throw new Error("GNAKRYPAY : jeton absent de la réponse");

  jeton = {
    valeur: acces,
    expireA: Date.now() + Math.max((corps.data?.expiresIn ?? 300) * 1000 - MARGE_MS, 0),
  };
  return acces;
}

async function appeler<T>(chemin: string, init: RequestInit = {}): Promise<T> {
  const acces = await obtenirJeton();

  const reponse = await fetch(
    `${BASE_URL}${chemin}`,
    options({
      ...init,
      headers: {
        ...ENTETES_COMMUNES,
        "X-API-KEY": cleApi(),
        Authorization: `Bearer ${acces}`,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    }),
  );

  const corps = (await reponse.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    data?: T;
  };

  if (!reponse.ok || corps.success === false || !corps.data) {
    throw new Error(corps.message ?? `GNAKRYPAY : appel ${chemin} en échec (${reponse.status})`);
  }

  return corps.data;
}

/**
 * Demande un paiement au numéro indiqué.
 *
 * Le paiement direct est préféré au portail hébergé : le payeur reste sur
 * Watshop et valide sur son téléphone, sans passer par une page à l'enseigne
 * d'un tiers.
 *
 * `merchantPaymentReference` porte notre propre identifiant de paiement : c'est
 * lui qui permettra de rapprocher le webhook de la ligne en base, sans avoir à
 * faire confiance à un identifiant que nous n'avons pas émis.
 */
export async function demanderPaiement(params: {
  montant: number;
  telephone: string;
  methode: Methode;
  reference: string;
  description: string;
  paysISO2: string;
  retourUrl: string;
  annulationUrl: string;
}): Promise<PaiementCree> {
  const cree = await appeler<{
    transactionId: string;
    status: StatutPasserelle;
    paymentUrl?: string | null;
    redirectUrl?: string | null;
  }>("/v1/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: params.montant,
      countryCode: params.paysISO2,
      payerIdentifier: params.telephone,
      paymentMethod: params.methode,
      description: params.description,
      merchantPaymentReference: params.reference,
      returnUrl: params.retourUrl,
      cancelUrl: params.annulationUrl,
    }),
  });

  return {
    transactionId: cree.transactionId,
    status: cree.status,
    paymentUrl: cree.paymentUrl ?? cree.redirectUrl ?? null,
  };
}

/** Relit l'état d'un paiement — filet quand le webhook n'est pas arrivé. */
export async function lirePaiement(transactionId: string) {
  return appeler<{
    transactionId: string;
    status: StatutPasserelle;
    paidAmount: number;
    currency: string;
    merchantPaymentReference: string;
    providerReference?: string;
  }>(`/v1/payments/${encodeURIComponent(transactionId)}/status`);
}

/**
 * Vérifie l'authenticité d'un webhook.
 *
 * L'en-tête vaut `v1:<signature>`, la signature étant un HMAC-SHA256 du corps
 * brut — d'où la nécessité de comparer le texte reçu tel quel, avant tout
 * `JSON.parse` : ré-encoder un objet change les espaces et l'ordre des clés, et
 * la signature ne correspond plus.
 *
 * La comparaison est à temps constant. Une comparaison ordinaire s'arrête au
 * premier octet différent, et cette durée suffit à reconstituer une signature
 * valide essai après essai.
 */
export function verifierSignatureWebhook(corpsBrut: string, entete: string | null): boolean {
  if (!WEBHOOK_SECRET || !entete) return false;

  const recue = entete.startsWith("v1:") ? entete.slice(3) : entete;
  const attendue = signer(corpsBrut, WEBHOOK_SECRET);

  const a = Buffer.from(recue, "utf8");
  const b = Buffer.from(attendue, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Un paiement abouti, quel que soit le nom que la passerelle lui donne. */
export function estAbouti(statut: StatutPasserelle): boolean {
  return statut === "SUCCESS" || statut === "CAPTURED";
}

/** Un paiement définitivement perdu : inutile d'attendre davantage. */
export function estPerdu(statut: StatutPasserelle): boolean {
  return statut === "FAILED" || statut === "CANCELLED" || statut === "TIMEOUT";
}

/**
 * Éprouve l'authentification auprès de la passerelle et rapporte ce qu'elle
 * répond.
 *
 * Les clés ne sont lisibles que par le serveur : un échec de paiement ne se
 * diagnostique donc pas depuis un poste de développement, et le message montré
 * au vendeur est volontairement muet. Cette fonction comble ce trou sans rien
 * exposer — elle rend le code HTTP et le message de la passerelle, jamais les
 * clés, et se contente d'indiquer si chacune est renseignée.
 */
export async function diagnostiquerPasserelle() {
  const configuration = {
    url: BASE_URL,
    clientId: CLIENT_ID ? `${CLIENT_ID.slice(0, 14)}…` : "(absent)",
    clientSecret: CLIENT_SECRET ? `renseigné (${CLIENT_SECRET.length} caractères)` : "(absent)",
    webhookSecret: WEBHOOK_SECRET ? `renseigné (${WEBHOOK_SECRET.length} caractères)` : "(absent)",
    // Le proxy est-il actif ? Sans exposer son adresse : un simple oui/non, pour
    // savoir par où sort réellement l'appel qu'on est en train de tester.
    proxy: PROXY_URL ? (dispatcher ? "actif (IP fixe)" : "configuré mais illisible") : "aucun (direct)",
  };

  if (!estConfiguree()) {
    return { ok: false, etape: "configuration", configuration };
  }

  try {
    const reponse = await fetch(
      `${BASE_URL}/v1/auth`,
      options({
        method: "POST",
        headers: { ...ENTETES_COMMUNES, "X-API-KEY": cleApi() },
        body: "{}",
        cache: "no-store",
      }),
    );

    const texte = await reponse.text();

    return {
      ok: reponse.ok,
      etape: "authentification",
      statut: reponse.status,
      // Tronqué : une réponse d'erreur peut être une page entière.
      reponse: texte.slice(0, 400),
      configuration,
    };
  } catch (erreur) {
    return {
      ok: false,
      etape: "réseau",
      message: erreur instanceof Error ? erreur.message : String(erreur),
      configuration,
    };
  }
}
