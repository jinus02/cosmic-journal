import Link from "next/link";

export default function Landing() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, #0a0c1a 0%, #04050a 60%), radial-gradient(circle at 30% 20%, rgba(122,156,255,0.15), transparent 40%), radial-gradient(circle at 70% 80%, rgba(255,138,168,0.12), transparent 50%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-5xl md:text-7xl text-cosmos-star tracking-tight">
          Cosmic Journal
        </h1>
        <p className="mt-4 text-cosmos-star/70 text-lg md:text-xl max-w-xl">
          Walk an infinite universe.<br />Leave a planet shaped by the words you couldn't say.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/universe"
            className="rounded-full border border-cosmos-aurora bg-cosmos-aurora/10 px-8 py-3 text-cosmos-star hover:bg-cosmos-aurora/30 transition"
          >
            Enter the universe →
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-cosmos-star/30 px-8 py-3 text-cosmos-star/80 hover:text-cosmos-star hover:border-cosmos-star/60 transition"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-16 text-xs text-cosmos-star/40 font-mono">
          made with three.js · gemini · supabase · vercel
        </p>
      </div>
    </main>
  );
}
