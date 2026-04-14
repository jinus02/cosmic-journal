import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cosmic Journal — Walk the stars, leave a planet",
  description:
    "An infinite procedurally-generated universe where you can record your feelings on your own planet, then share it with travelers from across the cosmos.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Cosmic Journal",
    description: "Walk the stars. Leave a planet.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
