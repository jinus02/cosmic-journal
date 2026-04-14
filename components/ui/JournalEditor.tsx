"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanetDescriptor } from "@/lib/procedural/planetGen";
import type { AnalysisResult } from "@/lib/gemini/schema";
import { useI18n } from "@/lib/i18n/useI18n";

interface Props {
  planet: PlanetDescriptor;
  onClose: () => void;
  isAuthenticated?: boolean;
}

export function JournalEditor({ planet, onClose, isAuthenticated = false }: Props) {
  const t = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [phase, setPhase] = useState<"write" | "analyzing" | "result">("write");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [createdPlanetId, setCreatedPlanetId] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  const submit = async () => {
    if (phase !== "write") return;
    if (body.trim().length < 10) {
      setError(t("editor.tooShort"));
      return;
    }
    setError(null);
    setAuthRequired(false);
    setPhase("analyzing");

    try {
      const analyzeRes = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body_md: body }),
      });
      if (analyzeRes.status === 401) {
        setAuthRequired(true);
        setError(t("editor.error.authRequired"));
        setPhase("write");
        return;
      }
      if (!analyzeRes.ok) {
        setError(t("editor.error.generic"));
        setPhase("write");
        return;
      }
      const { result: analysis } = (await analyzeRes.json()) as { result: AnalysisResult };

      // Demo mode: show the analysis but skip persistence.
      if (!isAuthenticated) {
        setResult(analysis);
        setPhase("result");
        return;
      }

      const createRes = await fetch("/api/planet/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          procedural_id: planet.id,
          position: planet.position,
          radius: planet.radius,
          seed: planet.seed,
          name: title.trim() || `Planet ${planet.id}`,
          body_md: body,
          analysis,
        }),
      });
      if (createRes.status === 401) {
        setAuthRequired(true);
        setError(t("editor.error.authRequired"));
        setPhase("write");
        return;
      }
      if (createRes.status === 409) {
        setError(t("editor.error.claimed"));
        setPhase("write");
        return;
      }
      if (!createRes.ok) {
        setError(t("editor.error.generic"));
        setPhase("write");
        return;
      }
      const created = (await createRes.json()) as { planet_id?: string };
      if (created.planet_id) setCreatedPlanetId(created.planet_id);

      setResult(analysis);
      setPhase("result");
    } catch {
      setError(t("editor.error.generic"));
      setPhase("write");
    }
  };

  const visitPlanet = () => {
    if (createdPlanetId) router.push(`/p/${createdPlanetId}`);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-cosmos-void/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-cosmos-aurora/30 bg-cosmos-deep p-8 shadow-[0_0_60px_rgba(122,156,255,0.15)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-cosmos-star/60 hover:text-cosmos-star"
          aria-label="close"
        >
          ✕
        </button>

        {phase === "write" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-display text-cosmos-star">{t("editor.title")}</h2>
              <p className="text-sm text-cosmos-star/60 mt-1">
                {t("editor.subtitle")} · <span className="font-mono">{planet.biome}</span> · r={planet.radius.toFixed(0)}
              </p>
              {!isAuthenticated && (
                <p className="mt-2 text-xs font-mono text-cosmos-aurora/80">
                  🛰 {t("editor.demoBadge")}
                </p>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("editor.namePlaceholder")}
              className="w-full rounded-lg bg-cosmos-void/60 border border-cosmos-aurora/20 px-4 py-2 text-cosmos-star placeholder:text-cosmos-star/30 focus:outline-none focus:border-cosmos-aurora"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder={t("editor.bodyPlaceholder")}
              className="w-full rounded-lg bg-cosmos-void/60 border border-cosmos-aurora/20 px-4 py-3 text-cosmos-star placeholder:text-cosmos-star/30 focus:outline-none focus:border-cosmos-aurora resize-none font-body leading-relaxed"
            />
            {error && (
              <div className="text-cosmos-flare text-sm">
                <p>{error}</p>
                {authRequired && (
                  <a
                    href="/login"
                    className="mt-1 inline-block text-cosmos-aurora underline underline-offset-2 hover:text-cosmos-star"
                  >
                    {t("nav.signin")} →
                  </a>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-cosmos-star/20 text-cosmos-star/70 hover:text-cosmos-star"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={submit}
                disabled={phase !== "write" || body.trim().length < 10}
                className="px-6 py-2 rounded-lg bg-cosmos-aurora/20 border border-cosmos-aurora text-cosmos-star hover:bg-cosmos-aurora/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("editor.submit")}
              </button>
            </div>
          </div>
        )}

        {phase === "analyzing" && (
          <div className="py-16 text-center">
            <div className="inline-block animate-pulse text-cosmos-aurora text-xl font-display">
              {t("editor.analyzing")}
            </div>
            <p className="mt-2 text-sm text-cosmos-star/50">{t("editor.analyzingHint")}</p>
          </div>
        )}

        {phase === "result" && result && (
          <div className="space-y-4">
            <h2 className="text-2xl font-display text-cosmos-star">{t("editor.born")}</h2>
            <div
              className="h-24 rounded-lg border border-cosmos-aurora/30"
              style={{
                background: `linear-gradient(135deg, ${result.palette.primary}, ${result.palette.secondary}, ${result.palette.accent})`,
                boxShadow: `0 0 40px ${result.palette.emissive}`,
              }}
            />
            <div className="text-sm text-cosmos-star/70">
              <span className="font-mono uppercase tracking-wider">{result.mood}</span> ·{" "}
              <span className="font-mono">{result.biome_hint}</span>
            </div>
            <pre className="whitespace-pre-wrap font-display text-cosmos-star/90 italic leading-relaxed text-base border-l-2 border-cosmos-aurora/40 pl-4">
              {result.poem}
            </pre>
            <p className="text-sm text-cosmos-star/60">{result.summary}</p>
            {!isAuthenticated && (
              <div className="rounded-lg border border-cosmos-aurora/40 bg-cosmos-aurora/5 px-4 py-3 text-sm text-cosmos-star/80">
                {t("editor.demoSaveHint")}{" "}
                <a href="/login" className="text-cosmos-aurora underline underline-offset-2 hover:text-cosmos-star">
                  {t("nav.signin")} →
                </a>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-cosmos-star/20 text-cosmos-star/70 hover:text-cosmos-star"
              >
                {t("editor.continue")}
              </button>
              {createdPlanetId && (
                <button
                  onClick={visitPlanet}
                  className="px-6 py-2 rounded-lg bg-cosmos-aurora/20 border border-cosmos-aurora text-cosmos-star hover:bg-cosmos-aurora/40"
                >
                  {t("editor.visit")} →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
