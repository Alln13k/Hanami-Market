import { prisma } from '@/lib/prisma';
import { PartyPopper, Pin, Send } from 'lucide-react';
import { WelcomeChannelForm } from './channel-form';
import { WelcomeForm } from './welcome-form';

export const dynamic = 'force-dynamic';

export default async function WelcomePage() {
  const [channels, channelSetting, titleSetting, descriptionSetting] = await Promise.all([
    prisma.guildChannel.findMany({ where: { isText: true }, orderBy: [{ position: 'asc' }] }),
    prisma.setting.findUnique({ where: { key: 'welcomeChannelId' } }),
    prisma.setting.findUnique({ where: { key: 'welcomeTitle' } }),
    prisma.setting.findUnique({ where: { key: 'welcomeDescription' } }),
  ]);

  return (
    <>
      <h1 className="page-title">Bienvenue</h1>
      <p className="page-sub">Quand un nouveau membre rejoint le serveur, le bot lui souhaite la bienvenue dans le salon choisi.</p>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Pin size={16} /> Salon des bienvenues</h2>
        <WelcomeChannelForm channels={channels} />
        {channelSetting?.value && (
          <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
            Salon actuel : {channels.find((c) => c.channelId === channelSetting.value)?.name || channelSetting.value}
          </p>
        )}
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Send size={16} /> Message de bienvenue</h2>
        <WelcomeForm
          initialTitle={titleSetting?.value || 'Bienvenue ! 🌸'}
          initialDescription={descriptionSetting?.value || 'Bienvenue {user} sur {server} ! 🌸\nDécouvre nos produits et rejoins la communauté.'}
          channelId={channelSetting?.value || ''}
        />
      </div>
    </>
  );
}