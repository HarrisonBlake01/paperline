import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Paperline — Turn documents into answers.",
    template: "%s · Paperline",
  },
  description:
    "Paperline turns documents into structured fields and cited answers for human review. Built by Harrison Olvera under the Olvera Productions brand.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://paperline-xi.vercel.app",
  ),
  openGraph: {
    title: "Paperline — Turn documents into answers.",
    description:
      "AI document intelligence with structured extraction, cited retrieval, and reviewable outputs.",
    siteName: "Paperline",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-pl-bg text-pl-fg flex flex-col">
          {children}
          <Toaster position="top-right" theme="dark" />
        </body>
      </html>
    </ClerkProvider>
  );
}
