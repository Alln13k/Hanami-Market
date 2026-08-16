import { EmbedBuilder } from 'discord.js';
import { config } from '../config.js';

export function hexToInt(hex) {
  const clean = String(hex || '').replace('#', '');
  return parseInt(clean, 16) || 0x5865f2;
}

export function shopEmbed(title, description, color = config.defaultColor) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(hexToInt(color))
    .setFooter({ text: 'Shop officiel' })
    .setTimestamp();
}