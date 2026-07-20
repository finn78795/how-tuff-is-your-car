import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "How Tuff Is Your Car?", template: "%s · How Tuff Is Your Car?" },
  description: "A just-for-fun enthusiast car rating project covering classics, modern cars, comparisons, and photo recognition.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://how-tuff-is-your-car.vercel.app"),
  openGraph: { title: "How Tuff Is Your Car?", description: "Search a car and see how it scores for vibe, tuffness, speed, style, and fun.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader />{children}</body></html>;
}
