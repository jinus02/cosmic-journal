"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/useI18n";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
}

export function CommentList({ entryId }: { entryId: string }) {
  const t = useI18n();
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Initial load
    supabase
      .from("comments")
      .select("id, body, created_at, author_id")
      .eq("entry_id", entryId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setComments(data ?? []));

    // Realtime
    const channel = supabase
      .channel(`comments:${entryId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `entry_id=eq.${entryId}` },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entryId]);

  const send = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entry_id: entryId, body: draft.trim() }),
      });
      if (res.ok) setDraft("");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="mt-6 space-y-3">
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="text-sm text-cosmos-star/80 border-l border-cosmos-aurora/20 pl-3">
            {c.body}
            <span className="ml-2 text-xs font-mono text-cosmos-star/30">
              {new Date(c.created_at).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("share.commentPlaceholder")}
          className="flex-1 rounded bg-cosmos-deep border border-cosmos-aurora/20 px-3 py-2 text-sm text-cosmos-star placeholder:text-cosmos-star/30 focus:outline-none focus:border-cosmos-aurora"
        />
        <button
          onClick={send}
          disabled={posting}
          className="rounded border border-cosmos-aurora bg-cosmos-aurora/20 px-4 py-2 text-sm text-cosmos-star hover:bg-cosmos-aurora/40 disabled:opacity-50"
        >
          {t("share.send")}
        </button>
      </div>
    </section>
  );
}
