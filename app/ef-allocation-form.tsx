import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { ChoiceField } from '../src/components/form/ChoiceField';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { HelperText } from '../src/components/form/HelperText';
import { PercentField } from '../src/components/form/PercentField';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, Card } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import {
  EF_BUCKET_META,
  EF_BUCKETS,
  efBucketMetadata,
  effectiveAllocation,
  SUGGESTED_EF_ALLOCATION,
  validateAllocation,
  type EfAllocation,
} from '../src/domain/efAllocation';
import { holdingValue } from '../src/domain/portfolio';
import type { EfCustomBucket } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

type AllocationFormValues = {
  allocation: Record<string, string>;
  customBuckets: EfCustomBucket[];
  links: Record<string, string[]>;
  newBucketName: string;
  newBucketAccess: EfCustomBucket['access'];
  newBucketMarketLinked: boolean;
};

function toFormValues(allocation: EfAllocation, customBuckets: EfCustomBucket[], links: Record<string, string[]>): AllocationFormValues {
  const amounts: Record<string, string> = {};
  for (const bucket of efBucketMetadata(customBuckets)) amounts[bucket.id] = String(allocation[bucket.id] ?? 0);
  return {
    allocation: amounts,
    customBuckets: customBuckets.map((bucket) => ({ ...bucket })),
    links: Object.fromEntries(Object.entries(links).map(([id, holdingIds]) => [id, [...holdingIds]])),
    newBucketName: '',
    newBucketAccess: 'instant',
    newBucketMarketLinked: false,
  };
}

function nextDraftId(customBuckets: readonly EfCustomBucket[]): string {
  let suffix = customBuckets.length + 1;
  while (customBuckets.some(({ id }) => id === `draft-${suffix}`)) suffix += 1;
  return `draft-${suffix}`;
}

