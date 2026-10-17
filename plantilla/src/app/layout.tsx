import type { Metadata } from "next";
import { Space_Mono, Syne } from "next/font/google";
import type { ReactNode } from "react";
import ficha from "../../ficha.json";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: ficha.nombre,
  description: ficha.frase,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${syne.variable} ${spaceMono.variable}`}>
      <body>
        <p
          role="note"
          className="border-b border-paper/15 px-6 py-2 text-center text-[0.7rem] tracking-[0.16em] text-muted uppercase"
        >
          Herramienta experimental. No es un servicio oficial.
        </p>
        {children}
      </body>
    </html>
  );
}
