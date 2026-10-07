import type { Metadata, Viewport } from "next";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "AI Challenger — Desafía tu estrategia en segundos",
  description:
    "Fotografía el tablero del taller o escribe una idea y recibe Puntos Ciegos, Hipótesis Fatales y Preguntas Incómodas desde cuatro sombreros estratégicos, impulsado por Groq.",
  applicationName: "AI Challenger",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "AI Challenger",
    description: "Tarjetas de desafío estratégico para talleres de innovación, en menos de 2 segundos.",
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
    <html lang="es" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
