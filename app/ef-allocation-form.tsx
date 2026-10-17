import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AmountText } from '../src/components/AmountText';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { PercentField } from '../src/components/form/PercentField';
import { SegmentedControl } from '../src/components/form/SegmentedControl';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { IconButton } from '../src/components/IconButton';
import { AppText, Button, Card } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import {
  activeEfBucketMetadata,
  efBucketMetadata,
  resolveEfAllocation,
  validateAllocation,
  type EfAllocation,
} from '../src/domain/efAllocation';
import { holdingValue } from '../src/domain/portfolio';
import type { EfCustomBucket } from '../src/domain/types';
import { formatAmount } from '../src/lib/amountDisplay';
import { todayISO } from '../src/lib/clock';
import { confirmAsync } from '../src/lib/confirm';
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

function toFormValues(
  sourceAllocation: Partial<EfAllocation> | null | undefined,
  customBuckets: EfCustomBucket[],
  links: Record<string, string[]>,
): AllocationFormValues {
  const allocation = resolveEfAllocation({
    efAllocation: sourceAllocation,
    efCustomBuckets: customBuckets,
  }).allocation;
  const amounts: Record<string, string> = {};
  for (const bucket of activeEfBucketMetadata(allocation, customBuckets, links)) {
    amounts[bucket.id] = String(allocation[bucket.id] ?? 0);
  }
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
  const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
  const [addItemMode, setAddItemMode] = useState<'choices' | 'custom' | null>(null);
  const [editBucketName, setEditBucketName] = useState('');
  const [editBucketAccess, setEditBucketAccess] = useState<EfCustomBucket['access']>('instant');
  const [editBucketMarketLinked, setEditBucketMarketLinked] = useState(false);
  const { control, handleSubmit, setValue, formState: { isDirty, isSubmitting } } = useForm<AllocationFormValues>({
    defaultValues: toFormValues(
      data.efAllocation,
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
  const linkedBucketIds = new Set(
    Object.entries(links).filter(([, holdingIds]) => holdingIds.length > 0).map(([id]) => id),
  );
  const bucketMetadata = efBucketMetadata(customBuckets).filter(({ id }) =>
    Object.hasOwn(allocationValues, id) || linkedBucketIds.has(id)
    || customBuckets.some((bucket) => bucket.id === id));
  const availableFixedBuckets = efBucketMetadata().filter(({ id }) =>
    !Object.hasOwn(allocationValues, id) && !linkedBucketIds.has(id));
  const numericAllocation: EfAllocation = Object.fromEntries(
    bucketMetadata.map(({ id }) => [id, Number(allocationValues[id] ?? 0)]),
  );
  const allocationCheck = validateAllocation(numericAllocation, true, customBuckets);
  const allocationTotal = typeof allocationCheck === 'object' ? allocationCheck.total : 0;
  const allocationIsValid = typeof allocationCheck === 'object' && allocationCheck.valid;
  const allocationError = typeof allocationCheck === 'object' && !allocationCheck.valid
    ? allocationCheck.issues.join('. ')
    : undefined;

  const save = handleSubmit((values) => {
    const nextAllocation: EfAllocation = Object.fromEntries(
      Object.entries(values.allocation).map(([id, value]) => [id, Number(value)]),
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
    setFormError(undefined);
  };

  const removeDraftBucket = async (bucketId: string) => {
    const bucket = bucketMetadata.find(({ id }) => id === bucketId);
    if (!bucket) throw new Error(`Emergency-fund bucket metadata is missing for ${bucketId}.`);
    const confirmed = await confirmAsync({
      title: 'Remove allocation item?',
      message: `Remove ${bucket.label}? Its linked assets stay linked to the emergency fund but are no longer grouped.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!confirmed) return;
    const nextAllocation = { ...allocationValues };
    delete nextAllocation[bucketId];
    const nextLinks = { ...links };
    delete nextLinks[bucketId];
    setValue('allocation', nextAllocation, { shouldDirty: true });
    setValue('links', nextLinks, { shouldDirty: true });
    setValue('customBuckets', customBuckets.filter(({ id }) => id !== bucketId), { shouldDirty: true });
    setFormError(undefined);
  };

  const addFixedBucket = (bucketId: string) => {
    setValue('allocation', { ...allocationValues, [bucketId]: '0' }, { shouldDirty: true });
    setAddItemMode(null);
    setFormError(undefined);
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
    setAddItemMode(null);
  };

  const setLinksForBucket = (bucketId: string, holdingIds: string[]) => {
    setValue('links', { ...links, [bucketId]: holdingIds }, { shouldDirty: true });
  };

  const editBucket = (bucket: EfCustomBucket) => {
    setEditingBucketId(bucket.id);
    setEditBucketName(bucket.name);
    setEditBucketAccess(bucket.access);
    setEditBucketMarketLinked(bucket.marketLinked);
  };

  const saveBucketMetadata = () => {
    const name = editBucketName.trim();
    if (name.length < 1 || name.length > 24) {
      setFormError('Custom option names must be 1 to 24 characters.');
      return;
    }
    setValue('customBuckets', customBuckets.map((bucket) => bucket.id === editingBucketId
      ? { ...bucket, name, access: editBucketAccess, marketLinked: editBucketMarketLinked }
      : bucket), { shouldDirty: true });
    setEditingBucketId(null);
    setFormError(undefined);
  };

  const linkedBucketName = bucketMetadata.find(({ id }) => id === linkingBucketId)?.label;
  const accessLabel = (access: EfCustomBucket['access']) =>
    access === 'instant' ? 'Instant access' : access === 'days' ? 'Within days' : 'Slow access';

  return (
    <>
      <FormScreen
        title="Edit allocation"
        onClose={() => router.back()}
        isDirty={isDirty}
        headerAction={{
          icon: 'plus',
          label: 'Add allocation item',
          variant: 'default',
          onPress: () => setAddItemMode('choices'),
        }}
        stickyHeader={(
          <View style={styles.totals} accessibilityLabel={`Total ${allocationTotal.toFixed(1)} percent. Remaining ${(100 - allocationTotal).toFixed(1)} percent.`}>
            <AppText style={typography.meta}>Total: {allocationTotal.toFixed(2)}%</AppText>
            <AppText style={typography.meta}>Remaining: {(100 - allocationTotal).toFixed(2)}%</AppText>
          </View>
        )}
        footer={(
          <View>
            <Button
              label="Save allocation"
              icon="save"
              variant="primary"
              disabled={isSubmitting || !allocationIsValid}
              onPress={save}
            />
          </View>
        )}
      >
        <AppText style={[typography.meta, { color: colors.text3 }]}>
          Set a target mix for your linked emergency assets. The total must be 100%.
        </AppText>
        <FormErrorBanner message={lastError} />
        <Controller
          control={control}
          name="allocation"
          render={() => (
            <View style={styles.bucketList}>
              {bucketMetadata.map((metadata) => {
              const customBucket = customBuckets.find(({ id }) => id === metadata.id);
              return (
                <View key={metadata.id} style={[styles.bucketRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.bucketLabel}>
                    <AppText weight="medium">{metadata.label}</AppText>
                    <AppText style={[styles.accessCaption, { color: colors.text3 }]}>
                      {accessLabel(metadata.access)} · {metadata.marketLinked ? 'Market-linked' : 'Stable'}
                    </AppText>
                  </View>
                  <View style={styles.percentWrap}>
                    <PercentField
                      size="compact"
                      accessibilityLabel={`${metadata.label} allocation percentage`}
                      value={allocationValues[metadata.id] ?? '0'}
                      onChangeText={(value) => updateAllocation(metadata.id, value)}
                    />
                  </View>
                  {customBucket ? (
                    <IconButton icon="edit-2" label={`Edit ${metadata.label}`} onPress={() => editBucket(customBucket)} />
                  ) : null}
                  <IconButton
                    icon="link-2"
                    label={`Link assets: ${metadata.label}`}
                    onPress={() => setLinkingBucketId(metadata.id)}
                  />
                  <IconButton
                    icon="trash-2"
                    label={`Remove ${metadata.label}`}
                    variant="destructive"
                    onPress={() => { void removeDraftBucket(metadata.id); }}
                  />
                </View>
              );
              })}
            </View>
          )}
        />

        {formError ?? allocationError ? <FormErrorBanner message={formError ?? allocationError ?? ''} /> : null}
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
        visible={editingBucketId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingBucketId(null)}>
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <AppText weight="bold" style={typography.name}>Edit custom option</AppText>
            <TextField
              label="Custom option name"
              accessibilityLabel="Custom option name"
              value={editBucketName}
              onChangeText={setEditBucketName}
              maxLength={24}
            />
            <AppText style={[typography.meta, { color: colors.text3 }]}>Access speed</AppText>
            <SegmentedControl
              value={editBucketAccess}
              options={[
                { label: 'Instant', value: 'instant' },
                { label: 'Within days', value: 'days' },
                { label: 'Slow', value: 'slow' },
              ]}
              onChange={setEditBucketAccess}
            />
            <SwitchRow
              label="Market-linked"
              value={editBucketMarketLinked}
              onValueChange={setEditBucketMarketLinked}
            />
            <AppText style={[typography.meta, { color: colors.text3 }]}>
              Market-linked: its value goes up and down with the market, for example stocks or equity funds
            </AppText>
            {formError ? <FormErrorBanner message={formError} /> : null}
            <Button label="Save option" icon="check" variant="primary" onPress={saveBucketMetadata} />
            <Button label="Cancel" icon="x" onPress={() => setEditingBucketId(null)} />
          </Card>
        </View>
      </Modal>

      <Modal
        visible={addItemMode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAddItemMode(null)}>
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            {addItemMode === 'choices' ? (
              <>
                <AppText weight="bold" style={typography.name}>Add allocation item</AppText>
                {availableFixedBuckets.map(({ id, label }) => (
                  <Button key={id} label={label} onPress={() => addFixedBucket(id)} />
                ))}
                <Button
                  label="Custom"
                  disabled={customBuckets.length >= 8}
                  onPress={() => setAddItemMode('custom')}
                />
              </>
            ) : (
              <>
                <AppText weight="bold" style={typography.name}>Custom allocation item</AppText>
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
                <View style={styles.newBucketMetadata}>
                  <AppText style={[typography.meta, { color: colors.text3 }]}>Access speed</AppText>
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
                </View>
                <Controller
                  control={control}
                  name="newBucketMarketLinked"
                  render={({ field }) => (
                    <>
                      <SwitchRow label="Market-linked" value={field.value} onValueChange={field.onChange} />
                      <AppText style={[typography.meta, { color: colors.text3 }]}>
                        Market-linked: its value goes up and down with the market, for example stocks or equity funds
                      </AppText>
                    </>
                  )}
                />
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button
                  label="Add custom option"
                  icon="plus"
                  disabled={customBuckets.length >= 8}
                  onPress={addCustomBucket}
                />
              </>
            )}
            <Button label="Cancel" icon="x" onPress={() => setAddItemMode(null)} />
          </Card>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bucketList: { gap: 2 },
  bucketRow: { minHeight: 62, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth },
  bucketLabel: { flex: 1, minWidth: 100, gap: 2 },
  accessCaption: { fontSize: 10, lineHeight: 13 },
  percentWrap: { width: 82 },
  totals: { minHeight: 40, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  newBucketMetadata: { gap: 4 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: { maxHeight: '90%', gap: 12 },
  holdingPickerList: { maxHeight: 360 },
  holdingPickerRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  holdingPickerText: { flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
