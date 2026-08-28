// État renvoyé par les Server Actions du vendeur au formulaire qui les appelle.
// Dans son propre module : un fichier "use server" ne peut exporter que des
// fonctions asynchrones, pas la constante initiale.

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const initialFormState: FormState = {};
