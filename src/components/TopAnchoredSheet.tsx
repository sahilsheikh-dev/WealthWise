import { useEffect, useState, type PropsWithChildren } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/useTheme';

export function TopAnchoredSheet({
  visible,
  onClose,
  children,
  sheetTestID,
  contentStyle,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  sheetTestID: string;
  contentStyle?: StyleProp<ViewStyle>;
}>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return undefined;
    }
    const shown = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} testID={`${sheetTestID}-modal`}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss sheet"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID={`${sheetTestID}-backdrop`}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top}
          style={[styles.keyboardAvoiding, { paddingTop: insets.top }]}>
          <View
            testID={sheetTestID}
            style={[
              styles.sheet,
              { maxHeight: Math.max(0, height * 0.6 - keyboardHeight), backgroundColor: colors.surface, borderColor: colors.border },
              contentStyle,
            ]}>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  keyboardAvoiding: { flex: 1, alignItems: 'stretch' },
  sheet: {
    flexShrink: 1,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
});
