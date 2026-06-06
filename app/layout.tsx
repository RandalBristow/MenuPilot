import type { Metadata } from "next";
import { CartProvider } from "@/features/cart/context/CartProvider"
import { ThemedToastProvider } from "@/components/themed/ThemedToastProvider"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MenuPilot",
  description:
    "Mobile-first restaurant menu, ordering, and admin operations platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemedToastProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ThemedToastProvider>
      </body>
    </html>
  );
}
