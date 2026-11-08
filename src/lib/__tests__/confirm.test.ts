import { createConfirmHelpers, createNativeConfirmAdapter, createWebConfirmAdapter, type NativeAlert } from '../confirm';

describe('cross-platform confirmation adapters', () => {
  it('resolves a native confirm once when a choice and dismissal both arrive', async () => {
    let buttons: Parameters<NativeAlert>[2];
    let options: Parameters<NativeAlert>[3];
    const alert: NativeAlert = (...args) => {
      buttons = args[2];
      options = args[3];
    };
    const { confirmAsync } = createConfirmHelpers(createNativeConfirmAdapter(alert));
    const result = confirmAsync({ title: 'Delete?', message: 'Remove this item?', confirmLabel: 'Delete', destructive: true });
    buttons![1]?.onPress?.();
    options!.onDismiss?.();
    await expect(result).resolves.toBe(true);
    expect(options).toMatchObject({ cancelable: true });
  });

  it('uses the requested Paid and Not paid button labels and treats Not paid as false', async () => {
    let buttons: Parameters<NativeAlert>[2];
    const alert: NativeAlert = (...args) => {
      buttons = args[2];
    };
    const { confirmAsync } = createConfirmHelpers(createNativeConfirmAdapter(alert));
    const result = confirmAsync({
      title: 'Was this paid?',
      message: 'SIP, ₹1,000, due 17 Oct 2026',
      confirmLabel: 'Paid',
      cancelLabel: 'Not paid',
    });
    expect(buttons?.map((button) => button.text)).toEqual(['Not paid', 'Paid']);
    buttons?.[0]?.onPress?.();
    await expect(result).resolves.toBe(false);
  });

  it('treats dismissal of a Paid confirmation as not paid', async () => {
    let options: Parameters<NativeAlert>[3];
    const alert: NativeAlert = (...args) => {
      options = args[3];
    };
    const { confirmAsync } = createConfirmHelpers(createNativeConfirmAdapter(alert));
    const result = confirmAsync({
      title: 'Was this paid?',
      message: 'SIP, ₹1,000, due 17 Oct 2026',
      confirmLabel: 'Paid',
      cancelLabel: 'Not paid',
    });
    options!.onDismiss?.();
    await expect(result).resolves.toBe(false);
  });

  it('returns null when a native choice alert is dismissed', async () => {
    let options: Parameters<NativeAlert>[3];
    const alert: NativeAlert = (...args) => {
      options = args[3];
    };
    const { choiceAsync } = createConfirmHelpers(createNativeConfirmAdapter(alert));
    const result = choiceAsync({
      title: 'Delete',
      message: 'Choose what happens',
      choices: [{ id: 'keep', label: 'Keep' }, { id: 'remove', label: 'Remove', destructive: true }],
    });
    options!.onDismiss?.();
    await expect(result).resolves.toBeNull();
    expect(options).toMatchObject({ cancelable: true });
  });

  it('uses sequential web confirms and returns null when both are declined', async () => {
    const prompt = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    const { choiceAsync } = createConfirmHelpers(createWebConfirmAdapter(prompt));
    await expect(choiceAsync({
      title: 'Delete',
      message: 'Choose',
      choices: [{ id: 'keep', label: 'Keep' }, { id: 'delete', label: 'Delete', destructive: true }],
    })).resolves.toBe('delete');
    expect(prompt).toHaveBeenCalledTimes(2);

    const decline = jest.fn().mockReturnValue(false);
    const { choiceAsync: cancel } = createConfirmHelpers(createWebConfirmAdapter(decline));
    await expect(cancel({ title: 'Delete', message: 'Choose', choices: [{ id: 'one', label: 'One' }] })).resolves.toBeNull();
  });

  it('maps web confirmation dismissal to false and limits choices', async () => {
    const prompt = jest.fn().mockReturnValue(false);
    const helpers = createConfirmHelpers(createWebConfirmAdapter(prompt));
    await expect(helpers.confirmAsync({ title: 'Discard?', message: 'Changes are lost.', confirmLabel: 'Discard' })).resolves.toBe(false);
    expect(() => helpers.choiceAsync({
      title: 'Too many',
      message: '',
      choices: [{ id: '1', label: 'One' }, { id: '2', label: 'Two' }, { id: '3', label: 'Three' }],
    })).toThrow('At most two choices are supported');
  });
});
