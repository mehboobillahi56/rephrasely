'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Stack,
  Grid,
  Alert,
  ThemeIcon,
  Badge,
  ActionIcon,
  Modal,
  Select,
  Card,
  Divider,
  Kbd,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { Profile, HotkeyConfig } from '@/lib/types';
import {
  IconPlus,
  IconTrash,
  IconKeyboard,
  IconBolt,
  IconSettings,
  IconPlayerPlay,
  IconTarget,
  IconAlertCircle,
  IconInfoCircle,
  IconMicrophone,
  IconCheck,
} from '@tabler/icons-react';

export function HotkeyConfigManager() {
  const [profiles] = useLocalStorageState<Profile[]>('rephrasely-profiles', []);
  const [hotkeyConfigs, setHotkeyConfigs] = useLocalStorageState<HotkeyConfig[]>('rephrasely-hotkey-config', []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    profileId: '',
    combination: '',
    keyLabel: '',
  });

  useEffect(() => {
    setIsMounted(true);
    
    // Add a default test hotkey if none exist and profiles are available
    if (hotkeyConfigs.length === 0 && profiles.length > 0) {
      const defaultHotkey: HotkeyConfig = {
        id: 'default-test-hotkey',
        profileId: profiles[0].id,
        combination: 'Ctrl+Shift+R',
        keyLabel: 'Quick Rephrase (Default)',
      };
      setHotkeyConfigs([defaultHotkey]);
    }
  }, [profiles, hotkeyConfigs, setHotkeyConfigs]);

  // Sync hotkey config to Electron with debouncing
  useEffect(() => {
    if (!isMounted) return; // Don't sync until component is mounted
    
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('[HotkeyManager] Syncing hotkey configs to Electron:', hotkeyConfigs);
        // Send hotkey configs to Electron main process
        window.electronAPI.setHotkeyConfig(hotkeyConfigs);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [hotkeyConfigs, isMounted]);

  const resetForm = () => {
    setFormData({
      profileId: '',
      combination: '',
      keyLabel: '',
    });
    setIsRecording(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const startRecording = () => {
    setIsRecording(true);
    setFormData(prev => ({ ...prev, combination: '' }));
    
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const keys = [];
      if (e.ctrlKey || e.metaKey) keys.push(e.metaKey ? 'Cmd' : 'Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      
      if (e.key !== 'Control' && e.key !== 'Meta' && e.key !== 'Alt' && e.key !== 'Shift') {
        keys.push(e.key.toUpperCase());
      }
      
      if (keys.length > 1) {
        const combination = keys.join('+');
        setFormData(prev => ({ ...prev, combination }));
        setIsRecording(false);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Auto-stop recording after 10 seconds
    setTimeout(() => {
      setIsRecording(false);
      document.removeEventListener('keydown', handleKeyDown);
    }, 10000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.profileId) {
      notifications.show({
        title: 'Profile Required',
        message: 'Please select a profile',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    if (!formData.combination) {
      notifications.show({
        title: 'Key Combination Required',
        message: 'Please record a key combination',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    if (!formData.keyLabel.trim()) {
      notifications.show({
        title: 'Label Required',
        message: 'Please enter a label',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    // Check if key combination already exists
    const existingHotkey = hotkeyConfigs.find(config => config.combination === formData.combination);
    if (existingHotkey) {
      notifications.show({
        title: 'Duplicate Key Combination',
        message: 'This key combination is already in use',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    const newHotkeyConfig: HotkeyConfig = {
      id: Date.now().toString(),
      profileId: formData.profileId,
      combination: formData.combination,
      keyLabel: formData.keyLabel.trim(),
    };

    setHotkeyConfigs(prev => [...prev, newHotkeyConfig]);
    notifications.show({
      title: 'Success!',
      message: 'Hotkey created successfully!',
      color: 'green',
      icon: <IconCheck size={16} />,
    });
    closeModal();
  };

  const handleDelete = (hotkeyId: string) => {
    setHotkeyConfigs(prev => prev.filter(config => config.id !== hotkeyId));
    notifications.show({
      title: 'Deleted',
      message: 'Hotkey deleted successfully!',
      color: 'blue',
      icon: <IconCheck size={16} />,
    });
  };

  const getProfileName = (profileId: string) => {
    return profiles.find(p => p.id === profileId)?.name || 'Unknown Profile';
  };

  const getProfileProvider = (profileId: string) => {
    return profiles.find(p => p.id === profileId)?.provider || 'google';
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google': return 'blue';
      case 'meta': return 'orange';
      case 'anthropic': return 'violet';
      default: return 'gray';
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Container size="lg">
      <Stack gap="xl">
        {/* Header with Create Button */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2} mb="xs">Keyboard Shortcuts</Title>
            <Text c="dimmed">
              Create custom hotkeys to quickly access your favorite rephrasing profiles
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreateModal}
            variant="gradient"
            gradient={{ from: 'forest.6', to: 'pastel.6' }}
          >
            Create Hotkey
          </Button>
        </Group>

        {/* Hotkey Grid */}
        {hotkeyConfigs.length === 0 ? (
          <Paper shadow="sm" radius="md" p="xl" withBorder style={{ borderStyle: 'dashed' }}>
            <Stack align="center" gap="lg">
              <ThemeIcon size="xl" variant="light" color="gray">
                <IconKeyboard size={28} />
              </ThemeIcon>
              <div style={{ textAlign: 'center' }}>
                <Title order={3} mb="sm">No Hotkeys Yet</Title>
                <Text c="dimmed" mb="lg">
                  Create your first hotkey to quickly access rephrasing profiles
                </Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={openCreateModal}
                  variant="light"
                >
                  Create Your First Hotkey
                </Button>
              </div>
            </Stack>
          </Paper>
        ) : (
          <Grid>
            {hotkeyConfigs.map((hotkey) => {
              const provider = getProfileProvider(hotkey.profileId);
              const providerColor = getProviderColor(provider);
              
              return (
                <Grid.Col key={hotkey.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card 
                    shadow="sm" 
                    radius="md" 
                    p="lg" 
                    withBorder
                    style={{
                      height: '100%',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    styles={{
                      root: {
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                        },
                      },
                    }}
                  >
                    <Stack gap="md" h="100%">
                      {/* Header */}
                      <Group justify="space-between" align="flex-start">
                        <Group gap="sm" style={{ flex: 1 }}>
                          <ThemeIcon 
                            size="lg" 
                            variant="light" 
                            color={providerColor}
                          >
                            <IconBolt size={20} />
                          </ThemeIcon>
                          <div style={{ flex: 1 }}>
                            <Title order={4} lineClamp={1}>{hotkey.keyLabel}</Title>
                            <Text size="sm" c="dimmed" lineClamp={1}>
                              {getProfileName(hotkey.profileId)}
                            </Text>
                          </div>
                        </Group>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(hotkey.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>

                      {/* Key Combination Display */}
                      <Paper p="md" withBorder style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Kbd 
                          style={{ 
                            fontSize: '14px', 
                            fontWeight: 600,
                            color: `var(--mantine-color-${providerColor}-7)`,
                            backgroundColor: `var(--mantine-color-${providerColor}-0)`,
                            border: `1px solid var(--mantine-color-${providerColor}-3)`,
                          }}
                        >
                          {hotkey.combination}
                        </Kbd>
                      </Paper>

                      {/* Provider Badge */}
                      <Badge 
                        variant="light" 
                        color={providerColor}
                        size="sm"
                        style={{ alignSelf: 'flex-start' }}
                      >
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </Badge>
                    </Stack>
                  </Card>
                </Grid.Col>
              );
            })}
          </Grid>
        )}

        <Divider />

        {/* Help Section */}
        <Paper shadow="sm" radius="md" p="xl" withBorder style={{ borderStyle: 'dashed' }}>
          <Stack align="center" gap="lg">
            <ThemeIcon size="xl" variant="light" color="violet">
              <IconSettings size={28} />
            </ThemeIcon>
            
            <div style={{ textAlign: 'center' }}>
              <Title order={3} mb="sm">How Hotkeys Work</Title>
              <Text c="dimmed" mb="lg">
                Use these keyboard shortcuts in the main Rephraser tool for instant access
              </Text>
            </div>
            
            <Grid style={{ width: '100%', maxWidth: '600px' }}>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Paper p="md" withBorder style={{ textAlign: 'center' }}>
                  <Stack gap="sm">
                    <ThemeIcon 
                      size="lg" 
                      variant="light" 
                      color="green"
                      mx="auto"
                    >
                      <IconPlayerPlay size={20} />
                    </ThemeIcon>
                    <Title order={5}>Quick Access</Title>
                    <Text size="sm" color="dimmed">
                      You can configure global hotkeys for quick access. The hotkey must include <b>Cmd</b> or <b>Ctrl</b>. Examples: <code>Cmd+Shift+R</code>, <code>Ctrl+Alt+H</code>. Don&apos;t use system-reserved combos.
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Paper p="md" withBorder style={{ textAlign: 'center' }}>
                  <Stack gap="sm">
                    <ThemeIcon 
                      size="lg" 
                      variant="light" 
                      color="blue"
                      mx="auto"
                    >
                      <IconTarget size={20} />
                    </ThemeIcon>
                    <Title order={5}>Best Practices</Title>
                    <Text size="sm" c="dimmed">
                      Use unique combinations that don&apos;t conflict with browser shortcuts. Recommended: Ctrl+Shift+Letter
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        {/* Create Hotkey Modal */}
        <Modal
          opened={isModalOpen}
          onClose={closeModal}
          title={
            <Group gap="sm">
              <ThemeIcon size="sm" variant="light" color="forest">
                <IconKeyboard size={16} />
              </ThemeIcon>
              <Title order={4}>Create New Hotkey</Title>
            </Group>
          }
          size="md"
          centered
        >
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Select
                label="Profile"
                placeholder="Select a profile"
                value={formData.profileId}
                onChange={(value) => setFormData(prev => ({ ...prev, profileId: value || '' }))}
                data={profiles.map(profile => ({
                  value: profile.id,
                  label: `${profile.name} (${profile.provider})`,
                }))}
                required
              />

              <TextInput
                label="Label"
                placeholder="Enter a descriptive label"
                value={formData.keyLabel}
                onChange={(e) => setFormData(prev => ({ ...prev, keyLabel: e.target.value }))}
                required
              />

              <div>
                <Text size="sm" fw={500} mb="xs">Key Combination</Text>
                <Group gap="sm">
                  <TextInput
                    placeholder="Press 'Record' and then your key combination"
                    value={formData.combination}
                    readOnly
                    style={{ flex: 1 }}
                  />
                  <Button
                    variant={isRecording ? 'filled' : 'light'}
                    color={isRecording ? 'red' : 'blue'}
                    onClick={startRecording}
                    disabled={isRecording}
                    leftSection={<IconMicrophone size={16} />}
                  >
                    {isRecording ? 'Recording...' : 'Record'}
                  </Button>
                </Group>
                {isRecording && (
                  <Alert 
                    icon={<IconInfoCircle size={16} />}
                    title="Recording Keys"
                    color="blue"
                    variant="light"
                    mt="xs"
                  >
                    Press your desired key combination now. Use modifier keys (Ctrl/Cmd + Shift + Letter) for best results.
                  </Alert>
                )}
              </div>

              <Group justify="flex-end" gap="sm" mt="md">
                <Button variant="subtle" onClick={closeModal}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="gradient"
                  gradient={{ from: 'forest.6', to: 'pastel.6' }}
                  disabled={!formData.profileId || !formData.combination || !formData.keyLabel.trim()}
                >
                  Create Hotkey
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Container>
  );
}
