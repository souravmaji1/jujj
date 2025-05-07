

// app/layout.tsx

import "./globals.css";
import { Aclonica } from "next/font/google";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ClerkProvider } from "@clerk/nextjs";

const unbounded = Aclonica({
  subsets: ["latin"],
  variable: "--font-aclonica",
  weight: ["400"],
});

const siteConfig = {
  name: "AISiteGen",
  description: "AI-powered chat and analysis platform for seamless interaction and information processing",
  keywords: ["AI", "chat", "analysis", "machine learning", "artificial intelligence"],
  authors: [{ name: " Team" }],
  creator: "",
  themeColor: "#22D3EE",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-domain.com",
    title: "AI Chat Platform",
    description: "AI-powered chat and analysis platform for seamless interaction and information processing",
    siteName: "NoBrainer",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chat Platform",
    description: "AI-powered chat and analysis platform for seamless interaction and information processing",
    creator: "@yourhandle",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
    <html lang="en">
      <head>
        <title>{siteConfig.name}</title>
      </head>
      <body className={unbounded.className}>
   
          <div className="">
            {children}
          </div>

      </body>
    </html>
    </GoogleOAuthProvider>
    </ClerkProvider>
  );
}