import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atelier Maritime — 3D Configurator",
  description: "Luxury yacht bar stool configurator. Crafted with high-grade marine alloys and weather-resistant textiles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,100..900;1,100..900&family=Manrope:wght@200..800&display=swap"
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
          fontFamily: "'Manrope', sans-serif",
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
