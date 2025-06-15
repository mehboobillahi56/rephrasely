'use client';

import { Container, Title, Stack, Tabs } from '@mantine/core';
import { LLMConfigManager } from '@/components/settings/LLMConfigManager';
import { HotkeyConfigManager } from '@/components/settings/HotkeyConfigManager';

export default function SettingsPage() {
  return (
    <Container>
      <Stack gap="xl">
        <Title>Settings</Title>
        <Tabs defaultValue="llm-config">
          <Tabs.List>
            <Tabs.Tab value="llm-config">AI Providers</Tabs.Tab>
            <Tabs.Tab value="hotkey-config">Hotkeys</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="llm-config">
            <LLMConfigManager />
          </Tabs.Panel>
          <Tabs.Panel value="hotkey-config">
            <HotkeyConfigManager />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
