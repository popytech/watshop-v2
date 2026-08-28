// Formats d'affichage partagés. Les montants sont stockés en entiers (pas de
// centimes : le franc guinéen n'en a pas), donc aucune décimale nulle part.

export function formatMoney(amount: number, currency = "GNF"): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}`;
}

/** Version courte pour les tuiles de statistiques : 4 850 000 -> 4,85 M */
export function formatMoneyCompact(amount: number, currency = "GNF"): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const rendu = millions >= 10 ? Math.round(millions).toString() : millions.toFixed(2).replace(/\.?0+$/, "");
    return `${rendu.replace(".", ",")} M ${currency}`;
  }
  return formatMoney(amount, currency);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "il y a 3 h", "hier", "il y a 5 j" — pour les listes de commandes. */
export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;

  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} j`;

  return formatDate(iso);
}

/** Numéro de commande lisible : #WA-00821 */
export function orderReference(id: string, source: string): string {
  const prefix = source === "whatsapp" ? "WA" : source === "manual" ? "MA" : "WS";
  const digits = id.replace(/\D/g, "").slice(0, 5).padStart(5, "0");
  return `#${prefix}-${digits}`;
}
