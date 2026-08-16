const PETALS = [
  { left: '4%', size: 22, duration: 16, delay: 0, emoji: '🌸' },
  { left: '12%', size: 16, duration: 22, delay: 3, emoji: '🌸' },
  { left: '22%', size: 26, duration: 19, delay: 6, emoji: '🌺' },
  { left: '34%', size: 14, duration: 25, delay: 1, emoji: '🌸' },
  { left: '46%', size: 20, duration: 17, delay: 8, emoji: '🌺' },
  { left: '58%', size: 24, duration: 23, delay: 2, emoji: '🌸' },
  { left: '68%', size: 15, duration: 20, delay: 5, emoji: '🌸' },
  { left: '78%', size: 21, duration: 26, delay: 9, emoji: '🌺' },
  { left: '88%', size: 17, duration: 18, delay: 4, emoji: '🌸' },
  { left: '95%', size: 23, duration: 24, delay: 7, emoji: '🌸' },
];

export default function SakuraPetals() {
  return (
    <div className="sakura-petals" aria-hidden>
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: p.left,
            fontSize: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}