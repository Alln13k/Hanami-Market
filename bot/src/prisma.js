import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Récupère la valeur d'un paramètre global (avec valeur par défaut)
export async function getSetting(key, fallback = '') {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s ? s.value : fallback;
}

export async function setSetting(key, value) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}