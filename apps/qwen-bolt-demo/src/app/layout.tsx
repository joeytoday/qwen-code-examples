import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TokenProvider } from "@/contexts/TokenContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { EditorProvider } from "@/contexts/EditorContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { I18nProvider } from "@/components/I18nProvider";
import { ToastContainer } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Qwen Coder - AI Code Studio",
  description: "Create stunning apps & websites by chatting with AI. Powered by Qwen Code SDK.",
  keywords: ["AI", "code generation", "Qwen", "web development", "app builder", "AI coding assistant"],
  authors: [{ name: "Qwen Code Team" }],
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-512.svg',
  },
  openGraph: {
    title: "Qwen Coder - AI Code Studio",
    description: "Create stunning apps & websites by chatting with AI. Powered by Qwen Code SDK.",
    type: "website",
    siteName: "Qwen Coder",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qwen Coder - AI Code Studio",
    description: "Create stunning apps & websites by chatting with AI. Powered by Qwen Code SDK.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TokenProvider>
            <NotificationProvider>
              <EditorProvider>
                <ProjectProvider>
                  <I18nProvider>
                    {children}
                    <ToastContainer />
                  </I18nProvider>
                </ProjectProvider>
              </EditorProvider>
            </NotificationProvider>
          </TokenProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
