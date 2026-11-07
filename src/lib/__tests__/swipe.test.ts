import { swipeIntent } from '../swipe';

describe('swipeIntent', () => {
  it('enforces the horizontal-dominance boundary', () => {
    expect(swipeIntent({ dx: 60, dy: 30, vx: 0 })).toBe('prev');
    expect(swipeIntent({ dx: 59.9, dy: 30, vx: 0 })).toBeNull();
    expect(swipeIntent({ dx: 0, dy: 20, vx: 0 })).toBeNull();
  });

  it('accepts distance and velocity thresholds in both directions', () => {
    expect(swipeIntent({ dx: 60, dy: 0, vx: 0 })).toBe('prev');
    expect(swipeIntent({ dx: 30, dy: 0, vx: 0.5 })).toBe('prev');
    expect(swipeIntent({ dx: 29.9, dy: 0, vx: 0.5 })).toBeNull();
    expect(swipeIntent({ dx: 30, dy: 0, vx: 0.49 })).toBeNull();
    expect(swipeIntent({ dx: -100, dy: 10, vx: -1 })).toBe('next');
  });

  it('detects horizontal intent at the distance and velocity boundaries', () => {
    expect(swipeIntent({ dx: 60, dy: 30, vx: 0 })).toBe('prev');
    expect(swipeIntent({ dx: -60, dy: 30, vx: 0 })).toBe('next');
    expect(swipeIntent({ dx: 30, dy: 15, vx: 0.5 })).toBe('prev');
    expect(swipeIntent({ dx: -30, dy: 15, vx: -0.5 })).toBe('next');
    expect(swipeIntent({ dx: 59, dy: 30, vx: 0.49 })).toBeNull();
    expect(swipeIntent({ dx: 29, dy: 14, vx: 0.5 })).toBeNull();
    expect(swipeIntent({ dx: 60, dy: 31, vx: 1 })).toBeNull();
    expect(swipeIntent({ dx: 20, dy: 10, vx: 0 })).toBeNull();
    expect(swipeIntent({ dx: 0, dy: 20, vx: 0 })).toBeNull();
  });
});
