# 🛒 Hanami Market — Bot Discord

Bot Discord du shop, **100% autonome** dans ce dossier. À héberger sur un VPS / hébergeur (1 Go RAM suffit).

Il communique avec le panel web (`panel-web/`) via la base de données MySQL partagée : le panel écrit des actions dans la table `BotAction`, le bot les exécute (livraison, tickets, rôles).

## Contenu

```
bot/
├── src/
│   ├── commands/     # commandes slash (/shop, /buy, /ticket, /setup...)
│   ├── events/       # gestion des boutons, menus, interactions
│   ├── services/     # paiements, livraison, worker
│   └── index.js      # point d'entrée
├── prisma/
│   └── schema.prisma # schéma de la base (intégré, pas besoin d'aller ailleurs)
├── package.json
└── .env.example      # → à renommer en .env et remplir
```

## Configuration

Remplis `.env` (copie de `.env.example`) :

```
DISCORD_TOKEN=...
CLIENT_ID=...
DATABASE_URL=mysql://user:pass@host:3306/nom_base
NOWPAYMENTS_API_KEY=...
PAYPAL_ME=ton_pseudo
PANEL_URL=https://ton-panel.vercel.app
ADMIN_ROLE_ID=...
```

## Démarrage

```bash
npm install
npx prisma db push   # crée les tables dans la base
npm run deploy       # enregistre les commandes slash
npm start            # lance le bot
```

### Tourner en permanence (PM2)

```bash
npm install -g pm2
pm2 start "npm start" --name shop-bot
pm2 save
```

## Installation sur le serveur Discord

1. Invite le bot avec les permissions (Manage Roles, Manage Channels, Send Messages, Embed Links...)
2. `/setup` dans le salon staff → configure salon admin + catégorie Tickets + rôle admin
3. `/ticket` dans le salon public → pose le bouton "Ouvrir un ticket"
4. `/addstock produit:Nom donnee:contenu` → ajoute du stock

## Paiements

- **Litecoin** (NowPayments) : livraison automatique (webhook + polling de secours)
- **PayPal** (paypal.me) : confirmation manuelle via le panel ou `/confirm`