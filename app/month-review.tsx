import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { ChoiceField } from '../src/components/form/ChoiceField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { MoneyField } from '../src/components/form/MoneyField';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, Card, DetailTabBar, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import {
  monthEndDate,
  monthPositionAt,
  reviewableMonths,
  shortfallForMonth,
  surplusForMonth,
  type ShortfallAllocation,
  type SurplusAllocation,
} from '../src/domain/cashFlow';
import { budgetMonthView } from '../src/domain/budget';
import { listInstruments } from '../src/domain/instruments';
import { loanState } from '../src/domain/liability';
import {
  makeMonthAllocationFormSchema,
  type MonthAllocationFormInput,
  type MonthAllocationFormOutput,
} from '../src/domain/schemas';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { formatMonth } from '../src/lib/format';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function MonthReviewScreen() {
  const params = useLocalSearchParams<{ month?: string }>();
  const paramMonth = Array.isArray(params.month) ? params.month[0] : params.month;
  const data = useAppStore((state) => state.data);
  const today = useMemo(() => todayISO(), []);
  const reviews = useMemo(() => reviewableMonths(data, today), [data, today]);
  const selected = reviews.find((item) => item.month === paramMonth) ?? reviews[0];
  if (!selected) {
    return (
      <FormScreen
        title="Month review"
        onClose={() => router.back()}
        isDirty={false}
        footer={<Button label="Back" onPress={() => router.back()} />}
        bottomNavigation={<DetailTabBar active="Budget" placement="flow" />}>
        <EmptyState title="No month needs review" subtitle="Closed months with a logged cash balance will appear here." />
      </FormScreen>
    );
  }
  return <MonthReview month={selected.month} key={selected.month} />;
}

