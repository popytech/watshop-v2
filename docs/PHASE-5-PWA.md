# Phase 5 — PWA, notifications, diffusion

L'expérience app-like, et les derniers réglages avant de mettre Watshop en avant.

---

## 1. Réglages

**Migration** : `supabase/migrations/0008_pwa_push.sql`.

**Variables** — une paire de clés VAPID, générée une fois pour le projet :

```bash
npx web-push generate-vapid-keys
```

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=…
VAPID_PRIVATE_KEY=…
VAPID_SUBJECT=mailto:watshopafrica@gmail.com
```

Elles sont déjà dans `.env.local`. À reporter dans Vercel (Production **et**
Preview), sinon le bouton d'activation dira que les notifications ne sont pas
configurées.

> ⚠️ **La clé publique est inlinée dans le bundle au build** (`NEXT_PUBLIC_`) :
> après l'avoir ajoutée dans Vercel, il faut **redéployer**, pas seulement
> enregistrer.

---

## 2. Notifications : Web Push, pas Firebase

Le ROADMAP prévoyait Firebase Cloud Messaging. On s'en passe.

Le **Web Push standard** (VAPID) fait la même chose sans compte tiers, sans SDK
côté client et sans clé de service à administrer : une paire de clés générée une
fois suffit. Un service de moins à gérer, une dépendance de moins, et le même
résultat sur Android et desktop.

La table `push_tokens` datait de la Phase 0, pensée pour FCM : une colonne
`token` suffisait. Le Web Push demande trois éléments par abonnement —
l'endpoint et deux clés de chiffrement — d'où les colonnes ajoutées.

Le vendeur active les notifications dans **Ma boutique → Notifications**, appareil
par appareil. Il reçoit alors chaque commande même Watshop fermé, **sans consommer
le quota Fonnte** : les deux canaux sont complémentaires, pas redondants.

Les abonnements que le navigateur rejette définitivement (404/410) sont supprimés
au fil des envois. Sans ce ménage, la table se remplit d'appareils désinstallés et
chaque diffusion ralentit pour rien.

> **iPhone** : les notifications web n'existent que si l'application a été
> installée sur l'écran d'accueil. Le bouton le dit plutôt que d'échouer en
> silence.

---

## 3. Mode hors ligne

Le service worker fait **deux choses seulement** :

- servir une page « pas de connexion » quand le réseau manque, plutôt que
  l'écran d'erreur du navigateur ;
- recevoir les notifications.

**Aucun cache des pages.** L'application affiche des commandes et des stocks :
montrer une version périmée serait pire que de ne rien montrer. Seuls les
fichiers statiques de l'App Router sont gardés — leur nom contient un hachage,
ils ne peuvent donc pas être périmés.

Le service worker n'est enregistré **qu'en production** : en développement, son
cache masquerait les changements de code et ferait perdre un temps fou.

La page hors ligne se recharge d'elle-même dès que la connexion revient.

---

## 4. Diffusion — `/admin/diffusion`

Prévenir les vendeurs d'une nouveauté, par notification et/ou WhatsApp, avec une
audience explicite : boutiques publiées, vendeurs Pro, ou tous. Le nombre de
destinataires est affiché avant l'envoi.

> ⚠️ **La diffusion WhatsApp est plafonnée à 200 messages**, envoyés un par un.
> Un compte qui expédie des centaines de messages d'un coup se fait bannir par
> Meta — et c'est le numéro Watshop qui saute, pas seulement un quota Fonnte. La
> notification, elle, est gratuite et illimitée : à préférer quand le message
> n'est pas urgent.

---

## 5. Dark mode : branché, pas retiré

`next-themes` était installé depuis le début sans être branché — l'audit du
legacy le relevait. La palette sombre existait déjà dans `globals.css`.

Elle sert désormais : bascule dans l'en-tête de tous les espaces connectés, choix
mémorisé, et respect du réglage système par défaut. La couleur de la barre
système suit le thème.

La boutique publique n'a pas de bascule : la couleur y est celle du vendeur,
injectée dans `--primary`, et c'est l'identité de sa boutique — pas une
préférence du visiteur.

---

## 6. Vérifier que ça marche

1. En production, ouvrir le site sur Android → le navigateur propose
   « Installer l'application ».
2. Activer les notifications dans **Ma boutique**, puis passer une commande depuis
   un autre appareil → la notification arrive, même onglet fermé.
3. Cliquer la notification → elle ouvre la fiche de la commande, sans créer un
   second onglet si l'application est déjà ouverte.
4. Passer le téléphone en mode avion, naviguer → la page « pas de connexion »
   s'affiche. Rétablir le réseau → elle se recharge seule.
5. Basculer le thème : recharger la page ne le remet pas à zéro.
6. Depuis `/admin/diffusion`, envoyer une notification aux boutiques publiées →
   le compte-rendu indique le nombre d'envois et d'abonnements périmés nettoyés.
