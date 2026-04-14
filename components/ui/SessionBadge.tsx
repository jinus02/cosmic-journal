"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/useI18n";

interface Props {
  email: string | null;
}

export function SessionBadge({ email }: Props) {
  const t = useI18n();

  if (!email) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-cosmos-star/30 px-3 py-1 text-xs font-mono text-cosmos-star/70 hover:text-cosmos-star hover:border-cosmos-star/60 transition"
      >
        {t("session.signIn")}
      </Link>
    );
  }

  const handle = email.includes("@") ? email.split("@")[0] : email;

  return (
    <form method="post" action="/api/auth/signout" className="flex items-center gap-2">
      <span
        className="rounded-full border border-cosmos-aurora/40 bg-cosmos-aurora/10 px-3 py-1 text-xs font-mono text-cosmos-star/80"
        title={email}
      >
        {handle}
      </span>
      <button
        type="submit"
        className="rounded-full border border-cosmos-star/20 px-3 py-1 text-xs font-mono text-cosmos-star/60 hover:text-cosmos-star hover:border-cosmos-star/60 transition"
      >
        {t("session.signOut")}
      </button>
    </form>
  );
}
