import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { fitsInline } from '../lib/sectionLayout';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { AppText } from './ui';

export function SectionHeaderRow({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right: ReactNode;
}) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [titleWidth, setTitleWidth] = useState(0);
  const [subtitleWidth, setSubtitleWidth] = useState(0);
  const [rightWidth, setRightWidth] = useState(0);
  const [rightHeight, setRightHeight] = useState(0);
  const measured = containerWidth > 0 && titleWidth > 0 && rightWidth > 0 && rightHeight > 0;
  const naturalTitleWidth = Math.max(titleWidth, subtitleWidth);
  const inline = measured && fitsInline(containerWidth, naturalTitleWidth, rightWidth, 12);
  const reportRightLayout = (event: LayoutChangeEvent) => {
    setRightWidth(event.nativeEvent.layout.width);
    setRightHeight(event.nativeEvent.layout.height);
  };

  return (
    <View
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      style={[styles.container, !measured && styles.measuring, inline ? styles.inline : styles.stacked]}>
      <View style={[styles.titleBlock, inline && styles.titleInline]}>
        <AppText
          weight="bold"
          numberOfLines={1}
          onLayout={(event) => setTitleWidth(event.nativeEvent.layout.width)}
          style={[typography.name, { color: colors.text3 }]}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            numberOfLines={1}
            onLayout={(event) => setSubtitleWidth(event.nativeEvent.layout.width)}
            style={[typography.meta, { color: colors.text3 }]}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View
        onLayout={reportRightLayout}
        accessibilityElementsHidden={!measured}
        importantForAccessibility={measured ? 'auto' : 'no-hide-descendants'}
        style={[styles.right, inline && styles.rightInline]}>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 8 },
  measuring: { opacity: 0 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  titleBlock: { minWidth: 0, gap: 2 },
  titleInline: { flex: 1 },
  right: { alignSelf: 'flex-start' },
  rightInline: { alignSelf: 'center' },
});
