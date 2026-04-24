import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RedirectToDefaultLocale } from "@/app/(root)/redirect-client";
import { defaultLocale } from "@/lib/i18n";
import { generatedSkills, generatedSkillsById } from "@/lib/skills/generated";

type SkillRedirectPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return generatedSkills.map((skill) => ({ id: skill.id }));
}

export async function generateMetadata({
  params,
}: SkillRedirectPageProps): Promise<Metadata> {
  const { id } = await params;
  const skill = generatedSkillsById[id];
  if (!skill) {
    return {};
  }
  const target = `/${defaultLocale}/skills/${skill.id}/`;
  return {
    title: `Redirecting to ${skill.name[defaultLocale]}`,
    robots: { index: false, follow: false },
    alternates: { canonical: target },
  };
}

export default async function SkillRedirectPage({
  params,
}: SkillRedirectPageProps) {
  const { id } = await params;
  const skill = generatedSkillsById[id];

  if (!skill) {
    notFound();
  }

  const target = `/${defaultLocale}/skills/${skill.id}/`;

  return (
    <>
      <RedirectToDefaultLocale target={target} preserveSearch />
      <noscript>
        <p style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
          <a href={target}>Continue to {skill.name[defaultLocale]}</a>
        </p>
      </noscript>
    </>
  );
}
