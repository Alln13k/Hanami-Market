# 🛒 Discord Shop — Bot + Panel Web

Système complet de shop Discord avec **livraison automatique de produits**, géré depuis un **panel web sur Vercel**.

## Architecture

```
┌─────────────┐   base MySQL    ┌──────────────────┐
│   BOT       │◄──────────────►│      PANEL        │
│ (discord.js)│   (partagée)   │ (Next.js/Vercel)  │
│ 1€/mois VPS │                │      serverless   │
└─────────────┘                └──────────────────┘
     │ ▲                              │
     │ │  table BotAction (panel→bot) │
     │ └──────────────────────────────┘
     ▼
  Discord : tickets, embeds, livraison DM, rôles
```

- **Le bot** tourne 24/7 sur ton hébergeur à 1€/mois (1 Go RAM suffit largement).
- **Le panel** est déployé sur Vercel (serverless → **gratuit**, pas besoin de payer un VPS pour ça).
- **La base MySQL** de ton hébergeur est partagée par les deux.
- Quand le panel confirme un paiement, il écrit une ligne dans `BotAction` → le bot la voit (poll 5s) → livre le produit en DM, attribue le rôle, notifie le staff.

## Fonctionnalités

- 🛒 `/shop` : catalogue interactif (menu déroulant)
- 🛒 `/buy` : achat direct d'un produit
- 💳 Paiement **Litecoin** (NowPayments) → **livraison automatique** + vérif via webhook et polling de secours
- 💳 Paiement **PayPal** (lien paypal.me) → confirmation manuelle par le vendeur (Discord `/confirm` ou bouton du panel)
- 🎫 Tickets d'achat/support avec catégories et bouton de fermeture
- 📦 Gestion de stock (ajout en masse, suivi des ventes)
- ✅ Attribution automatique de rôle après achat
- 📊 `/stats` : statistiques du shop
- 🌐 Panel web : produits, stock, commandes, tickets, réglages, tableau de bord

---

## 1. Prérequis

- Node.js **18+** (le VPS de ton hébergeur doit avoir Node 18+ — vérifie dans son panneau, sinon ouvre un ticket chez lui pour le changer)
- Un compte Discord développeur avec un bot (`https://discord.com/developers/applications`)
- Une base **MySQL/MariaDB** (celle de ton hébergeur)
- Un compte **NowPayments** pour le Litecoin (`https://nowpayments.io`)
- Un compte **Vercel** (`https://vercel.com`)

---

## 2. La base de données

Ton hébergeur te donne des identifiants MySQL. Note-les :

```
HOST, PORT (souvent 3306), USER, PASSWORD, DATABASE
```

> ⚠️ Si ta base n'est accessible que depuis le VPS (localhost), il faudra **autoriser les connexions externes** pour que Vercel puisse la joindre. Certains hébergeurs le bloquent — renseigne-toi chez eux, sinon héberge la base sur **aiven.io free tier** ou **Neon**.

### Créer le schéma

Depuis le dossier `discord-shop` :

```bash
cd bot
copy .env.example .env      # remplis DATABASE_URL
npm install
npx prisma db push          # crée les tables dans ta base
```

---

## 3. Le bot Discord

### Créer le bot

1. Va sur [discord.com/developers/applications](https://discord.com/developers/applications) → New Application
2. Onglet **Bot** → copy le **Token**
3. Active **Presence Intent** + **Server Members Intent** dans l'onglet Bot
4. Onglet **OAuth2 → URL Generator** :
   - Scope : `bot` + `applications.commands`
   - Permissions : `Manage Roles`, `Manage Channels`, `View Channels`, `Send Messages`, `Embed Links`, `Read Message History`, `Manage Messages`
   - Copie l'URL générée et invite le bot sur ton serveur

### Configurer

Remplis `bot/.env` :

```
DISCORD_TOKEN=...
CLIENT_ID=...                # ID application (OAuth2 > General)
DATABASE_URL=mysql://...
NOWPAYMENTS_API_KEY=...
PAYPAL_ME=ton_pseudo         # pour les liens paypal.me
PANEL_URL=https://ton-panel.vercel.app   # URL du panel une fois déployé
```

### Lancer

```bash
cd bot
npm run deploy    # enregistre les commandes slash
npm start         # démarre le bot (met ça dans un process manager type PM2)
```

> 💡 Sur ton hébergeur : installe Node, `npm install`, puis lance `npm start`. Un process manager (PM2) est fortement conseillé pour relancer automatiquement le bot.

### Installation sur ton serveur Discord

1. `/setup` dans le salon staff → configure salon admin + catégorie Tickets + rôle admin
2. `/ticket` dans le salon public → pose le bouton "Ouvrir un ticket"
3. `/addstock produit:Nom du produit donnee:contenu` pour ajouter du stock

---

## 4. Le panel web (Vercel)

### Configuration

Remplis `web/.env.example` → renomme en `.env.local` pour le dev, et crée les mêmes variables dans Vercel :

```
DATABASE_URL=mysql://...
PANEL_PASSWORD=mot_de_passe_admin
SESSION_SECRET=chaine_aleatoire_tres_longue
NOWPAYMENTS_API_KEY=...
PAYPAL_ME=ton_pseudo
```

### Déployer

1. Pousse le dossier `discord-shop` sur GitHub
2. Sur Vercel : **New Project** → importe le repo → **Root Directory : `web`**
3. Framework : **Next.js** (détecté automatiquement)
4. Ajoute les variables d'env → **Deploy**

> Le panel est déployé automatiquement à chaque `git push` sur main.

---

## 5. Paiements

### Litecoin (automatique)

1. Sur [nowpayments.io](https://nowpayments.io) → crée un compte → **API Keys** → copie ta clé
2. Le bot crée une adresse LTC par commande, l'acheteur envoie les LTC
3. NowPayments envoie un **webhook** vers `https://ton-panel.vercel.app/api/webhook/nowpayments`
4. Le webhook confirme le paiement → le bot livre automatiquement
5. **Secours** : le bot vérifie aussi le statut du paiement toutes les 45s si le webhook n'arrive pas

### PayPal (manuel)

1. Crée un compte PayPal et note ton pseudo `paypal.me`
2. L'acheteur paye via `https://paypal.me/TON_PSEUDO/MONTANT`
3. Il envoie l'ID de transaction / capture dans son ticket
4. Le vendeur vérifie sur PayPal puis confirme dans le **panel** (bouton "Confirmer paiement") ou via `/confirm`

---

## 6. Sécurité

- Le mot de passe du panel est dans `PANEL_PASSWORD` (jamais dans le code)
- Les sessions sont signées (`SESSION_SECRET`) et HTTP-only
- Le webhook NowPayments est vérifié par signature HMAC
- Ne commit jamais ton `.env` (le `.gitignore` l'exclut)

## Structure des dossiers

```
discord-shop/
├── bot/                 # Bot Discord (discord.js v14)
│   └── src/
│       ├── commands/    # commandes slash
│       ├── events/      # gestion interactions
│       ├── services/    # paiements, livraison, worker
│       └── index.js
├── web/                 # Panel admin (Next.js App Router)
│   └── src/app/         # pages + routes API + webhook
└── shared/prisma/       # schéma MySQL unique (partagé)
```