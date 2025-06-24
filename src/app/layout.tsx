import type { Metadata } from "next";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";
import { ClientLayout } from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "Rephrasely",
  description: "AI-powered text rephrasing tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          <AppLayout>
            {children}
          </AppLayout>
        </ClientLayout>
      </body>
    </html>
  );
}
