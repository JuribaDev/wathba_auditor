import { createTranslator } from "next-intl";

import type { AppLocale } from "@/lib/i18n";

type MessageTree = Record<string, unknown>;
type Translator = (key: string) => string;

export async function getMessages(locale: AppLocale): Promise<MessageTree> {
  return (await import(`../messages/${locale}.json`)).default;
}

export async function getTranslator(locale: AppLocale, namespace: string): Promise<Translator> {
  const messages = await getMessages(locale);
  const translator = createTranslator({
    locale,
    messages,
  });

  return (key: string) => translator(`${namespace}.${key}` as never);
}
