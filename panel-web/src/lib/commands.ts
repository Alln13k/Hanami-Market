const TYPES = ['TEXT', 'EMBED', 'DM', 'DM_USER', 'REACT', 'DELETE', 'WAIT'];

export type CommandStep = {
  type: string;
  text: string;
  title: string;
  description: string;
  color: string;
  imageUrl: string;
  footer: string;
  reactions: string;
  wait: number;
};

export function normalizeSteps(steps: unknown): CommandStep[] {
  if (!Array.isArray(steps)) {
    return [{ type: 'TEXT', text: '', title: '', description: '', color: 'f49ecd', imageUrl: '', footer: '', reactions: '', wait: 0 }];
  }
  const out = steps
    .map((s: any) => ({
      type: TYPES.includes(s?.type) ? s.type : 'TEXT',
      text: String(s?.text || ''),
      title: String(s?.title || '').slice(0, 256),
      description: String(s?.description || ''),
      color: String(s?.color || 'f49ecd').replace('#', ''),
      imageUrl: String(s?.imageUrl || ''),
      footer: String(s?.footer || ''),
      reactions: String(s?.reactions || ''),
      wait: Math.max(0, parseInt(s?.wait, 10) || 0),
    }))
    .filter((s) => !(s.type === 'WAIT' && s.wait <= 0));
  return out.length > 0 ? out : [{ type: 'TEXT', text: '', title: '', description: '', color: 'f49ecd', imageUrl: '', footer: '', reactions: '', wait: 0 }];
}