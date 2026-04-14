"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/universe`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <main className="flex h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <h1 className="font-display text-3xl text-cosmos-star text-center">
          Sign in to claim your planet
        </h1>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@cosmos.io"
          className="w-full rounded-lg bg-cosmos-deep border border-cosmos-aurora/30 px-4 py-3 text-cosmos-star placeholder:text-cosmos-star/30 focus:outline-none focus:border-cosmos-aurora"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-cosmos-aurora/20 border border-cosmos-aurora px-4 py-3 text-cosmos-star hover:bg-cosmos-aurora/40 transition"
        >
          Send magic link
        </button>
        {sent && <p className="text-center text-sm text-cosmos-aurora">Check your email for the link.</p>}
        {error && <p className="text-center text-sm text-cosmos-flare">{error}</p>}
      </form>
    </main>
  );
}
