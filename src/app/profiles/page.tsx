import { ProfileManager } from "@/components/profiles/ProfileManager";

import { Container, Stack, Title, Text } from '@mantine/core';

export default function ProfilesPage() {
  return (
    <Container size="lg">
      <Stack gap="md" mb="xl">
        <Title order={1}>Rephrasing Profiles</Title>
        <Text c="dimmed">
          Create and manage custom rephrasing profiles with different prompts and AI models
        </Text>
      </Stack>
      <ProfileManager />
    </Container>
  );
}
