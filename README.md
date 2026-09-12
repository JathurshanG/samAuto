# SamAuto

Plateforme automobile pour une entreprise française de vente de véhicules d’occasion et un opérateur d’atelier configurable. Monolithe Next.js prêt à être copié dans le dépôt GitHub SamAuto.

## Fonctionnalités livrées

- Site public : accueil, catalogue filtrable, fiche véhicule, reprise, financement, atelier, rendez-vous, contact et pages légales.
- Back-office protégé : dashboard, stock, CRUD véhicules, publication/réservation/vente, photos, leads, reprises, rendez-vous, atelier, clients, statistiques et paramètres.
- Supabase SSR/Auth, PostgreSQL, Storage privé, RLS explicite et séparation vente/atelier.
- Événements first-party : vues, appels, WhatsApp, formulaires et favoris.
- SEO : metadata dynamiques, canonical, sitemap, robots, OpenGraph et JSON-LD véhicule.
- Seed de démonstration fictif (10 véhicules et demandes associées).

## Architecture

- `app/` : App Router, pages publiques, administration et route handlers.
- `components/` : design system et composants partagés.
- `features/` : domaines métier (vehicles, leads, trade-ins, appointments, workshop, analytics, auth, settings).
- `lib/` et `services/` : Supabase SSR, validation, sécurité et accès métier.
- `supabase/migrations/` : migrations SQL versionnées et reproductibles.
- `supabase/seed.sql` : données fictives locales.

## Prérequis

Node.js 24.x, npm, un projet Supabase (ou la CLI Supabase pour le local). Versions principales dans `package.json` : Next 16.3.5, React 19.3.0, TypeScript 6.0.3, Tailwind 4.3.3, Supabase JS 2.116.0 et `@supabase/ssr` 0.12.7.

## Installation

```bash
npm install
cp .env.example .env.local
```

Renseigner les variables Supabase dans `.env.local`. Ne jamais exposer ni committer `SUPABASE_SERVICE_ROLE_KEY`.

### Supabase local

```bash
npm run db:start
npm run db:reset
npm run db:types
```

Pour un projet distant, appliquer les fichiers de `supabase/migrations` dans l’ordre via Supabase CLI, puis exécuter `supabase/bootstrap.sql` avec les identifiants de l’entreprise. Le seed est réservé au développement local.

## Développement et qualité

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run test:e2e` lance les parcours Playwright critiques. Les navigateurs Playwright doivent être installés dans l’environnement d’exécution.

## Déploiement Vercel

1. Importer le dépôt GitHub SamAuto dans Vercel.
2. Définir les variables d’environnement de production à partir de `.env.example`.
3. Configurer Supabase (URL, clé publishable, Auth SSR, Storage et policies).
4. Déployer avec la commande Vercel standard. Les migrations sont appliquées séparément et jamais pendant le build.

## Données et conformité

Les coordonnées, mentions légales, garanties, services atelier et opérateur sont des paramètres configurables ou des placeholders. Aucun avis, financement, certification ou donnée commerciale réelle n’est inventé. Le schéma distingue l’entreprise vendeuse de l’opérateur atelier. Les données sensibles (VIN interne, prix d’achat, marges) restent administratives.

## Dépôt GitHub

Cette archive ne contient aucun secret ni historique Git. Depuis la racine du dépôt existant SamAuto :

```bash
unzip samauto-package.zip
npm install
git add .
git commit -m "Initialize SamAuto automotive platform"
git push origin main
```

L’historique existant du dépôt doit être conservé ; ne pas créer de dépôt secondaire.
