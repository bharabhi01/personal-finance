import type { Metadata } from "next";
import { Sofia_Sans_Semi_Condensed, Varela_Round } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const sofiaSans = Sofia_Sans_Semi_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sofia-sans"
});

const varelaRound = Varela_Round({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-varela-round"
});

export const metadata: Metadata = {
  title: "Personal Finance Tracker",
  description: "Track your income, expenses, and investments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sofiaSans.className} ${varelaRound.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
