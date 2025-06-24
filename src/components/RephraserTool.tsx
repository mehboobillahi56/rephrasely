'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Grid,
  Textarea,
  Button,
  Select,
  Group,
  Stack,
  Alert,
  Loader,
  ThemeIcon,
  Badge,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { Profile, LLMConfig, HotkeyConfig } from '@/lib/types';
import {
  IconSparkles,
  IconCopy,
  IconRefresh,
  IconWand,
  IconArrowRight,
  IconAlertCircle,
  IconCheck,
  IconRobot,
  IconKey,
} from '@tabler/icons-react';

export function RephraserTool() {
  const [profiles] = useLocalStorageState<Profile[]>('rephrasely-profiles', []);
  const [llmConfig] = useLocalStorageState<LLMConfig>('rephrasely-llm-config', {
    google: { apiKey: '' },
    meta: { apiKey: '' },
    anthropic: { apiKey: '' }
  });
  const [hotkeyConfig] = useLocalStorageState<HotkeyConfig[]>('rephrasely-hotkey-config', []);
  
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useLocalStorageState<string>('rephrasely-selected-profile', '');
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);
  const hasApiKey = selectedProfile ? llmConfig[selectedProfile.provider]?.apiKey : false;

  // Modified to optionally return outputText for Electron clipboard
  const handleRephrase = React.useCallback(async (returnOutput?: boolean) => {
    if (!inputText.trim()) {
      notifications.show({
        title: 'Input Required',
        message: 'Please enter some text to rephrase',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    if (!selectedProfile) {
      notifications.show({
        title: 'Profile Required',
        message: 'Please select a rephrasing profile',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    if (!hasApiKey) {
      notifications.show({
        title: 'API Key Required',
        message: `Please configure your ${selectedProfile.provider} API key in Settings`,
        color: 'red',
        icon: <IconKey size={16} />,
      });
      return;
    }

    setIsRephrasing(true);
    try {
      const response = await fetch('/api/rephraseText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          prompt: selectedProfile.prompt,
          apiKey: llmConfig[selectedProfile.provider]?.apiKey || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = data.rephrasedText;
      
      setOutputText(result);
      if (returnOutput) return result;
      notifications.show({
        title: 'Success!',
        message: 'Text rephrased successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      console.error('Rephrasing failed:', error);
      notifications.show({
        title: 'Rephrasing Failed',
        message: 'An error occurred while rephrasing your text',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setIsRephrasing(false);
    }
    if (returnOutput) return outputText;
  }, [inputText, selectedProfile, llmConfig, setOutputText, setIsRephrasing, hasApiKey, outputText]);

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google': return 'blue';
      case 'meta': return 'orange';
      case 'anthropic': return 'violet';
      default: return 'gray';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return IconRobot;
      case 'meta': return IconWand;
      case 'anthropic': return IconSparkles;
      default: return IconRobot;
    }
  };


  const handleCopy = async () => {
    if (outputText) {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      notifications.show({
        title: 'Copied!',
        message: 'Text copied to clipboard',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    notifications.show({
      title: 'Cleared',
      message: 'Text areas have been cleared',
      color: 'blue',
      icon: <IconRefresh size={16} />,
    });
  };

  if (!isMounted) {
    return (
      <Container size="lg">
        <Stack align="center" py="xl">
          <Loader size="lg" color="forest.6" />
          <Text c="dimmed">Loading Rephrasely...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Stack align="center" gap="md">
          <Group gap="md">
            <ThemeIcon size="xl" variant="gradient" gradient={{ from: 'forest.6', to: 'teal.6' }}>
              <IconSparkles size={28} />
            </ThemeIcon>
            <Title 
              order={1} 
              size="3rem"
              c="forest.8"
            >
              AI Text Rephraser
            </Title>
          </Group>
          <Text size="lg" c="dimmed" ta="center" maw={600}>
            Transform your text with AI-powered rephrasing. Choose from custom profiles to match your desired tone and style.
          </Text>
        </Stack>

        {/* Profile Selection */}
        <Paper shadow="sm" radius="md" p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="forest.6">
                <IconWand size={14} />
              </ThemeIcon>
              <Title order={4}>Select Rephrasing Profile</Title>
            </Group>
            
            {profiles.length === 0 ? (
              <Alert 
                icon={<IconAlertCircle size={16} />} 
                title="No profiles configured"
                color="yellow"
                variant="light"
              >
                Create profiles in the Profiles section to get started
              </Alert>
            ) : (
              <Stack gap="sm">
                <Select
                  placeholder="Choose a rephrasing profile..."
                  data={profiles.map(profile => {
                    return {
                      value: profile.id,
                      label: profile.name,
                    };
                  })}
                  value={selectedProfileId}
                  onChange={(value) => setSelectedProfileId(value || '')}
                  leftSection={selectedProfile && (
                    <ThemeIcon 
                      size="xs" 
                      variant="light" 
                      color={getProviderColor(selectedProfile.provider)}
                    >
                      {React.createElement(getProviderIcon(selectedProfile.provider), { size: 12 })}
                    </ThemeIcon>
                  )}
                  styles={{
                    input: {
                      fontSize: '14px',
                    },
                  }}
                />
                
                {selectedProfile && (
                  <Group gap="xs">
                    <Badge 
                      variant="light" 
                      color={getProviderColor(selectedProfile.provider)}
                      leftSection={React.createElement(getProviderIcon(selectedProfile.provider), { size: 12 })}
                    >
                      {selectedProfile.provider}
                    </Badge>
                    {!hasApiKey && (
                      <Badge variant="light" color="red" leftSection={<IconKey size={12} />}>
                        API Key Required
                      </Badge>
                    )}
                    {hotkeyConfig.find(h => h.profileId === selectedProfile.id) && (
                      <Badge variant="light" color="gray">
                        {hotkeyConfig.find(h => h.profileId === selectedProfile.id)?.keyLabel}
                      </Badge>
                    )}
                  </Group>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>

        {/* Text Areas */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
              <Stack gap="md" h="100%">
                <Group gap="xs">
                  <ThemeIcon size="sm" variant="light" color="blue.6">
                    <IconArrowRight size={14} />
                  </ThemeIcon>
                  <Title order={5}>Original Text</Title>
                </Group>
                <Text size="sm" c="dimmed">
                  Enter the text you want to rephrase
                </Text>
                <Textarea
                  placeholder="Type or paste your text here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  minRows={12}
                  maxRows={12}
                  styles={{
                    input: {
                      fontSize: '14px',
                      lineHeight: 1.6,
                    },
                  }}
                />
                <Text size="xs" c="dimmed">
                  {inputText.length} characters • {inputText.split(/\s+/).filter(Boolean).length} words
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
              <Stack gap="md" h="100%">
                <Group gap="xs" justify="space-between">
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="green.6">
                      <IconSparkles size={14} />
                    </ThemeIcon>
                    <Title order={5}>Rephrased Text</Title>
                  </Group>
                  {outputText && (
                    <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'}>
                      <ActionIcon
                        variant="light"
                        color={copied ? 'green' : 'gray'}
                        onClick={handleCopy}
                        size="sm"
                      >
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
                <Text size="sm" c="dimmed">
                  AI-generated rephrased version of your text
                </Text>
                <Textarea
                  placeholder="Rephrased text will appear here..."
                  value={outputText}
                  readOnly
                  minRows={12}
                  maxRows={12}
                  styles={{
                    input: {
                      fontSize: '14px',
                      lineHeight: 1.6,
                      backgroundColor: outputText ? '#f8f9fa' : undefined,
                    },
                  }}
                />
                {outputText && (
                  <Text size="xs" c="dimmed">
                    {outputText.length} characters • {outputText.split(/\s+/).filter(Boolean).length} words
                  </Text>
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Action Buttons */}
        <Group justify="center" gap="md">
          <Button
            size="lg"
            variant="gradient"
            gradient={{ from: 'forest.6', to: 'teal.6' }}
            leftSection={isRephrasing ? <Loader size={16} color="white" /> : <IconSparkles size={16} />}
            onClick={async () => { await handleRephrase(); }}
            disabled={isRephrasing || !inputText.trim() || !selectedProfile || !hasApiKey}
            loading={isRephrasing}
          >
            {isRephrasing ? 'Rephrasing...' : 'Rephrase Text'}
          </Button>
          
          <Button
            size="lg"
            variant="light"
            color="gray"
            leftSection={<IconRefresh size={16} />}
            onClick={handleClear}
            disabled={isRephrasing}
          >
            Clear
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
