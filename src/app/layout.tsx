import type { Metadata, Viewport } from "next";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "AI Challenger — Stress-test your strategy in seconds",
  description:
    "Snap the workshop board or type an idea and get Blind Spots, Fatal Hypotheses and Uncomfortable Questions from four strategic hats, powered by Groq.",
  applicationName: "AI Challenger",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "AI Challenger",
    description: "Strategic challenge cards for innovation workshops, in under 2 seconds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
