import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpsPilot — AI Operations for Trades",
  description: "AI-powered operations platform for trades businesses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ClerkProvider validates the key at init — only wrap when key is present
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerkKey = clerkKey?.startsWith("pk_");

  if (!hasClerkKey) {
    return (
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
