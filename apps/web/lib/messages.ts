import { createTranslator } from "next-intl";

import type { AppLocale } from "@/lib/i18n";

type MessageTree = Record<string, unknown>;
type TranslatorValues = Record<string, string | number | Date>;
type Translator = (key: string, values?: TranslatorValues) => string;

export async function getMessages(locale: AppLocale): Promise<MessageTree> {
  return (await import(`../messages/${locale}.json`)).default;
}

function resolveRaw(messages: MessageTree, path: string): string | undefined {
  const segments = path.split(".");
  let node: unknown = messages;
  for (const segment of segments) {
    if (node && typeof node === "object" && segment in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

export async function getTranslator(locale: AppLocale, namespace: string): Promise<Translator> {
  const messages = await getMessages(locale);
  const translator = createTranslator({
    locale,
    messages,
  });

  return (key, values) => {
    const fullKey = `${namespace}.${key}`;
    if (!values) {
      const raw = resolveRaw(messages, fullKey);
      if (raw !== undefined) {
        return raw;
      }
    }
    return translator(fullKey as never, values as never);
  };
}
