import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  adminRoleId: process.env.ADMIN_ROLE_ID,
  defaultColor: process.env.DEFAULT_COLOR || 'f49ecd',
};