export type SwipeIntent = 'next' | 'prev';

export function swipeIntent({ dx, dy, vx }: { dx: number; dy: number; vx: number }): SwipeIntent | null {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const absVx = Math.abs(vx);

  if (absDx < 2 * absDy) return null;
  const clearIntent = absDx >= 60 || (absVx >= 0.5 && absDx >= 30);
  if (!clearIntent) return null;
  return dx < 0 ? 'next' : 'prev';
}
