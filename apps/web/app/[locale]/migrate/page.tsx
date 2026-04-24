import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import {
  MigratorShell,
  type MigratorLabels,
} from "@/components/migrator/migrator-shell";
import { isLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";

type MigratePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MigratePage({ params }: MigratePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslator(locale, "Migrate");

  const labels: MigratorLabels = {
    sourceHeading: t("source.heading"),
    sourceLede: t("source.lede"),
    sourceClaudeLabel: t("source.claude.label"),
    sourceClaudeDesc: t("source.claude.desc"),
    targetHeading: t("target.heading"),
    targetLede: t("target.lede"),
    targetClaudeLabel: t("target.claude.label"),
    targetClaudeDesc: t("target.claude.desc"),
    targetCursorLabel: t("target.cursor.label"),
    targetCursorDesc: t("target.cursor.desc"),
    targetCodexLabel: t("target.codex.label"),
    targetCodexDesc: t("target.codex.desc"),
    targetGenericLabel: t("target.generic.label"),
    targetGenericDesc: t("target.generic.desc"),
    targetCustomLabel: t("target.custom.label"),
    targetCustomDesc: t("target.custom.desc"),
    approvalTitle: t("approval.title"),
    approvalBody: t("approval.body"),
    promptHeading: t("prompt.heading"),
    promptLede: t("prompt.lede"),
    promptMeta: t("prompt.meta"),
    copyCta: t("copy.cta"),
    copyCopied: t("copy.copied"),
    copyFallback: t("copy.fallback"),
    previewHeading: t("previewHeading"),
    installerHeading: t("installer.heading"),
    installerLede: t("installer.lede"),
    installerFooter: t("installer.footer"),
    installClaudeName: t("installer.agents.claude.name"),
    installClaudeTagline: t("installer.agents.claude.tagline"),
    installCursorName: t("installer.agents.cursor.name"),
    installCursorTagline: t("installer.agents.cursor.tagline"),
    installCodexName: t("installer.agents.codex.name"),
    installCodexTagline: t("installer.agents.codex.tagline"),
    filesLabel: t("filesLabel"),
    sizeLabel: t("sizeLabel"),
  };

  return (
    <AppShell
      locale={locale}
      section="migrate"
      title={t("title")}
      description={t("description")}
    >
      <MigratorShell labels={labels} />
    </AppShell>
  );
}
