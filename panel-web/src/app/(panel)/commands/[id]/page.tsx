import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CommandForm } from '../command-form';
import { DeleteCommandButton } from '../delete-button';

export const dynamic = 'force-dynamic';

export default async function CommandEditPage({ params }: { params: { id: string } }) {
  const [command, roles, channels] = await Promise.all([
    prisma.customCommand.findUnique({ where: { id: params.id } }),
    prisma.role.findMany({ orderBy: { position: 'desc' } }),
    prisma.guildChannel.findMany({ where: { isText: true }, orderBy: { position: 'asc' }, take: 200 }),
  ]);

  if (!command) notFound();

  return (
    <>
      <h1 className="page-title">Modifier la commande</h1>
      <p className="page-sub">Déclencheur <code>{command.trigger}</code> · utilisée <strong>{command.usageCount}</strong> fois</p>

      <div className="card" style={{ maxWidth: 760 }}>
        <CommandForm
          roles={roles}
          channels={channels}
          commandId={command.id}
          initial={{
            trigger: command.trigger,
            roleId: command.roleId || '',
            responseType: command.responseType,
            text: command.text,
            title: command.title,
            description: command.description,
            color: command.color,
            imageUrl: command.imageUrl,
            footer: command.footer,
            reactions: command.reactions,
            cooldown: String(command.cooldown),
            deleteTrigger: command.deleteTrigger,
            channelId: command.channelId || '',
            usageCount: command.usageCount,
          }}
        />
        <div style={{ marginTop: 16 }}>
          <DeleteCommandButton id={command.id} trigger={command.trigger} />
        </div>
      </div>

      <Link href="/commands" className="muted" style={{ display: 'inline-block', marginTop: 16 }}>← Retour aux commandes</Link>
    </>
  );
}