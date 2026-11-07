export function makeV1Fixture() {
  return {
    settings: { name: 'Before migration', theme: 'dark' },
    transactions: [
      {
        id: 'legacy-investment-tx',
        type: 'invest' as const,
        amount: 100,
        category: 'Mutual fund / SIP',
        note: 'Legacy SIP installment',
        date: '2026-09-01',
        source: { kind: 'plan-log' as const, parentId: 'legacy-plan', entryId: 'legacy-log' },
      },
      {
        id: 'legacy-loan-tx',
        type: 'expense' as const,
        amount: 2_000,
        category: 'EMI',
        note: 'Legacy liability EMI',
        date: '2026-09-02',
        source: { kind: 'loan-payment' as const, parentId: 'legacy-loan', entryId: 'legacy-payment' },
      },
      {
        id: 'legacy-ef-tx',
        type: 'invest' as const,
        amount: 500,
        category: 'Emergency fund',
        note: 'Emergency fund Deposit',
        date: '2026-09-03',
        source: { kind: 'ef-entry' as const, parentId: 'legacy-ef-goal', entryId: 'legacy-ef-entry' },
      },
    ],
    goals: [{
      id: 'legacy-ef-goal',
      name: 'Emergency fund',
      target: 300_000,
      saved: 0,
      year: 2028,
      auto: 'ef' as const,
    }],
    holdings: [
      {
        id: 'legacy-manual',
        kind: 'manual' as const,
        name: 'Legacy FD',
        type: 'Fixed deposit' as const,
        invested: 900,
        value: 1_000,
      },
      {
        id: 'legacy-plan',
        kind: 'plan' as const,
        name: 'Legacy SIP',
        type: 'Mutual fund / SIP' as const,
        frequency: 'monthly' as const,
        amount: 100,
        ratePct: 0,
        stepUpPct: 0,
        tenureYears: 10,
        startDate: '2026-08-01',
        trackFrom: '2026-08-01',
        opening: 0,
        actualValue: null,
        actualValueDate: null,
        logs: [{
          id: 'legacy-log',
          date: '2026-09-01',
          amount: 100,
          note: 'September',
        }],
      },
    ],
    loans: [{
      id: 'legacy-loan',
      name: 'Legacy liability',
      principal: 10_000,
      ratePct: 0,
      tenureMonths: 12,
      emi: 1_000,
      startDate: '2026-08-01',
      payments: [{
        id: 'legacy-payment',
        date: '2026-09-02',
        amount: 2_000,
        note: 'September',
      }],
    }],
    efEntries: [{
      id: 'legacy-ef-entry',
      date: '2026-09-03',
      amount: 500,
      note: 'Opening',
    }],
  };
}

export function makeV2Fixture() {
  const v1 = makeV1Fixture();
  const { loans, ...rest } = v1;
  return {
    ...rest,
    transactions: v1.transactions.map((transaction) => ({
      ...transaction,
      source: transaction.source
        ? { ...transaction.source, kind: transaction.source.kind === 'plan-log'
          ? 'holding-entry' as const
          : transaction.source.kind === 'loan-payment'
            ? 'liability-payment' as const
            : transaction.source.kind }
        : undefined,
    })),
    holdings: v1.holdings.map((holding) => holding.kind === 'manual'
      ? { ...holding, logs: [] }
      : { ...holding, logs: holding.logs.map((entry) => ({ ...entry, kind: 'Deposit' as const })) }),
    liabilities: loans.map((loan) => ({
      ...loan,
      kind: 'recurring' as const,
      type: 'Other' as const,
      payments: loan.payments.map((payment) => ({ ...payment, kind: 'EMI' as const })),
    })),
  };
}

export function makeV3Fixture() {
  const v2 = makeV2Fixture();
  return {
    ...v2,
    settings: {
      ...v2.settings,
      monthlySalary: null,
      onboarded: true,
    },
  };
}

export function makeV4Fixture() {
  return { ...makeV3Fixture(), efAllocation: null };
}

export function makeV5Fixture() {
  const v4 = makeV4Fixture();
  return {
    ...v4,
    goals: v4.goals.map((goal) => ({ ...goal, links: [] })),
    liabilities: v4.liabilities.map((liability) => ({ ...liability, settlement: null })),
    policies: [],
    budget: null,
  };
}

export function makeV6Fixture() {
  const v5 = makeV5Fixture();
  return {
    ...v5,
    efCustomBuckets: [],
    efBucketLinks: {},
  };
}
