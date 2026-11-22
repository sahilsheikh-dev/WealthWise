import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DateField } from './form/DateField';
import { MoneyField } from './form/MoneyField';
import { TopAnchoredSheet } from './TopAnchoredSheet';
import { AppText, Button } from './ui';
import { monthEndDate } from '../domain/cashFlow';
import { isValidISO, monthKey, shiftMonth } from '../domain/dates';
import { todayISO } from '../lib/clock';
import { formatDate } from '../lib/format';
import { typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function PaidAmountDialog({
  visible,
  title,
  dueAmount,
  dueDate,
  defaultDate,
  onPaid,
  onNotPaid,
}: {
  visible: boolean;
  title: string;
  dueAmount: number;
  dueDate?: string;
  defaultDate?: string;
  onPaid: (amount: number, date: string) => void;
  onNotPaid: () => void;
}) {
  const { colors } = useTheme();
  const effectiveDefaultDate = defaultDate && isValidISO(defaultDate) ? defaultDate : todayISO();
  const [amount, setAmount] = useState(String(dueAmount));
  const [paymentDate, setPaymentDate] = useState(effectiveDefaultDate);
  const [error, setError] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setAmount(String(dueAmount));
      setPaymentDate(effectiveDefaultDate);
      setError(undefined);
      setDateError(undefined);
    }, 0);
    return () => clearTimeout(timer);
  }, [dueAmount, effectiveDefaultDate, visible]);

  const paid = () => {
    let hasError = false;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100_000_000_000) {
      setError('Enter a paid amount greater than 0 within the supported range.');
      hasError = true;
    } else {
      setError(undefined);
    }
    if (!isValidISO(paymentDate)) {
      setDateError('Enter a valid date.');
      hasError = true;
    } else {
      setDateError(undefined);
    }
    if (hasError) return;
    onPaid(parsed, paymentDate);
  };

  const maxDate = monthEndDate(shiftMonth(monthKey(effectiveDefaultDate), 24));

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
        <DateField
          label="Payment date"
          accessibilityLabel="Payment date"
          value={paymentDate}
          onChange={setPaymentDate}
          maximumDate={maxDate}
          error={dateError}
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
