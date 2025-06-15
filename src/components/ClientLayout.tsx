"use client";
import { useEffect } from "react";
import { Notifications } from '@mantine/notifications';
import { AppLayout } from "@/components/AppLayout";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import('../renderer/rephraseFromMain.js');
  }, []);
  return (
    <>
      <Notifications position="top-right" />
      <AppLayout>{children}</AppLayout>
    </>
  );
}
