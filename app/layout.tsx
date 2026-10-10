import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LearnersKit | Every Student. Every Record. One System.",
  description: "A student information and records management system that streamlines student registration, enrollment, and academic recordkeeping.",
  icons: {
    icon: "Icon.png"
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en" suppressHydrationWarning
      >
      <body className={`${geistSans.variable} ${geistMono.variable} selection h-full antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
