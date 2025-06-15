import type { Metadata } from "next";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import "./globals.css";

export const metadata: Metadata = {
  title: "Rephrasely",
  description: "AI-powered text rephrasing tool",
};

// Client-side layout component
function ClientLayout({ children }: { children: React.ReactNode }) {
  // Load the rephraseFromMain script on the client side only
  if (typeof window !== 'undefined') {
    import('../renderer/rephraseFromMain.js');
  }

  return (
    <MantineProvider>
      {children}
    </MantineProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
