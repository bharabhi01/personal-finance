const wave = (phase: number, amp: number) =>
  Array.from({ length: 61 }, (_, i) => `${i ? 'L' : 'M'}${(i * 5).toFixed(1)} ${(40 + Math.sin(i / 4.5 + phase) * amp * Math.sin(i / 19 + phase / 2)).toFixed(1)}`).join('');

/** Stacked line-art ellipses; purely decorative. */
export function Rings({ className }: { className?: string }) {
  return (
    <svg className={'art ' + (className ?? '')} viewBox="0 0 200 200" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => {
        const rx = 22 + Math.abs(i - 4) * 14;
        return <ellipse key={i} cx="100" cy={44 + i * 14} rx={rx} ry={rx * 0.32} />;
      })}
      <circle cx="100" cy="100" r="3.5" className="art-dot" />
    </svg>
  );
}

/** Interlaced sine lines; purely decorative. */
export function Waves({ className }: { className?: string }) {
  return (
    <svg className={'art ' + (className ?? '')} viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
      {[0, 0.7, 1.4, 2.1, 2.8].map((p) => <path key={p} d={wave(p, 26)} />)}
    </svg>
  );
}

/** A half-ellipse scale with a lime marker at `share` (0–1) of the way along. */
export function Arc({ share, className }: { share: number; className?: string }) {
  const at = (t: number) => ({ x: 150 + 130 * Math.cos(Math.PI * (1 - t)), y: 100 - 90 * Math.sin(Math.PI * (1 - t)) });
  const marker = at(Math.min(Math.max(share, 0), 1));
  return (
    <svg className={'art ' + (className ?? '')} viewBox="0 0 300 110" aria-hidden="true">
      <path d="M20 100 A130 90 0 0 1 280 100" />
      {[0, 1 / 7, 2 / 7, 3 / 7, 4 / 7, 5 / 7, 6 / 7, 1].map((t) => <circle key={t} cx={at(t).x} cy={at(t).y} r="2" className="art-fill" />)}
      <circle cx={marker.x} cy={marker.y} r="6" className="art-dot" />
    </svg>
  );
}
