import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IAM - Configuratore 3D",
  description: "Configuratore 3D per sgabelli da yacht di lusso. Realizzato con leghe marine di alta qualità e tessuti resistenti agli agenti atmosferici.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased overflow-hidden"
        style={{
          fontFamily: "'Source Sans 3', sans-serif",
          backgroundColor: '#0c0e12',
          color: '#e2e2e8',
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
