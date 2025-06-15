'use client';
import Link from 'next/link';

import { usePathname } from 'next/navigation';
import {
  AppShell,
  NavLink,
  Burger,
  Group,
  Title,
  Stack,
  Paper,
  ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSparkles,
  IconUser,
  IconSettings,
  IconFileText,
} from '@tabler/icons-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Rephraser',
      icon: IconSparkles,
      color: 'forest.6',
    },
    {
      href: '/profiles',
      label: 'Profiles',
      icon: IconUser,
      color: 'teal.6',
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: IconSettings,
      color: 'pastel.6',
    },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          backgroundColor: '#f8f9fa',
          minHeight: '100vh',
        },
        navbar: {
          backgroundColor: 'white',
          borderRight: '1px solid #e9ecef',
        },
        header: {
          backgroundColor: 'white',
          borderBottom: '1px solid #e9ecef',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap="xs">
              <ThemeIcon size="lg" variant="light" color="forest.6">
                <IconFileText size={20} />
              </ThemeIcon>
              <Title order={3} c="forest.8">
                Rephrasely
              </Title>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.label}
                leftSection={
                  <ThemeIcon
                    size="sm"
                    variant={isActive ? 'filled' : 'light'}
                    color={item.color}
                  >
                    <Icon size={16} />
                  </ThemeIcon>
                }
                active={isActive}
                onClick={close}
                styles={{
                  root: {
                    borderRadius: '8px',
                    fontWeight: isActive ? 600 : 400,
                  },
                  label: {
                    fontSize: '14px',
                  },
                }}
              />
            );
          })}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Paper
          shadow="xs"
          radius="md"
          p="lg"
          style={{
            minHeight: 'calc(100vh - 120px)',
            backgroundColor: 'white',
          }}
        >
          {children}
        </Paper>
      </AppShell.Main>
    </AppShell>
  );
}
