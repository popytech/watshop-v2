# Phase 1 — Auth & rôles

Ce que le code fait déjà, et les **quatre réglages à faire dans le tableau de bord Supabase**
pour que ça tourne. Rien ici ne demande de toucher au code.

---

## 1. Ce qui a été construit

| Besoin (ROADMAP, Phase 1) | Comment c'est fait |
|---|---|
| OTP WhatsApp intégré à Supabase Auth | Provider **Phone** de Supabase + **Send SMS Hook** qui appelle `/api/auth/hooks/send-sms`, lequel fait livrer le code par Fonnte sur WhatsApp. C'est Supabase qui génère, expire et vérifie le code. |
| OTP email | `signInWithOtp({ email })` natif, code à 6 chiffres. |
| Connexion Google conservée | `signInWithOAuth` + échange PKCE dans `/auth/callback`. |
| Rôles vendeur / agent / livreur / admin | `profiles.role` (enum `user_role`), vérifié côté serveur par `requireRole()` et côté base par les policies `*_admin_all` / `is_admin()`. |
| Vérification serveur sur chaque route protégée | `src/lib/dal.ts` (`verifySession`, `getProfile`, `requireRole`) appelé dans les layouts `/dashboard` et `/admin`. `src/proxy.ts` ne fait qu'un contrôle optimiste. |
| Fin du secret admin en dur côté client | Il n'existe plus : aucune variable `ADMIN_SECRET` dans le projet. L'accès admin vient du rôle en base. |

Différences volontaires avec le legacy :

- **Plus de table `whatsapp_otp_codes`.** Le legacy stockait ses propres codes, sans limite de
  tentatives et sans invalidation fiable. Supabase Auth s'en charge, avec ses propres quotas.
- **Plus de session en `localStorage`.** Les cookies sont posés par `@supabase/ssr`, en httpOnly.
- **Plus de `service_role` dans le chemin d'authentification.** Les écrans admin lisent avec le
  client de l'utilisateur connecté ; c'est la RLS qui autorise, pas une clé qui la contourne.
- **Escalade de privilèges bloquée en base.** Un vendeur peut modifier son profil mais pas son
  `role` : un trigger le refuse (la policy `UPDATE` seule ne compare pas l'ancien et le nouveau).

---

## 2. Réglages à faire dans Supabase

Projet concerné : `vgtlbnoiksnpwoxyncxt` (le projet **neuf**, pas le legacy).

### 2.1 Appliquer le schéma

- Base encore vide → exécuter `supabase/schema.sql` dans **SQL Editor**.
- Schéma Phase 0 déjà appliqué → exécuter `supabase/migrations/0001_phase1_auth_roles.sql`.

### 2.2 Récupérer les clés

**Project Settings → API**, puis remplir `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://vgtlbnoiksnpwoxyncxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
```

`SUPABASE_SERVICE_ROLE_KEY` n'est utilisée par aucun code de la Phase 1 ; elle est là pour la
création des commandes par un acheteur non connecté (Phase 3).

### 2.3 Activer l'OTP WhatsApp (provider Phone + hook Fonnte)

1. **Authentication → Hooks → Send SMS hook** → *Enable*, type **HTTPS**, URL :
   `https://<votre-domaine>/api/auth/hooks/send-sms`
2. Copier le **secret** affiché (`v1,whsec_…`) dans `.env.local` :
   `SUPABASE_SEND_SMS_HOOK_SECRET=v1,whsec_…`
3. **Authentication → Providers → Phone** → activer. Le hook remplace le fournisseur SMS : pas
   besoin de compte Twilio.
4. Renseigner `FONNTE_TOKEN` dans `.env.local`.

> ⚠️ Supabase appelle le hook depuis ses serveurs : l'URL doit être **publiquement joignable**.
> `http://localhost:3000` ne fonctionne pas. Pour tester l'OTP WhatsApp, déployer d'abord sur
> Vercel (une URL de preview suffit) et pointer le hook dessus. En local, tester avec le canal
> **email**, qui ne dépend d'aucun hook.

Si le plan Supabase ne donnait pas accès aux Auth Hooks, le repli serait de revenir à un OTP
maison (table + route serveur). Ça ne toucherait que `requestOtp`/`verifyOtp` dans
`src/lib/auth/actions.ts` et cette route de hook — le reste (rôles, DAL, RLS, écrans) est
indépendant du canal.

### 2.4 OTP email en 6 chiffres, et Google

- **Authentication → Email Templates → Magic Link** : le gabarit par défaut envoie un lien. Le
  code attendu par l'écran de connexion est `{{ .Token }}` — ajouter par exemple
  `Votre code : {{ .Token }}` dans le corps du message.
- **Authentication → Providers → Google** : coller le *Client ID* et le *Client Secret* de la
  console Google Cloud, et déclarer côté Google l'URL de redirection
  `https://vgtlbnoiksnpwoxyncxt.supabase.co/auth/v1/callback`.
- **Authentication → URL Configuration** : *Site URL* = l'URL publique de l'app, et ajouter
  `http://localhost:3000/**` dans les *Redirect URLs* pour le développement local.

---

## 3. Se donner le rôle admin

Le rôle ne s'attribue pas depuis l'interface (c'est justement le point) : créer d'abord son
compte normalement, puis, dans le SQL Editor :

```sql
update public.profiles set role = 'admin' where email = 'votre@email.com';
-- ou, pour un compte créé par WhatsApp :
update public.profiles set role = 'admin' where phone = '224622123456';
```

`/admin` devient alors accessible ; tout autre rôle est renvoyé vers `/acces-refuse`.

---

## 4. Vérifier que ça marche

```bash
npm run dev
```

1. `/register` → onglet **Email** → recevoir le code → il redirige vers `/dashboard`.
2. `/dashboard` en navigation privée → redirigé vers `/login?next=/dashboard`, puis ramené sur
   `/dashboard` après connexion.
3. `/admin` avec un compte vendeur → `/acces-refuse`. Avec le rôle `admin` → les compteurs.
4. Bouton de déconnexion → retour à `/login`, et `/dashboard` redevient inaccessible.
5. Une fois déployé : onglet **WhatsApp**, numéro guinéen → le code arrive par Fonnte.
