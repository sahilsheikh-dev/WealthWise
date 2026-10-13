export function fitsInline(
  containerWidth: number,
  titleWidth: number,
  chipWidth: number,
  gap = 12,
): boolean {
  return containerWidth >= titleWidth + chipWidth + gap;
}
