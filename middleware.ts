import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res;

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options as never),
          );
        },
      },
    },
  );

  // Refresh session if expired
  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
