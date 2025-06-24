'use client';

import { Container, Title, Stack, Tabs } from '@mantine/core';
import { LLMConfigManager } from '@/components/settings/LLMConfigManager';

export default function SettingsPage() {
  return (
    <>
      <Stack gap="xl">
        <Title>Settings</Title>
        <Tabs defaultValue="llm-config">
          <Tabs.List>
            <Tabs.Tab value="llm-config">AI Providers</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="llm-config">
            <LLMConfigManager />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </>
  );
}
