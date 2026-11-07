import { View } from 'react-native';

import { AmountText } from '../AmountText';
import { AppText } from '../ui';
import type { BudgetCommitment } from '../../domain/budget';
import { formatDate } from '../../lib/format';
import { typography } from '../../theme/tokens';

export function RecurringItemsSummary({ items }: { items: BudgetCommitment[] }) {
  return (
    <View style={{ gap: 8 }}>
      <AppText weight="semibold">Recurring items (automatic)</AppText>
      {items.length === 0 ? (
        <AppText style={typography.meta}>No recurring items are scheduled for this month.</AppText>
      ) : items.map((item, index) => (
        <View
          key={`${item.kind}:${item.id}:${item.dueDate}:${index}`}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <AppText>{item.name}</AppText>
            <AppText style={typography.meta}>{item.category} · {formatDate(item.dueDate)}</AppText>
          </View>
          <AmountText value={item.plannedAmount} tier="row" weight="semibold" />
        </View>
      ))}
    </View>
  );
}
