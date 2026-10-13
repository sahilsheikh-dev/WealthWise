import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '../src/components/AppHeader';
import { AppText, Button, Card, EmptyState, Screen, SectionTitle } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions, useAppData } from '../src/data/useAppData';
import { confirmAsync } from '../src/lib/confirm';
import { todayISO } from '../src/lib/clock';
import { formatAmount } from '../src/lib/amountDisplay';
import { AmountText } from '../src/components/AmountText';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

export default function BudgetTemplatesScreen() {
  const data = useAppData();
  const actions = useAppActions();
  const { colors } = useTheme();
  const templates = data.budgetTemplates ?? [];
  const saveCurrentMonth = () => router.push({
    pathname: '/budget-template-form',
    params: { month: todayISO().slice(0, 7), saveAsTemplate: '1' },
  });
  const remove = async (id: string, name: string) => {
    const confirmed = await confirmAsync({
      title: 'Delete template?',
      message: `Delete ${name}? Existing month budgets keep their saved snapshot.`,
      confirmLabel: 'Delete', destructive: true,
    });
    if (!confirmed) return;
    actions.deleteBudgetTemplate(id);
    const error = useAppStore.getState().lastError;
    if (error) Alert.alert('Could not delete template', error);
  };
  return (
    <Screen>
      <AppHeader title="Budget templates" rightActions={[
        { icon: 'plus', label: 'New budget template', onPress: () => router.push('/budget-template-form') },
      ]} />
      <SectionTitle>Saved templates</SectionTitle>
      {templates.length === 0 ? (
        <Card>
          <EmptyState title="No templates yet" subtitle="Create a template or save a month’s budget for reuse." />
          <Button label="Create a template" icon="plus" variant="primary" onPress={() => router.push('/budget-template-form')} />
        </Card>
      ) : templates.map((template) => (
        <Card key={template.id} style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${template.name} template${template.plannedIncome === null ? '' : `, monthly income ${formatAmount(template.plannedIncome, 'exact', 1)}`}`}
            onPress={() => router.push({ pathname: '/budget-template-form', params: { id: template.id } })}>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText weight="semibold" style={typography.name}>{template.name}</AppText>
                <AppText
                  style={{ color: colors.text3 }}
                  accessibilityLabel={template.plannedIncome === null
                    ? 'Income not set'
                    : `${formatAmount(template.plannedIncome, 'exact', 1)} monthly income`}>
                  {template.plannedIncome === null
                    ? 'Income not set'
                    : <><AmountText value={template.plannedIncome} tier="row" /> monthly income</>}
                </AppText>
              </View>
              {data.defaultBudgetTemplateId === template.id ? <AppText weight="semibold" style={{ color: colors.primary }}>Default</AppText> : null}
            </View>
            <AppText style={typography.meta}>{template.lines.length} budget categories</AppText>
          </Pressable>
          <View style={styles.actions}>
            {data.defaultBudgetTemplateId !== template.id ? (
              <Button label="Set default" onPress={() => {
                actions.setDefaultBudgetTemplate(template.id);
                const error = useAppStore.getState().lastError;
                if (error) Alert.alert('Could not set default', error);
              }} />
            ) : null}
            <Button label="Delete" variant="danger-text" onPress={() => void remove(template.id, template.name)} />
          </View>
        </Card>
      ))}
      <Button label="Save this month as a template" icon="save" onPress={saveCurrentMonth} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
});
