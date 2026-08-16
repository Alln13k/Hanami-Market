import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  nowpaymentsKey: process.env.NOWPAYMENTS_API_KEY,
  paypalMe: process.env.PAYPAL_ME,
  panelUrl: process.env.PANEL_URL,
  adminRoleId: process.env.ADMIN_ROLE_ID,
  defaultColor: process.env.DEFAULT_COLOR || '5865F2',
};