# Déploiement sur Vercel

Objectif : une URL publique, qui débloque l'**OTP WhatsApp** (le Send SMS Hook
de Supabase appelle notre serveur depuis Internet, `localhost` ne marche pas) et
permet de tester les trois phases avec de vrais numéros guinéens.

Deux choses ne peuvent être faites que par toi, et rien ne fonctionne avant :
les **clés Supabase** et la **connexion Vercel**.

---

## 1. Les clés Supabase (5 min, bloquant)

Projet **`vgtlbnoiksnpwoxyncxt`** — le projet neuf, pas le legacy.

**Project Settings → API**, copier dans `watshop-v2/.env.local` :

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
```

Sans elles l'application ne démarre pas, ni en local ni en production.

## 2. Les migrations, dans l'ordre (SQL Editor)

```
supabase/schema.sql                              (base neuve — contient déjà tout)
```

ou, si le schéma d'une phase précédente est déjà en place :

```
supabase/migrations/0001_phase1_auth_roles.sql
supabase/migrations/0002_phase2_boutique.sql
supabase/migrations/0003_phase3_boutique_publique.sql
```

Puis vérifier dans **Storage** que le bucket `shop-media` existe et est public.

## 3. Ce qui est déjà réglé

- `FONNTE_TOKEN` — récupéré du projet legacy. Le token Fonnte est lié au compte
  WhatsApp, pas au projet Supabase : il est réutilisable tel quel.
- `VISIT_HASH_SALT` — sel aléatoire généré.
- `NEXT_PUBLIC_SUPABASE_URL` — le projet neuf.

## 4. Deux économies possibles, à partir du legacy

Le `.env.local` du projet legacy contient deux choses réutilisables **sans les
copier dans le code** — elles se collent dans le tableau de bord Supabase :

- `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` → **Authentication → Providers →
  Google**. Évite de recréer un client dans Google Cloud Console. Penser à
  ajouter `https://vgtlbnoiksnpwoxyncxt.supabase.co/auth/v1/callback` aux URI de
  redirection autorisées côté Google.
- `GMAIL_APP_PASSWORD` (compte `watshopafrica@gmail.com`) → **Project Settings →
  Auth → SMTP Settings**, hôte `smtp.gmail.com`, **port 587** (surtout pas 465 :
  Supabase négocie STARTTLS, le 465 fait pendre la connexion et l'envoi d'OTP
  répond 504). Le SMTP par défaut de Supabase est fortement limité en volume ;
  avec celui-ci, l'OTP par email tient la charge d'un vrai test.

> Ne pas réutiliser les clés Supabase du legacy (`kkujxpyajufayesgqbxy`) : le
> projet neuf a son propre schéma. Et `ADMIN_SECRET` n'a plus d'équivalent —
> l'accès admin vient du rôle en base depuis la Phase 1.

---

## 5. Déployer

```bash
cd watshop-v2
vercel login        # ouvre le navigateur — à faire une fois
vercel link         # créer/associer le projet
```

Renseigner les variables d'environnement du projet Vercel (Production **et**
Preview) :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | l'URL Vercel, puis `https://watshop.africa` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vgtlbnoiksnpwoxyncxt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | clé service_role |
| `FONNTE_TOKEN` | token Fonnte |
| `SUPABASE_SEND_SMS_HOOK_SECRET` | secret du hook (étape 6) |
| `VISIT_HASH_SALT` | sel aléatoire |

Le plus simple :

```bash
vercel env pull      # vérifier ce qui est déjà là
vercel --prod        # ou laisser le déploiement se faire depuis Git
```

## 6. Brancher l'OTP WhatsApp, une fois l'URL connue

1. **Authentication → Hooks → Send SMS hook** → *Enable*, type HTTPS, URL :
   `https://<url-vercel>/api/auth/hooks/send-sms`
2. Copier le secret affiché (`v1,whsec_…`) dans `SUPABASE_SEND_SMS_HOOK_SECRET`,
   côté Vercel **et** en local.
3. **Authentication → Providers → Phone** → activer. Le hook remplace le
   fournisseur SMS : pas besoin de Twilio.
4. **Authentication → URL Configuration** → *Site URL* = l'URL Vercel, et
   ajouter `http://localhost:3000/**` dans les *Redirect URLs* pour le
   développement local.

## 7. Recette une fois en ligne

1. `/register`, onglet **WhatsApp**, un vrai numéro guinéen → le code arrive
   par Fonnte.
2. Dérouler l'onboarding, publier une boutique.
3. Ouvrir `/<slug>` sur un téléphone, passer une commande → le vendeur reçoit le
   message WhatsApp, la commande apparaît au tableau de bord.
4. Vérifier que « Commandes WhatsApp » n'augmente que via le bouton
   « Commander sur WhatsApp » d'une fiche produit.

---

## Note sur Cloudflare R2

Le `.env.local` du legacy **ne contient aucune clé R2** : le stockage R2 n'a
jamais été mis en place, il n'attend pas seulement des accès. Le projet tourne
donc sur Supabase Storage, isolé dans `src/lib/storage.ts`. Basculer sur R2 plus
tard ne touchera que ce fichier et `next.config.ts` (domaine des images).
