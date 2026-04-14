"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/useI18n";

function LoginInner() {
  const t = useI18n();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseBrowserConfigured();

  useEffect(() => {
    const e = params.get("error");
    if (!e) return;
    if (e === "auth_failed") setError(t("login.error.authFailed"));
    else if (e === "not_configured") setError(t("login.error.notConfigured"));
    else if (e === "missing_code") setError(t("login.error.missingCode"));
    else setError(e);
  }, [params, t]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      setError(t("login.error.notConfigured"));
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(t("login.error.notConfigured"));
      return;
    }
    setError(null);
    setSending(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) setError(authError.message);
      else setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1 className="font-display text-3xl text-cosmos-star">{t("auth.heading")}</h1>
          <p className="mt-2 text-xs text-cosmos-star/40 font-mono">
            <Link href="/" className="hover:text-cosmos-star">← {t("nav.back")}</Link>
          </p>
        </div>

        {!configured && (
          <div className="rounded-lg border border-cosmos-aurora/30 bg-cosmos-aurora/5 px-4 py-3 text-center text-xs text-cosmos-star/70">
            {t("login.demo")}
          </div>
        )}

        <input
          type="email"
          required
          disabled={!configured || sending || sent}
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          placeholder={t("auth.emailPlaceholder")}
          className="w-full rounded-lg bg-cosmos-deep border border-cosmos-aurora/30 px-4 py-3 text-cosmos-star placeholder:text-cosmos-star/30 focus:outline-none focus:border-cosmos-aurora disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!configured || sending || sent}
          className="w-full rounded-lg bg-cosmos-aurora/20 border border-cosmos-aurora px-4 py-3 text-cosmos-star hover:bg-cosmos-aurora/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? t("login.sending") : sent ? t("auth.sent") : t("auth.send")}
        </button>

        {sent && (
          <p className="text-center text-sm text-cosmos-aurora">{t("auth.sent")}</p>
        )}
        {error && (
          <p className="text-center text-sm text-cosmos-flare" role="alert">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
