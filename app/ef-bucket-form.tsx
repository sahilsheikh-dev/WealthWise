import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Dropdown, type DropdownOption } from '../src/components/Dropdown';
import { FormErrorBanner } from '../src/components/form/FormErrorBanner';
import { FormScreen } from '../src/components/form/FormScreen';
import { ReadOnlyRow } from '../src/components/form/ReadOnlyRow';
import { SwitchRow } from '../src/components/form/SwitchRow';
import { TextField } from '../src/components/form/TextField';
import { AppText, Button, EmptyState } from '../src/components/ui';
import { useAppStore } from '../src/data/store';
import { useAppActions } from '../src/data/useAppData';
import { EF_BUCKET_META, EF_BUCKETS, resolveEfAllocation } from '../src/domain/efAllocation';
import type { EfCustomBucket } from '../src/domain/types';
import { confirmAsync } from '../src/lib/confirm';
import { typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';

type EfBucketFormInput = {
  name: string;
  access: EfCustomBucket['access'];
  marketLinked: boolean;
};

const ACCESS_OPTIONS: readonly DropdownOption[] = [
  { value: 'instant', title: 'Instant' },
  { value: 'days', title: 'Within days' },
  { value: 'slow', title: 'Slow' },
];

function nextDraftId(buckets: readonly EfCustomBucket[]): string {
  let index = buckets.length + 1;
  while (buckets.some(({ id }) => id === `draft-${index}`)) index += 1;
  return `draft-${index}`;
}

export default function EfBucketFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bucketId = Array.isArray(id) ? id[0] : id;
  const data = useAppStore((state) => state.data);
  const lastError = useAppStore((state) => state.lastError);
  const actions = useAppActions();
  const { colors } = useTheme();
  const submitting = useRef(false);
  const customBucket = data.efCustomBuckets.find((bucket) => bucket.id === bucketId);
  const fixedId = EF_BUCKETS.find((fixedBucketId) => fixedBucketId === bucketId);
  const fixedBucket = fixedId ? { id: fixedId, ...EF_BUCKET_META[fixedId] } : undefined;
  const editing = bucketId !== undefined;
  const bucket = customBucket ?? fixedBucket;
  const isFixed = fixedBucket !== undefined;
  const bucketLabel = customBucket?.name ?? fixedBucket?.label ?? '';
  const fixedAccess = fixedBucket?.access ?? 'instant';
  const schema = useMemo(() => z.object({
    name: z.string().trim().min(1, 'Enter a title.').max(24, 'Title must be 1 to 24 characters.'),
    access: z.enum(['instant', 'days', 'slow']),
    marketLinked: z.boolean(),
  }).superRefine((values, context) => {
    if (isFixed) return;
    const existingNames = [
      ...EF_BUCKETS.map((knownId) => EF_BUCKET_META[knownId].label),
      ...data.efCustomBuckets
        .filter((candidate) => candidate.id !== bucketId)
        .map((candidate) => candidate.name),
    ];
    if (existingNames.some((name) => name.toLowerCase() === values.name.toLowerCase())) {
      context.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'Allocation item titles must be unique.',
      });
    }
  }), [bucketId, data.efCustomBuckets, isFixed]);
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, submitCount },
  } = useForm<EfBucketFormInput>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: customBucket?.name ?? fixedBucket?.label ?? '',
      access: customBucket?.access ?? fixedBucket?.access ?? 'instant',
      marketLinked: customBucket?.marketLinked ?? fixedBucket?.marketLinked ?? false,
    },
  });

  const save = handleSubmit((values) => {
    const allocation = resolveEfAllocation(data).allocation;
    const links = data.efBucketLinks;
    if (customBucket) {
      actions.saveEfPlan({
        customBuckets: data.efCustomBuckets.map((candidate) => candidate.id === customBucket.id
          ? { ...candidate, name: values.name, access: values.access, marketLinked: values.marketLinked }
          : candidate),
        allocation,
        links,
      });
    } else if (!editing) {
      const newBucket = {
        id: nextDraftId(data.efCustomBuckets),
        name: values.name,
        access: values.access,
        marketLinked: values.marketLinked,
      };
      actions.saveEfPlan({
        customBuckets: [...data.efCustomBuckets, newBucket],
        allocation: { ...allocation, [newBucket.id]: 0 },
        links,
      });
    }
    if (!useAppStore.getState().lastError) router.back();
  });
  const submit = () => {
    if (submitting.current) return;
    submitting.current = true;
    void save().finally(() => { submitting.current = false; });
  };

  const remove = async () => {
    if (!bucket) return;
    const confirmed = await confirmAsync({
      title: 'Remove allocation item?',
      message: `Remove ${bucketLabel}? Its linked assets stay linked to the emergency fund but are no longer grouped.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!confirmed) return;
    const customBuckets = data.efCustomBuckets.filter((candidate) => candidate.id !== bucket.id);
    const allocation = { ...resolveEfAllocation(data).allocation };
    delete allocation[bucket.id];
    const normalizedAllocation = resolveEfAllocation({
      efAllocation: allocation,
      efCustomBuckets: customBuckets,
    }).allocation;
    const links = { ...data.efBucketLinks };
    delete links[bucket.id];
    actions.saveEfPlan({ customBuckets, allocation: normalizedAllocation, links });
    if (!useAppStore.getState().lastError) router.back();
  };

  if (editing && !bucket) {
    return (
      <FormScreen title="Allocation item" onClose={() => router.back()} footer={null}>
        <EmptyState title="Allocation item not found" />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Allocation item"
      onClose={() => router.back()}
      isDirty={isDirty}
      headerAction={editing ? { label: 'Remove allocation item', onPress: () => { void remove(); } } : undefined}
      footer={(
        <Button
          label="Save"
          icon="save"
          variant="primary"
          disabled={isSubmitting}
          onPress={submit}
        />
      )}>
      <FormErrorBanner message={lastError} />
      {isFixed ? (
        <ReadOnlyRow label="Title" value={bucketLabel} />
      ) : (
        <Controller control={control} name="name" render={({ field }) => (
          <TextField
            label="Title"
            accessibilityLabel="Allocation item title"
            maxLength={24}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
          />
        )} />
      )}
      {isFixed ? (
        <ReadOnlyRow
          label="Access speed"
          value={fixedAccess === 'instant' ? 'Instant' : fixedAccess === 'days' ? 'Within days' : 'Slow'}
        />
      ) : (
        <Controller control={control} name="access" render={({ field }) => (
          <Dropdown
            label="Access speed"
            accessibilityLabel="Allocation item access speed"
            value={field.value}
            options={ACCESS_OPTIONS}
            onChange={field.onChange}
          />
        )} />
      )}
      <Controller control={control} name="marketLinked" render={({ field }) => (
        <SwitchRow
          label="Market-linked"
          value={field.value}
          disabled={isFixed}
          onValueChange={field.onChange}
        />
      )} />
      <AppText style={[typography.meta, { color: colors.text3 }]}>
        Market-linked: its value goes up and down with the market, for example stocks or equity funds
      </AppText>
      {submitCount > 0 && Object.keys(errors).length > 0
        ? <FormErrorBanner message={Object.values(errors).map((error) => error.message).filter(Boolean).join(' ')} />
        : null}
    </FormScreen>
  );
}