export default function EfAllocationFormScreen() {
  const { colors } = useTheme();
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const [formError, setFormError] = useState<string | undefined>();
  const [linkingBucketId, setLinkingBucketId] = useState<string | null>(null);
  const [deletingBucketId, setDeletingBucketId] = useState<string | null>(null);
  const [deleteMoveTo, setDeleteMoveTo] = useState('bank');
  const { control, handleSubmit, setValue, formState: { isDirty, isSubmitting } } = useForm<AllocationFormValues>({
    defaultValues: toFormValues(
      effectiveAllocation(data.efAllocation, data.efCustomBuckets),
      data.efCustomBuckets,
      data.efBucketLinks,
    ),
  });
  const allocationValues = useWatch({ control, name: 'allocation' });
  const customBuckets = useWatch({ control, name: 'customBuckets' });
  const links = useWatch({ control, name: 'links' });
  const newBucketName = useWatch({ control, name: 'newBucketName' });
  const newBucketAccess = useWatch({ control, name: 'newBucketAccess' });
  const newBucketMarketLinked = useWatch({ control, name: 'newBucketMarketLinked' });
  const bucketMetadata = efBucketMetadata(customBuckets);
  const numericAllocation: EfAllocation = Object.fromEntries(
    bucketMetadata.map(({ id }) => [id, Number(allocationValues[id] ?? 0)]),
  );
  const allocationCheck = validateAllocation(numericAllocation, true, customBuckets);
  const allocationTotal = typeof allocationCheck === 'object' ? allocationCheck.total : 0;
  const linkTargetOptions = bucketMetadata
    .filter(({ id }) => id !== deletingBucketId)
    .map(({ id, label }) => ({ label, value: id }));

  const save = handleSubmit((values) => {
    const nextAllocation: EfAllocation = Object.fromEntries(
      efBucketMetadata(values.customBuckets).map(({ id }) => [id, Number(values.allocation[id] ?? 0)]),
    );
    const validation = validateAllocation(nextAllocation, true, values.customBuckets);
    if (typeof validation !== 'object' || !validation.valid) {
      setFormError(typeof validation === 'object' ? validation.issues.join('. ') : 'The allocation could not be validated.');
      return;
    }
    setFormError(undefined);
    actions.saveEfPlan({
      customBuckets: values.customBuckets,
      allocation: nextAllocation,
      links: values.links,
    });
    if (!useAppStore.getState().lastError) router.back();
  });

  const updateAllocation = (id: string, value: string) => {
    setValue('allocation', { ...allocationValues, [id]: value.replace(/[^\d.]/g, '') }, { shouldDirty: true });
  };

  const removeDraftBucket = (bucketId: string, moveTo?: string) => {
    const percent = Number(allocationValues[bucketId] ?? 0);
    if (percent > 0 && !moveTo) {
      setDeletingBucketId(bucketId);
      setDeleteMoveTo('bank');
      return;
    }
    if (percent > 0 && moveTo) {
      setValue('allocation', {
        ...allocationValues,
        [moveTo]: String(Number(allocationValues[moveTo] ?? 0) + percent),
      }, { shouldDirty: true });
    }
    const nextAllocation = { ...allocationValues };
    delete nextAllocation[bucketId];
    const nextLinks = { ...links };
    delete nextLinks[bucketId];
    setValue('allocation', nextAllocation, { shouldDirty: true });
    setValue('links', nextLinks, { shouldDirty: true });
    setValue('customBuckets', customBuckets.filter(({ id }) => id !== bucketId), { shouldDirty: true });
    setDeletingBucketId(null);
  };

  const addCustomBucket = () => {
    const name = newBucketName.trim();
    if (name.length < 1 || name.length > 24) {
      setFormError('Custom option names must be 1 to 24 characters.');
      return;
    }
    if (customBuckets.length >= 8) {
      setFormError('You can add up to 8 custom options.');
      return;
    }
    const id = nextDraftId(customBuckets);
    const nextBucket: EfCustomBucket = {
      id,
      name,
      access: newBucketAccess,
      marketLinked: newBucketMarketLinked,
    };
    setValue('customBuckets', [...customBuckets, nextBucket], { shouldDirty: true });
    setValue('allocation', { ...allocationValues, [id]: '0' }, { shouldDirty: true });
    setValue('newBucketName', '', { shouldDirty: true });
    setFormError(undefined);
  };

  const setLinksForBucket = (bucketId: string, holdingIds: string[]) => {
    setValue('links', { ...links, [bucketId]: holdingIds }, { shouldDirty: true });
  };

  const linkedBucketName = bucketMetadata.find(({ id }) => id === linkingBucketId)?.label;
  const deleteBucket = customBuckets.find(({ id }) => id === deletingBucketId);
  const linkMoveChoices = linkTargetOptions.map(({ value }) => value);
  const deletePercent = deletingBucketId ? Number(allocationValues[deletingBucketId] ?? 0) : 0;

  return (
    <>
      <FormScreen
        title="Emergency fund allocation"
        onClose={() => router.back()}
        isDirty={isDirty}
        footer={(
          <View>
            <Button label="Save allocation" icon="save" variant="primary" disabled={isSubmitting} onPress={save} />
          </View>
        )}
      >
        <AppText style={[typography.meta, { color: colors.text3 }]}>
          Assign percentages to each type. The total must be exactly 100%.
        </AppText>
        <FormErrorBanner message={lastError} />
        <Controller
          control={control}
          name="allocation"
          render={({ field }) => (
            <>              
              {EF_BUCKETS.map((id) => (
                <View key={id} style={styles.fixedBucketField}>
                  <PercentField
                    label={EF_BUCKET_META[id].label}
                    accessibilityLabel={`${EF_BUCKET_META[id].label} allocation percentage`}
                    value={field.value[id] ?? String(SUGGESTED_EF_ALLOCATION[id])}
                    onChangeText={(value) => updateAllocation(id, value)}
                  />
                  <Button
                    label={`Link investments: ${EF_BUCKET_META[id].label}`}
                    icon="link-2"
                    onPress={() => setLinkingBucketId(id)}
                  />
                </View>
              ))}
            </>
          )}
        />

        <Controller
          control={control}
          name="customBuckets"
          render={({ field }) => (
            <View style={styles.customBucketList}>
              {field.value.map((bucket) => (
                <Card key={bucket.id} style={styles.customBucketCard}>
                  <TextField
                    label="Custom option name"
                    accessibilityLabel={`${bucket.name} option name`}
                    value={bucket.name}
                    onChangeText={(name) => field.onChange(field.value.map((item) =>
                      item.id === bucket.id ? { ...item, name } : item,
                    ))}
                    maxLength={24}
                  />
                  <PercentField
                    label={`${bucket.name} allocation`}
                    accessibilityLabel={`${bucket.name} allocation percentage`}
                    value={allocationValues[bucket.id] ?? '0'}
                    onChangeText={(value) => updateAllocation(bucket.id, value)}
                  />
                  <AppText weight="semibold">How quickly can you access it?</AppText>
                  <SegmentedControl
                    value={bucket.access}
                    options={[
                      { label: 'Instant', value: 'instant' },
                      { label: 'Within days', value: 'days' },
                      { label: 'Slow', value: 'slow' },
                    ]}
                    onChange={(access) => field.onChange(field.value.map((item) =>
                      item.id === bucket.id ? { ...item, access } : item,
                    ))}
                  />
                  <SwitchRow
                    label="Market-linked"
                    value={bucket.marketLinked}
                    onValueChange={(marketLinked) => field.onChange(field.value.map((item) =>
                      item.id === bucket.id ? { ...item, marketLinked } : item,
                    ))}
                  />
                  <View style={styles.customActions}>
                    <Button
                      label={`Link investments: ${bucket.name}`}
                      icon="link-2"
                      onPress={() => setLinkingBucketId(bucket.id)}
                    />
                    <Button label="Remove option" icon="trash-2" variant="danger-text" onPress={() => removeDraftBucket(bucket.id)} />
                  </View>
                  <Controller
                    control={control}
                    name="links"
                    render={({ field: linkField }) => (
                      <View style={styles.linkedSummary}>
                        {(linkField.value[bucket.id] ?? []).map((holdingId) => {
                          const holding = data.holdings.find((item) => item.id === holdingId);
                          if (!holding) return null;
                          const value = holdingValue(holding, todayISO());
                          return (
                            <View
                              key={holdingId}
                              accessible
                              accessibilityLabel={`${holding.name}: ${formatAmount(value, 'exact', 1)}`}
                              style={[styles.linkedHoldingChip, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                              <AppText style={typography.chip}>{holding.name}</AppText>
                              <AmountText value={value} tier="row" style={typography.chip} />
                            </View>
                          );
                        })}
                      </View>
                    )}
                  />
                </Card>
              ))}
            </View>
          )}
        />
        <Controller
          control={control}
          name="newBucketName"
          render={({ field }) => (
            <TextField
              label="New custom option"
              accessibilityLabel="New custom option name"
              value={field.value}
              onChangeText={field.onChange}
              maxLength={24}
              placeholder="For example, valuables"
            />
          )}
        />
        <AppText weight="semibold">How quickly can you access the new option?</AppText>
        <Controller
          control={control}
          name="newBucketAccess"
          render={({ field }) => (
            <SegmentedControl
              value={field.value}
              options={[
                { label: 'Instant', value: 'instant' },
                { label: 'Within days', value: 'days' },
                { label: 'Slow', value: 'slow' },
              ]}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="newBucketMarketLinked"
          render={({ field }) => (
            <SwitchRow label="Market-linked" value={field.value} onValueChange={field.onChange} />
          )}
        />
        <Button
          label="Add custom option"
          icon="plus"
          disabled={customBuckets.length >= 8}
          onPress={addCustomBucket}
        />

        <View style={styles.totals} accessibilityLabel={`Total ${allocationTotal.toFixed(1)} percent. Remaining ${(100 - allocationTotal).toFixed(1)} percent.`}>
          <AppText style={typography.meta}>Total: {allocationTotal.toFixed(1)}%</AppText>
          <AppText style={typography.meta}>Remaining: {(100 - allocationTotal).toFixed(1)}%</AppText>
        </View>
        {formError ? <FormErrorBanner message={formError} /> : null}
        <Button
          label="Use suggested mix"
          icon="refresh-cw"
          onPress={() => {
            const suggested = { ...SUGGESTED_EF_ALLOCATION };
            for (const bucket of customBuckets) suggested[bucket.id] = 0;
            setValue('allocation', Object.fromEntries(
              Object.entries(suggested).map(([id, value]) => [id, String(value)]),
            ), { shouldDirty: true });
          }}
        />
        <HelperText>Use suggested mix: saves the suggested percentages as your own, so they stay fixed.</HelperText>
        <Button
          label="Reset to suggested allocation"
          icon="rotate-ccw"
          onPress={() => {
            actions.resetEfAllocation();
            if (!useAppStore.getState().lastError) router.back();
          }}
        />
        <HelperText>Reset to suggested: clears your custom mix and goes back to the app&apos;s suggestion.</HelperText>
      </FormScreen>

      <Modal
        visible={linkingBucketId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setLinkingBucketId(null)}>
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <AppText weight="bold" style={typography.name}>Link investments</AppText>
            <AppText style={typography.meta}>{linkedBucketName ?? 'Choose holdings for this option.'}</AppText>
            <View style={styles.holdingPickerList}>
              {data.holdings.map((holding) => {
                const value = holdingValue(holding, todayISO());
                const selected = linkingBucketId !== null && (links[linkingBucketId] ?? []).includes(holding.id);
                return (
                  <Pressable
                    key={holding.id}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${holding.name}, ${formatAmount(value, 'exact', 1)}`}
                    accessibilityState={{ checked: selected }}
                    onPress={() => {
                      if (linkingBucketId === null) return;
                      const current = links[linkingBucketId] ?? [];
                      const next = selected
                        ? current.filter((id) => id !== holding.id)
                        : current.length < 10 ? [...current, holding.id] : current;
                      if (!selected && current.length >= 10) {
                        setFormError('Link up to 10 investments per option.');
                        return;
                      }
                      setFormError(undefined);
                      setLinksForBucket(linkingBucketId, next);
                    }}
                    style={[styles.holdingPickerRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.holdingPickerText}>
                      <AppText weight="semibold">{holding.name}</AppText>
                      <AmountText value={value} tier="row" style={typography.meta} />
                    </View>
                    <Feather name={selected ? 'check-square' : 'square'} size={20} color={selected ? colors.primary : colors.text3} />
                  </Pressable>
                );
              })}
            </View>
            {formError ? <FormErrorBanner message={formError} /> : null}
            <Button label="Done linking investments" icon="check" variant="primary" onPress={() => setLinkingBucketId(null)} />
          </Card>
        </View>
      </Modal>

      <Modal
        visible={deletingBucketId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletingBucketId(null)}>
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <AppText weight="bold" style={typography.name}>Remove custom option?</AppText>
            <AppText style={typography.meta}>
              Move {deletePercent}% from {deleteBucket?.name ?? 'this option'} to another option before removing it.
            </AppText>
            <ChoiceField
              label="Move allocation to"
              value={deleteMoveTo}
              choices={linkMoveChoices}
              choiceLabels={Object.fromEntries(linkTargetOptions.map(({ label, value }) => [value, label]))}
              onChange={setDeleteMoveTo}
            />
            <Button
              label="Move allocation and remove"
              icon="trash-2"
              variant="danger-text"
              onPress={() => deletingBucketId && removeDraftBucket(deletingBucketId, deleteMoveTo)}
            />
            <Button label="Cancel" icon="x" onPress={() => setDeletingBucketId(null)} />
          </Card>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fixedBucketField: { gap: 6 },
  customBucketList: { gap: 12 },
  customBucketCard: { gap: 12 },
  customActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  linkedSummary: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  linkedHoldingChip: { minHeight: 34, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16 },
  totals: { minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: { maxHeight: '90%', gap: 12 },
  holdingPickerList: { maxHeight: 360 },
  holdingPickerRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  holdingPickerText: { flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
