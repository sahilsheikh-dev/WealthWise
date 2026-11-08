import { swipeIntent } from '../swipe';

describe('swipeIntent', () => {
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
