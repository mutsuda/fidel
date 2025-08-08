"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Navbar from "./Navbar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <title>Shokupan - Tarjetas de Fidelidad</title>
        <meta name="description" content="Crea, personaliza y valida tarjetas de fidelidad con QR seguro" />
      </head>
      <body className="bg-gray-50 font-sans text-gray-900">
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