function MonthReview({ month }: { month: string }) {
  const { colors } = useTheme();
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const today = useMemo(() => todayISO(), []);
  const position = useMemo(() => monthPositionAt(data.transactions, month), [data.transactions, month]);
  const budgetView = useMemo(() => budgetMonthView(data, month), [data, month]);
  const mode = position.closing < 0 ? 'shortfall' : 'surplus';
  const available = mode === 'shortfall' ? shortfallForMonth(data, month) : surplusForMonth(data, month);
  const [shortfallAllocations, setShortfallAllocations] = useState<ShortfallAllocation[]>([]);
  const [surplusAllocations, setSurplusAllocations] = useState<SurplusAllocation[]>([]);
  const allocationsTotal = mode === 'shortfall'
    ? shortfallAllocations.reduce((sum, item) => sum + item.amount, 0)
    : surplusAllocations.reduce((sum, item) => sum + item.amount, 0);
  const remaining = Math.max(0, available - allocationsTotal);
  const dueDate = monthEndDate(month);
  const instruments = useMemo(() => listInstruments(data, today).filter((item) => item.canWithdraw), [data, today]);
  const investable = useMemo(
    () => data.holdings.filter((item) => item.kind !== 'plan' || item.startDate <= dueDate),
    [data.holdings, dueDate],
  );
  const liabilities = useMemo(
    () => data.liabilities.filter((item) => item.startDate <= dueDate && loanState(item, dueDate).balance >= 1),
    [data.liabilities, dueDate],
  );
  const liabilitiesWithoutOrigin = useMemo(() => liabilities.filter((liability) =>
    !data.transactions.some((item) => item.source?.kind === 'liability-origin' && item.source.parentId === liability.id)),
  [data.transactions, liabilities]);
  const schema = useMemo(() => makeMonthAllocationFormSchema(mode, {
    liabilityIds: (mode === 'shortfall' ? liabilitiesWithoutOrigin : liabilities).map((item) => item.id),
    instrumentIds: (mode === 'shortfall' ? instruments : investable).map((item) => item.id),
    maximumAmount: remaining,
  }), [instruments, investable, liabilities, liabilitiesWithoutOrigin, mode, remaining]);
  const defaultKind = mode === 'shortfall' ? 'borrowed' : 'invest';
  const { control, handleSubmit, resetField, setValue, formState: { errors, isDirty, isSubmitting, submitCount } } =
    useForm<MonthAllocationFormInput, undefined, MonthAllocationFormOutput>({
      resolver: zodResolver(schema),
      mode: 'onTouched',
      reValidateMode: 'onChange',
      defaultValues: { allocationKind: defaultKind, amount: '', targetId: '', lenderName: '', note: '' },
    });
    const allocationKind = useWatch({ control, name: 'allocationKind' });
    const submitting = useRef(false);

  const addAllocation = (values: MonthAllocationFormOutput) => {
    if (mode === 'shortfall') {
      if (values.allocationKind === 'borrowed') {
        setShortfallAllocations((items) => [...items, {
          kind: 'borrowed', amount: values.amount, lenderName: values.lenderName,
        }]);
      } else if (values.allocationKind === 'loan-proceeds') {
        setShortfallAllocations((items) => [...items, {
          kind: 'loan-proceeds', amount: values.amount, liabilityId: values.targetId,
        }]);
      } else if (values.allocationKind === 'withdrawal') {
        setShortfallAllocations((items) => [...items, {
          kind: 'withdrawal', amount: values.amount, instrumentId: values.targetId,
        }]);
      } else {
        setShortfallAllocations((items) => [...items, {
          kind: 'own-funds', amount: values.amount, note: values.note,
        }]);
      }
    } else if (values.allocationKind === 'invest') {
      setSurplusAllocations((items) => [...items, {
        kind: 'invest', amount: values.amount, instrumentId: values.targetId,
      }]);
    } else if (values.allocationKind === 'ef') {
      setSurplusAllocations((items) => [...items, { kind: 'ef', amount: values.amount }]);
    } else {
      setSurplusAllocations((items) => [...items, {
        kind: 'liability', amount: values.amount, liabilityId: values.targetId,
      }]);
    }
    resetField('amount', { defaultValue: '' });
  };

  const saveAllocations = () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (mode === 'shortfall' && shortfallAllocations.length > 0) {
        actions.fundShortfall(month, shortfallAllocations);
      } else if (mode === 'surplus' && surplusAllocations.length > 0) {
        actions.allocateSurplus(dueDate, surplusAllocations);
      }
      if (!useAppStore.getState().lastError) router.back();
    } finally {
      submitting.current = false;
    }
  };

  const kindChoices = mode === 'shortfall'
    ? ['borrowed', 'loan-proceeds', 'withdrawal', 'own-funds']
    : ['invest', 'ef', 'liability'];
  const kindLabels: Record<string, string> = {
    borrowed: 'Borrowed',
    'loan-proceeds': 'Loan proceeds',
    withdrawal: 'Savings or investments',
    'own-funds': 'Own funds',
    invest: 'Invest',
    ef: 'Emergency fund',
    liability: 'Repay a liability',
  };
  const targetChoices = allocationKind === 'loan-proceeds' || allocationKind === 'liability'
    ? (allocationKind === 'loan-proceeds' ? liabilitiesWithoutOrigin : liabilities).map((item) => item.id)
    : allocationKind === 'withdrawal'
      ? instruments.map((item) => item.id)
      : allocationKind === 'invest' ? investable.map((item) => item.id) : [];
  const targetLabels = Object.fromEntries([
    ...liabilities.map((item) => [item.id, `${item.name} · ${formatAmount(loanState(item, dueDate).balance, 'exact', 1)}`]),
    ...instruments.map((item) => [item.id, `${item.name} · ${formatAmount(item.valueNow, 'exact', 1)}`]),
    ...investable.map((item) => [item.id, item.name]),
  ]);
  const items = mode === 'shortfall' ? shortfallAllocations : surplusAllocations;
  const allocationName = (kind: string) => kindLabels[kind] ?? kind;

  return (
    <FormScreen
      title="Month review"
      onClose={() => router.back()}
      isDirty={isDirty}
      bottomNavigation={<DetailTabBar active="Budget" placement="flow" />}
      footer={<View style={{ gap: 8 }}>
        <Button
          label={mode === 'shortfall' ? 'Record funding' : 'Save allocations'}
          icon="check"
          variant="primary"
          disabled={isSubmitting || (mode === 'shortfall' ? shortfallAllocations.length === 0 : false)}
          onPress={saveAllocations}
        />
        {mode === 'surplus' ? <Button label="Keep as cash" onPress={() => router.back()} /> : null}
      </View>}>
      <FormErrorBanner message={lastError} />
      <AppText weight="bold">{formatMonth(month)}</AppText>
      <Card style={{ gap: 8, marginHorizontal: 0 }}>
        <AppText>Opening balance · {formatAmount(position.opening, 'exact', 1)}</AppText>
        <AppText>Earned income · {formatAmount(position.earnedIncome, 'exact', 1)}</AppText>
        <AppText weight="semibold">Income by source</AppText>
        {budgetView.income.bySource.map(({ category, amount }) => (
          <AppText key={category}>{category} · {formatAmount(amount, 'exact', 1)}</AppText>
        ))}
        {budgetView.income.bySource.length === 0 ? <AppText>No earned income by source.</AppText> : null}
        {budgetView.otherMoneyIn > 0
          ? <AppText>Other money in (not income) · {formatAmount(budgetView.otherMoneyIn, 'exact', 1)}</AppText>
          : null}
        <AppText>Withdrawals · {formatAmount(position.withdrawals, 'exact', 1)}</AppText>
        <AppText>Borrowed · {formatAmount(position.borrowed, 'exact', 1)}</AppText>
        <AppText>Loan proceeds · {formatAmount(position.loanProceeds, 'exact', 1)}</AppText>
        <AppText>Own funds · {formatAmount(position.ownFunds, 'exact', 1)}</AppText>
        <AppText>Expenses · {formatAmount(position.expense, 'exact', 1)}</AppText>
        <AppText>Investments · {formatAmount(position.invest, 'exact', 1)}</AppText>
        <AppText weight="bold">Closing balance · {formatAmount(position.closing, 'exact', 1)}</AppText>
      </Card>
      <AppText style={{ color: colors.text2 }}>
        This balance only reflects what you have logged. If you had money before you started, add it as Own funds.
      </AppText>
      <AppText weight="semibold">
        {mode === 'shortfall' ? `Shortfall ${formatAmount(available, 'exact', 1)}` : `Surplus ${formatAmount(available, 'exact', 1)}`}
      </AppText>
      {mode === 'shortfall' ? <AppText>Still to explain {formatAmount(remaining, 'exact', 1)}</AppText> : null}
      {items.map((item, index) => (
        <View key={`${item.kind}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText style={{ flex: 1 }}>{allocationName(item.kind)} · {formatAmount(item.amount, 'exact', 1)}</AppText>
          <Button
            label="Remove"
            variant="danger-text"
            onPress={() => {
              if (mode === 'shortfall') setShortfallAllocations((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
              else setSurplusAllocations((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
            }}
          />
        </View>
      ))}
      <ChoiceField
        label="How was it funded?"
        choices={kindChoices}
        choiceLabels={kindLabels}
        value={allocationKind}
        onChange={(value) => {
          if (value === 'borrowed' || value === 'loan-proceeds' || value === 'withdrawal' ||
            value === 'own-funds' || value === 'invest' || value === 'ef' || value === 'liability') {
            setValue('allocationKind', value, { shouldDirty: true, shouldValidate: true });
            setValue('targetId', '', { shouldDirty: true, shouldValidate: true });
          }
        }}
      />
      {allocationKind === 'borrowed' ? (
        <Controller control={control} name="lenderName" render={({ field }) => (
          <TextField label="Borrowed from" accessibilityLabel="Lender name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.lenderName?.message} />
        )} />
      ) : null}
      {targetChoices.length > 0 ? (
        <Controller control={control} name="targetId" render={({ field }) => (
          <ChoiceField label="Choose" choices={targetChoices} choiceLabels={targetLabels} value={field.value} onChange={field.onChange} error={errors.targetId?.message} />
        )} />
      ) : null}
      <Controller control={control} name="amount" render={({ field }) => (
        <MoneyField label="Amount" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />
      )} />
      {allocationKind === 'own-funds' ? (
        <Controller control={control} name="note" render={({ field }) => (
          <TextField label="Note" accessibilityLabel="Allocation note" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
        )} />
      ) : null}
      <Button
        label="Add allocation"
        icon="plus"
        disabled={submitCount > 0 && Object.keys(errors).length > 0}
        onPress={() => {
          if (!submitting.current) void handleSubmit(addAllocation)();
        }}
      />
      <Button label="Back to transactions" onPress={() => router.push('/(tabs)/transactions')} />
    </FormScreen>
  );
}
