import {
  DRAFT_EXPIRY_MS,
  FINGERPRINT_EXPIRY_MS,
  incomeCategoriesForTransaction,
  parseTransactionNotification,
  pruneExpiredDetectionState,
  reconcileTransactionDrafts,
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
});
