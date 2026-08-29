// Normalisation des numéros de téléphone.
//
// Supabase Auth exige du E.164 (+224622123456) alors que les utilisateurs
// tapent ce qu'ils ont l'habitude d'écrire : "622 12 34 56", "0622123456",
// "00224 622 12 34 56". Tout passe par ici pour qu'un même numéro donne
// toujours la même identité en base — le legacy comparait des chaînes brutes,
// d'où des doublons de comptes.

export type Country = {
  code: string;
  dial: string;
  name: string;
  nationalDigits: number;
  example: string;
};

// Marchés couverts aujourd'hui. Ajouter un pays ici suffit : rien d'autre dans
// l'app ne code en dur un indicatif.
export const COUNTRIES: Country[] = [
  { code: "GN", dial: "224", name: "Guinée", nationalDigits: 9, example: "622 12 34 56" },
  { code: "SN", dial: "221", name: "Sénégal", nationalDigits: 9, example: "77 123 45 67" },
  { code: "ML", dial: "223", name: "Mali", nationalDigits: 8, example: "76 12 34 56" },
  { code: "CI", dial: "225", name: "Côte d'Ivoire", nationalDigits: 10, example: "07 12 34 56 78" },
  { code: "SL", dial: "232", name: "Sierra Leone", nationalDigits: 8, example: "76 123 456" },
  { code: "LR", dial: "231", name: "Liberia", nationalDigits: 8, example: "77 123 456" },
];

export const DEFAULT_COUNTRY_CODE = "GN";

export function getCountry(code: string): Country {
  return (
    COUNTRIES.find((c) => c.code === code.toUpperCase()) ??
    COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY_CODE)!
  );
}

/**
 * Renvoie le numéro au format E.164 (+224622123456), ou null si le numéro
 * n'est pas plausible pour le pays donné.
 */
export function toE164(input: string, countryCode = DEFAULT_COUNTRY_CODE): string | null {
  const country = getCountry(countryCode);
  let digits = input.replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);

  // Un numéro déjà international pour un pays connu : on le garde tel quel.
  const known = COUNTRIES.find(
    (c) => digits.startsWith(c.dial) && digits.length === c.dial.length + c.nationalDigits,
  );
  if (known) return `+${digits}`;

  // Sinon on interprète comme un numéro national du pays sélectionné, avec ou
  // sans le 0 de préfixe.
  let national = digits;
  if (national.startsWith(country.dial)) national = national.slice(country.dial.length);
  if (national.startsWith("0")) national = national.slice(1);

  if (national.length !== country.nationalDigits) return null;

  return `+${country.dial}${national}`;
}

/** Format lisible : +224 622 12 34 56 */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const country = COUNTRIES.find((c) => digits.startsWith(c.dial));
  if (!country) return e164;

  // Première tranche de 3 si le nombre de chiffres est impair (622 12 34 56),
  // puis des paires — la façon dont les numéros sont lus à l'oral en Guinée.
  const national = digits.slice(country.dial.length);
  const head = national.length % 2 === 1 ? 3 : 2;
  const groups = [national.slice(0, head)];
  for (let i = head; i < national.length; i += 2) groups.push(national.slice(i, i + 2));
  return `+${country.dial} ${groups.join(" ")}`;
}

/**
 * Indicatif pays d'un numéro E.164, parmi les pays couverts. Null si le numéro
 * n'appartient à aucun d'eux.
 */
export function getDialCode(e164: string): string | null {
  const digits = e164.replace(/D/g, "");
  return COUNTRIES.find((c) => digits.startsWith(c.dial))?.dial ?? null;
}

/** Fonnte attend le numéro sans le "+". */
export function toFonnteTarget(e164: string): string {
  return e164.replace(/\D/g, "");
}
