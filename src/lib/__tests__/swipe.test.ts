import { swipeIntent } from '../swipe';

describe('swipeIntent', () => {
  it('detects horizontal swipes', () => {
    expect(swipeIntent({ dx: 100, dy: 10, vx: 1 })).toBe('prev');
    expect(swipeIntent({ dx: -100, dy: 10, vx: -1 })).toBe('next');
    expect(swipeIntent({ dx: 20, dy: 10, vx: 0 })).toBeNull();
    expect(swipeIntent({ dx: 0, dy: 20, vx: 0 })).toBeNull();
  });
});
