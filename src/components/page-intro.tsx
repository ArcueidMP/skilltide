"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { useMessages } from "@/lib/use-messages";
import type { PageIntroText } from "@/messages/pages";
import { PageHeader } from "./ui";

/** A page heading in the interface language; pages are server components, so they pass the text in. */
export function PageIntro({ messages, action }: { messages: Record<Locale, PageIntroText>; action?: ReactNode }) {
  const text = useMessages(messages);
  return <PageHeader step={text.step} title={text.title} description={text.description} action={action} />;
}
