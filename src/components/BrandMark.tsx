import { Image } from 'react-native';

export function BrandMark({ size = 72 }: { size?: number }) {
  return (
    <Image
      accessibilityLabel="Wealth Wise"
      source={require('../../assets/images/mark.png')}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
}
