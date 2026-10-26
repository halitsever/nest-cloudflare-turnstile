import type {
  ITurnstileOptions,
  TurnstileWidgetOptions,
} from '../interfaces/turnstile';

/** An unknown name is a setup mistake, so it throws instead of falling back to the module's secret. */
export function findWidget(
  options: ITurnstileOptions,
  name: string | undefined,
): TurnstileWidgetOptions | undefined {
  if (name === undefined) return undefined;
  const widget = options.widgets?.[name];
  if (!widget) {
    throw new Error(`TurnstileModule has no widget named "${name}".`);
  }
  return widget;
}
