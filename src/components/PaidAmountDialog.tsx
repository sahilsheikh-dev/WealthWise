import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MoneyField } from './form/MoneyField';
import { TopAnchoredSheet } from './TopAnchoredSheet';
import { AppText, Button } from './ui';
import { formatDate } from '../lib/format';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function PaidAmountDialog({
  visible,
  title,
  dueAmount,
  dueDate,
  onPaid,
  onNotPaid,
}: {
  visible: boolean;
  title: string;
  dueAmount: number;
  dueDate?: string;
  onPaid: (amount: number) => void;
  onNotPaid: () => void;
}) {
  const { colors } = useTheme();
  const [amount, setAmount] = useState(String(dueAmount));
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      setAmount(String(dueAmount));
      setError(undefined);
    }
  }, [dueAmount, visible]);

  const paid = () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100_000_000_000) {
      setError('Enter a paid amount greater than 0 within the supported range.');
      return;
    }
    onPaid(parsed);
  };

  return (
    <TopAnchoredSheet
      visible={visible}
      onClose={onNotPaid}
      sheetTestID="paid-amount-dialog"
      centered
      contentStyle={styles.card}>
      <View style={styles.content}>
        <AppText weight="bold" style={typography.h1}>Was this paid?</AppText>
        <AppText weight="semibold" style={[typography.name, styles.item]}>{title}</AppText>
        {dueDate ? <AppText style={[typography.meta, { color: colors.text2 }]}>Due {formatDate(dueDate)}</AppText> : null}
        <MoneyField
          label="Amount"
          accessibilityLabel="Paid amount"
          value={amount}
          onChangeText={setAmount}
          error={error}
        />
        <View style={styles.actions}>
          <Button label="Paid" onPress={paid} />
          <Button label="Not paid" variant="soft" onPress={onNotPaid} />
        </View>
      </View>
    </TopAnchoredSheet>
  );
}

const styles = StyleSheet.create({
  card: { width: '88%', maxWidth: 420 },
  content: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  item: { marginTop: 2 },
  actions: { gap: 8, marginTop: 4 },
});
