import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, SectionHeader } from "@/components/landing/section";

const QUESTIONS = [
  {
    q: "Faut-il savoir se servir d'un ordinateur ?",
    r: "Non. Tout se fait depuis un téléphone, y compris la création de la boutique et l'ajout des produits. Si vous savez publier un statut WhatsApp, vous savez utiliser Watshop.",
  },
  {
    q: "Watshop prend une commission sur mes ventes ?",
    r: "Aucune. Vous encaissez la totalité de ce que paie votre client. L'offre gratuite le reste, et la formule Pro est un abonnement mensuel fixe — pas un pourcentage.",
  },
  {
    q: "Comment je reçois les commandes ?",
    r: "Sur WhatsApp, avec le détail des articles, le total, le nom du client, son numéro et son adresse. Vous pouvez aussi activer les notifications pour les recevoir même l'application fermée.",
  },
  {
    q: "Et le paiement ?",
    r: "Aujourd'hui, vous vous arrangez avec votre client comme vous le faites déjà : Mobile Money, espèces à la livraison. Le paiement en ligne arrive et ne changera rien à ce qui fonctionne pour vous.",
  },
  {
    q: "Qui livre mes commandes ?",
    r: "Vous, ou un livreur que vous ajoutez à votre boutique. Vous lui confiez une course en deux clics ; il voit l'adresse et le montant à encaisser, et marque la commande livrée.",
  },
  {
    q: "Je peux essayer sans m'engager ?",
    r: "Oui. Créer une boutique est gratuit et ne demande aucune carte bancaire — seulement un numéro WhatsApp ou une adresse email.",
  },
];

export function Faq() {
  return (
    <Section className="line-b">
      <SectionHeader eyebrow="Questions" title="Ce qu'on nous demande le plus" />

      <Accordion type="single" collapsible className="mx-auto mt-10 w-full max-w-2xl">
        {QUESTIONS.map((question) => (
          <AccordionItem key={question.q} value={question.q}>
            <AccordionTrigger className="text-left">{question.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{question.r}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
