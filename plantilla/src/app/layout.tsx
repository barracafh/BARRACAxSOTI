import type { Metadata } from "next";
import type { ReactNode } from "react";
import ficha from "../../ficha.json";
import "./globals.css";

export const metadata: Metadata = {
  title: ficha.nombre,
  description: ficha.frase,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
