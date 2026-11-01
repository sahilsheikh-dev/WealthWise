import { Alert, Platform, type AlertButton } from 'react-native';

export type ConfirmChoice = { id: string; label: string; destructive?: boolean };
export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
};
export type ChoiceOptions = {
  title: string;
  message: string;
  choices: ConfirmChoice[];
};

export type ConfirmAdapter = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  choose: (options: ChoiceOptions) => Promise<string | null>;
};

export function createConfirmHelpers(adapter: ConfirmAdapter) {
  return {
    confirmAsync: (options: ConfirmOptions) => adapter.confirm(options),
    choiceAsync: (options: ChoiceOptions) => {
      if (options.choices.length > 2) throw new RangeError('At most two choices are supported.');
      return adapter.choose(options);
    },
  };
}

export type NativeAlert = typeof Alert.alert;

export function createNativeConfirmAdapter(alert: NativeAlert): ConfirmAdapter {
  const present = (title: string, message: string, buttons: AlertButton[]) =>
    new Promise<string | null>((resolve) => {
      let settled = false;
      const finish = (value: string | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const mapped = buttons.map((button) => ({
        ...button,
        onPress: () => finish(button.style === 'cancel' ? null : button.text ?? null),
      }));
      alert(title, message, mapped, { cancelable: true, onDismiss: () => finish(null) });
    });

  return {
    async confirm(options) {
      const buttons: AlertButton[] = [
        { text: options.cancelLabel ?? 'Cancel', style: 'cancel' },
        { text: options.confirmLabel, style: options.destructive ? 'destructive' : 'default' },
      ];
      return (await present(options.title, options.message, buttons)) === options.confirmLabel;
    },
    async choose(options) {
      const buttons: AlertButton[] = [
        { text: 'Cancel', style: 'cancel' },
        ...options.choices.map((choice) => ({
          text: choice.label,
          style: choice.destructive ? 'destructive' as const : 'default' as const,
        })),
      ];
      const selected = await present(options.title, options.message, buttons);
      return options.choices.find((choice) => choice.label === selected)?.id ?? null;
    },
  };
}

export function createWebConfirmAdapter(confirm: (message: string) => boolean): ConfirmAdapter {
  return {
    async confirm(options) {
      return confirm(`${options.title}\n\n${options.message}`);
    },
    async choose(options) {
      for (const choice of options.choices) {
        if (confirm(`${options.title}\n\n${options.message}\n\n${choice.label}?`)) return choice.id;
      }
      return null;
    },
  };
}

const adapter = Platform.OS === 'web'
  ? createWebConfirmAdapter((message) => globalThis.confirm(message))
  : createNativeConfirmAdapter(Alert.alert);

const helpers = createConfirmHelpers(adapter);

export const confirmAsync = helpers.confirmAsync;
export const choiceAsync = helpers.choiceAsync;
