import { fitsInline } from '../sectionLayout';

describe('section header inline fit', () => {
  it('includes title, chip and gap and honors the exact fit boundary', () => {
    expect(fitsInline(299, 180, 107, 12)).toBe(true);
    expect(fitsInline(298, 180, 107, 12)).toBe(false);
    expect(fitsInline(180, 180, 100, 12)).toBe(false);
  });

  it('uses the supplied gap when checking the boundary', () => {
    expect(fitsInline(280, 180, 100)).toBe(false);
    expect(fitsInline(280, 180, 100, 0)).toBe(true);
  });
});
