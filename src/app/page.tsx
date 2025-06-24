'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, Center } from '@mantine/core';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profiles');
  }, [router]);

  return (
    <Center h="100vh">
      <Loader size="lg" />
    </Center>
  );
}
