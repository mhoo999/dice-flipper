import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Dice Flipper - 보드게임 주사위 시뮬레이터",
  description: "TRPG, 야추, 보드게임용 3D 주사위 시뮬레이터. D4, D6, D8, D10, D12, D20 지원. 커스터마이징 가능.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
