# 🛒 Hanami Market — Panel Web

Panel d'administration du shop Discord, déployé sur **Vercel**. Ce dépôt contient **uniquement le panel web** (le bot Discord est hébergé séparément et communique via la base de données partagée).

## Fonctionnalités

- 📊 Tableau de bord : commandes, revenus, stock, actions du bot en attente
- 📦 Gestion des produits : prix, description, couleur, rôle à attribuer, stock
- 📦 Ajout de stock en masse (un article par ligne)
- 🧾 Commandes : suivi, confirmation de paiement PayPal, remboursement
- 🎫 Tickets d'achat/support (fermeture → le bot supprime le salon Discord)
- ⚙️ Réglages synchronisés avec le bot
- 🌐 Page publique de suivi de commande `/suivi/[id]`
- 🔔 Webhook NowPayments `/api/webhook/nowpayments` (paiements Litecoin)

## Architecture

```
┌─────────────┐   base MySQL    ┌──────────────────┐
│   BOT       │◄──────────────►│   CE PANEL        │
│ (discord.js)│   (partagée)   │ (Next.js/Vercel)  │
│ autre héberg│                │      serverless   │
└─────────────┘                └──────────────────┘
     │ ▲                              │
     │ │  table BotAction (panel→bot) │
     │ └──────────────────────────────┘
     ▼
  Discord : tickets, livraison DM, rôles
```

Quand le panel confirme un paiement, il écrit une ligne dans la table `BotAction` → le bot la voit (poll 5s) → livre le produit en DM, attribue le rôle, notifie le staff.

## Déploiement sur Vercel

1. Importe ce dépôt sur [vercel.com](https://vercel.com) → **New Project** → `Hanami-Market`
2. Framework **Next.js** détecté automatiquement (projet à la racine)
3. Ajoute les variables d'environnement :

```
DATABASE_URL=mysql://user:pass@host:3306/nom_base
PANEL_PASSWORD=mot_de_passe_admin
SESSION_SECRET=chaine_aleatoire_tres_longue
NOWPAYMENTS_API_KEY=ta_cle
PAYPAL_ME=ton_pseudo_paypal
```

4. **Deploy**

## Développement local

```bash
npm install
npx prisma generate        # génère le client Prisma depuis shared/prisma/schema.prisma
npm run dev
```

## Base de données

Le schéma MySQL partagé est dans `shared/prisma/schema.prisma`. Pour créer les tables :

```bash
npx prisma db push
```

## Structure

```
├── src/
│   ├── app/            # pages + routes API + webhook
│   │   ├── (panel)/    # interface admin protégée
│   │   ├── suivi/      # page publique de suivi
│   │   └── api/        # routes API (auth, produits, commandes, tickets, webhook)
│   ├── lib/            # prisma, auth
│   └── middleware.ts   # protection des pages
└── shared/prisma/      # schéma Prisma (partagé avec le bot)
```