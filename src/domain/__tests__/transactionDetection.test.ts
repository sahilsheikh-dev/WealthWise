import {
  buildSourceAppPickerItems,
  DEFAULT_DETECTION_SOURCE_APPS,
  DRAFT_EXPIRY_MS,
  FINGERPRINT_EXPIRY_MS,
  incomeCategoriesForTransaction,
  isTrustedSourcePackage,
  parseTransactionNotification,
  pruneExpiredDetectionState,
  reconcileTransactionDrafts,
  sourceAppLabel,
} from '../transactionDetection';
import { buildDemoData } from '../../mock/demoData';

const NOW = Date.UTC(2026, 10, 25, 12, 0, 0);

describe('transactionDetection domain', () => {
  it('parses debit notifications without retaining raw text', () => {
    const draft = parseTransactionNotification(
      {
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Paid ₹450.50 to Blue Tokai',
        text: 'Debited ₹450.50 from A/C XX1234 via UPI Ref 987654321098',
        postedAtMs: NOW,
      },
      NOW,
      'draft-1',
    );

    expect(draft).not.toBeNull();
    expect(draft).toMatchObject({
      id: 'draft-1',
      type: 'expense',
      amount: 450.5,
      suggestedNote: 'Blue Tokai',
      sourcePackage: 'com.google.android.apps.nbu.paisa.user',
      confidence: 'high',
    });
    expect(JSON.stringify(draft)).not.toContain('987654321098');
    expect(JSON.stringify(draft)).not.toContain('XX1234');
  });

  it('parses credit notifications as income', () => {
    const draft = parseTransactionNotification(
      {
        packageName: 'com.snapwork.hdfc',
        title: 'Salary Credited',
        text: 'INR 85,000.00 credited to your account from Acme Corp',
        postedAtMs: NOW,
      },
      NOW,
      'draft-2',
    );

    expect(draft).not.toBeNull();
    expect(draft?.type).toBe('income');
    expect(draft?.amount).toBe(85000);
  });

  it('rejects hidden, OTP, promo, failed, balance-only, and ambiguous notifications', () => {
    const cases = [
      { title: 'HDFC Bank', text: 'Contents hidden', packageName: 'com.snapwork.hdfc' },
      { title: 'Messages', text: 'Notification content hidden', packageName: 'com.google.android.apps.messaging' },
      { title: 'Bank OTP', text: 'Your OTP is 482910 for Rs. 500 transaction. Do not share.', packageName: 'com.google.android.apps.messaging' },
      { title: 'Paytm Offer', text: 'Win cashback up to ₹500 on your next recharge!', packageName: 'net.one97.paytm' },
      { title: 'UPI Failed', text: 'Payment of ₹1,200 to Swiggy failed and was declined.', packageName: 'com.phonepe.app' },
      { title: 'Balance Alert', text: 'Your available balance is ₹24,500.00', packageName: 'com.snapwork.hdfc' },
      { title: 'Ambiguous', text: 'Credited ₹500 and debited ₹500', packageName: 'com.snapwork.hdfc' },
      { title: 'Payment Request', text: 'Alice requested ₹300 on UPI', packageName: 'com.phonepe.app' },
    ];

    for (const item of cases) {
      expect(
        parseTransactionNotification({ ...item, postedAtMs: NOW }, NOW, 'draft-x'),
      ).toBeNull();
    }

    expect(parseTransactionNotification({ packageName: '', title: 'Paid ₹10', text: 'Debited ₹10', postedAtMs: NOW }, NOW, 'd')).toBeNull();
    expect(parseTransactionNotification({ packageName: 'com.bank', title: 'Paid', text: 'Debited', postedAtMs: NOW }, NOW, 'd')).toBeNull();
    expect(parseTransactionNotification({ packageName: 'com.bank', title: 'Paid ₹0', text: 'Debited ₹0', postedAtMs: NOW }, NOW, 'd')).toBeNull();

    const mediumCredit = parseTransactionNotification(
      { packageName: 'com.bank', title: '', text: '₹1,250.00 credited', postedAtMs: 0 },
      NOW,
      'd-med',
    );
    expect(mediumCredit?.confidence).toBe('medium');
    expect(mediumCredit?.suggestedNote).toBe('Detected credit');

    const mediumDebit = parseTransactionNotification(
      { packageName: 'com.bank', title: '', text: '₹250.00 debited', postedAtMs: NOW },
      NOW,
      'd-med-2',
    );
    expect(mediumDebit?.suggestedNote).toBe('Detected payment');
  });

  it('deduplicates dual notifications and expires stale drafts and fingerprints', () => {
    const incoming = [
      {
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Paid ₹299 to Swiggy',
        text: 'Debited ₹299 via UPI',
        postedAtMs: NOW,
      },
      {
        packageName: 'com.snapwork.hdfc',
        title: 'Paid ₹299 to Swiggy',
        text: 'Your account is debited for Rs. 299.00 at Swiggy',
        postedAtMs: NOW + 30_000,
      },
    ];

    const first = reconcileTransactionDrafts([], [], incoming, NOW, (i) => `d-${i}`);
    expect(first.addedDrafts).toHaveLength(1);
    expect(first.drafts).toHaveLength(1);
    expect(first.seenFingerprints).toHaveLength(1);

    const afterExpiry = pruneExpiredDetectionState(
      first.drafts,
      first.seenFingerprints,
      NOW + DRAFT_EXPIRY_MS + 1,
    );
    expect(afterExpiry.drafts).toHaveLength(0);
    expect(afterExpiry.seenFingerprints).toHaveLength(0);

    const afterFingerprintWindow = pruneExpiredDetectionState(
      first.drafts,
      first.seenFingerprints,
      NOW + FINGERPRINT_EXPIRY_MS + 1,
    );
    expect(afterFingerprintWindow.drafts).toHaveLength(1);
    expect(afterFingerprintWindow.seenFingerprints).toHaveLength(0);
  });

  it('builds dynamic income categories including Budget income names', () => {
    const data = buildDemoData('2026-11-25');
    if (!data.budgetPlan) throw new Error('Expected budgetPlan in demo data');
    data.budgetPlan.incomes.push({
      id: 'inc-custom-1',
      name: 'Consulting Retainer',
      category: 'Freelance',
      amount: 25000,
      frequency: 'monthly',
      day: 5,
    });
    const categories = incomeCategoriesForTransaction(data, '2026-11', '2026-11-25');
    expect(categories).toContain('Consulting Retainer');
    expect(categories).toContain('Salary');
    expect(categories).toContain('Withdrawal');
  });

  it('builds sorted source-app picker items with observed, installed, allowed, and query branches', () => {
    expect(sourceAppLabel('com.google.android.apps.nbu.paisa.user')).toBe('Google Pay');
    expect(sourceAppLabel('com.custom.bank.app')).toBe('com.custom.bank.app');

    const items = buildSourceAppPickerItems({
      installedPackages: ['com.google.android.apps.nbu.paisa.user'],
      observedApps: [
        { packageName: 'com.google.android.apps.nbu.paisa.user', label: 'GPay', iconUri: 'file://gpay.png' },
        { packageName: 'com.unverified.wallet', label: 'My Wallet' },
      ],
      allowedPackages: ['com.legacy.allowed.bank'],
      query: '',
    });

    const gpay = items.find((item) => item.packageName === 'com.google.android.apps.nbu.paisa.user');
    expect(gpay).toMatchObject({ trusted: true, installed: true, observed: true, selected: false, iconUri: 'file://gpay.png' });

    const unverified = items.find((item) => item.packageName === 'com.unverified.wallet');
    expect(unverified).toMatchObject({ trusted: false, installed: true, observed: true, selected: false, label: 'My Wallet' });

    const legacy = items.find((item) => item.packageName === 'com.legacy.allowed.bank');
    expect(legacy).toMatchObject({ trusted: false, installed: false, observed: false, selected: true, label: 'com.legacy.allowed.bank' });
    expect(items[0]?.packageName).toBe('com.legacy.allowed.bank');

    const filteredByPkg = buildSourceAppPickerItems({
      installedPackages: ['com.google.android.apps.nbu.paisa.user'],
      observedApps: [{ packageName: 'com.unverified.wallet', label: 'My Wallet' }],
      allowedPackages: [],
      query: 'unverified.wallet',
    });
    expect(filteredByPkg).toHaveLength(1);
    expect(filteredByPkg[0]?.packageName).toBe('com.unverified.wallet');

    const filteredByLabel = buildSourceAppPickerItems({
      installedPackages: ['com.google.android.apps.nbu.paisa.user'],
      observedApps: [{ packageName: 'com.unverified.wallet', label: 'My Wallet' }],
      allowedPackages: [],
      query: 'My Wallet',
    });
    expect(filteredByLabel).toHaveLength(1);
    expect(filteredByLabel[0]?.packageName).toBe('com.unverified.wallet');

    const mediumDraft = parseTransactionNotification(
      {
        packageName: 'com.unverified.wallet',
        title: '',
        text: 'Debited Rs 100 at Cafe',
        postedAtMs: -1,
      },
      NOW,
      'draft-med',
    );
    expect(mediumDraft?.confidence).toBe('medium');
    expect(mediumDraft).not.toBeNull();
    if (mediumDraft) {
      const deduped = reconcileTransactionDrafts([mediumDraft], [], [
        { packageName: 'com.unverified.wallet', title: '', text: 'Debited Rs 100 at Cafe', postedAtMs: -1 },
      ], NOW + 1000, () => 'draft-dup');
      expect(deduped.addedDrafts).toHaveLength(0);
    }
  });

  it('parses real-world UPI/bank alerts with combined verbs, trailing currency, colon amounts, and discounts', () => {
    const upiCombined = parseTransactionNotification(
      {
        packageName: 'com.google.android.apps.messaging',
        title: 'HDFC Bank',
        text: 'A/c XX1234 debited by Rs 500.00 on 28-11-26; credited to VPA merchant@okicici Ref 123456',
        postedAtMs: NOW,
      },
      NOW,
      'draft-upi-1',
    );
    expect(upiCombined).toMatchObject({ type: 'expense', amount: 500 });

    const creditSent = parseTransactionNotification(
      {
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Google Pay',
        text: 'Received ₹1,200 from Rahul (sent via Google Pay)',
        postedAtMs: NOW,
      },
      NOW,
      'draft-upi-2',
    );
    expect(creditSent).toMatchObject({ type: 'income', amount: 1200 });

    const trailingCurrency = parseTransactionNotification(
      {
        packageName: 'com.sbi.lotusintouch',
        title: 'SBI Alert',
        text: '500.00 INR debited from A/c XX4321 towards Swiggy',
        postedAtMs: NOW,
      },
      NOW,
      'draft-upi-3',
    );
    expect(trailingCurrency).toMatchObject({ type: 'expense', amount: 500 });

    const colonAmount = parseTransactionNotification(
      {
        packageName: 'com.phonepe.app',
        title: 'PhonePe',
        text: 'Rs: 1,250.50 paid to Zomato',
        postedAtMs: NOW,
      },
      NOW,
      'draft-upi-4',
    );
    expect(colonAmount).toMatchObject({ type: 'expense', amount: 1250.5 });

    const paidWithDiscount = parseTransactionNotification(
      {
        packageName: 'in.amazon.mShop.android.shopping',
        title: 'Amazon Pay',
        text: 'Paid ₹450 to Swiggy (₹50 discount applied)',
        postedAtMs: NOW,
      },
      NOW,
      'draft-upi-5',
    );
    expect(paidWithDiscount).toMatchObject({ type: 'expense', amount: 450 });

    const verbPrefixedNoSymbol = parseTransactionNotification(
      {
        packageName: 'com.android.mms',
        title: 'Bank SMS',
        text: 'A/c XX1234 debited by 450.00 towards Blue Tokai',
        postedAtMs: NOW,
      },
      NOW,
      'draft-upi-6',
    );
    expect(verbPrefixedNoSymbol).toMatchObject({ type: 'expense', amount: 450 });

    const promoDiscount = parseTransactionNotification(
      {
        packageName: 'net.one97.paytm',
        title: 'Paytm Offer',
        text: 'Get flat 20% discount on your next order! Apply now ₹500',
        postedAtMs: NOW,
      },
      NOW,
      'draft-promo-1',
    );
    expect(promoDiscount).toBeNull();

    expect(isTrustedSourcePackage('com.android.mms')).toBe(true);
    expect(isTrustedSourcePackage('com.coloros.mms')).toBe(true);
    expect(isTrustedSourcePackage('com.oplus.mms')).toBe(true);
    expect(DEFAULT_DETECTION_SOURCE_APPS.some((a) => a.packageName === 'com.google.android.apps.messaging')).toBe(true);
  });
});
