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
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { LLMConfig, LLMProvider } from '@/lib/types';
import {
  IconEye,
  IconEyeOff,
  IconKey,
  IconCheck,
  IconShield,
  IconExternalLink,
  IconRobot,
  IconWand,
  IconSparkles,
  IconAlertCircle,
  IconInfoCircle,
} from '@tabler/icons-react';

const providers: { 
  id: LLMProvider; 
  name: string; 
  description: string; 
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  getKeyUrl: string;
}[] = [
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini models for advanced text generation and reasoning',
    icon: IconRobot,
    color: 'blue',
    getKeyUrl: 'https://ai.google.dev/',
  },
  {
    id: 'meta',
    name: 'Meta',
    description: 'Llama models for open-source AI capabilities',
    icon: IconWand,
    color: 'orange',
    getKeyUrl: 'https://together.ai/',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for thoughtful and helpful responses',
    icon: IconSparkles,
    color: 'violet',
    getKeyUrl: 'https://console.anthropic.com/',
  },
];

export function LLMConfigManager() {
  const [llmConfig, setLlmConfig] = useLocalStorageState<LLMConfig>('rephrasely-llm-config', {
    google: { apiKey: '' },
    meta: { apiKey: '' },
    anthropic: { apiKey: '' }
  });
  const [apiKeys, setApiKeys] = useState<Record<LLMProvider, string>>({
    google: '',
    meta: '',
    anthropic: '',
  });
  const [showKeys, setShowKeys] = useState<Record<LLMProvider, boolean>>({
    google: false,
    meta: false,
    anthropic: false,
  });
  const [isMounted, setIsMounted] = useState(false);

  // Anthropic dynamic model state
  const [anthropicModels, setAnthropicModels] = useState<{ id: string, displayName: string }[]>([]);
  const [anthropicModel, setAnthropicModel] = useState<string>('');
  const [anthropicLoading, setAnthropicLoading] = useState(false);
  const [anthropicError, setAnthropicError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Fetch Anthropic models when API key changes
  useEffect(() => {
    const key = apiKeys.anthropic.trim();
    if (!key) {
      setAnthropicModels([]);
      setAnthropicModel('');
      setAnthropicError(null);
      return;
    }
    setAnthropicLoading(true);
    setAnthropicError(null);
    fetch('/api/getAnthropicModels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key })
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to fetch models');
        }
        return res.json();
      })
      .then((data) => {
        setAnthropicModels(data.models || []);
        setAnthropicModel((m) => data.models?.find((mod: any) => mod.id === m) ? m : (data.models?.[0]?.id || ''));
      })
      .catch((err) => {
        setAnthropicModels([]);
        setAnthropicModel('');
        setAnthropicError(err.message || 'Failed to fetch models');
      })
      .finally(() => setAnthropicLoading(false));
  }, [apiKeys.anthropic]);

  // Test Anthropic key/model
  const handleTestAnthropic = async () => {
    setTestLoading(true);
    setAnthropicError(null);
    try {
      const res = await fetch('/api/rephraseText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello from Rephrasely!',
          prompt: '',
          apiKey: apiKeys.anthropic.trim(),
          provider: 'anthropic',
          model: anthropicModel,
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || data.detail || 'Test failed');
      }
      notifications.show({
        title: 'Success!',
        message: `Model responded: ${data.rephrased || data.text || 'Success'}`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (err: any) {
      notifications.show({
        title: 'Test Failed',
        message: err.message || 'Could not test Anthropic key/model',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setTestLoading(false);
    }
  };


  useEffect(() => {
    setIsMounted(true);
    // Load existing API keys
    const initialKeys: Record<LLMProvider, string> = { 
      google: llmConfig.google.apiKey || '',
      meta: llmConfig.meta.apiKey || '',
      anthropic: llmConfig.anthropic.apiKey || ''
    };
    setApiKeys(initialKeys);
  }, [llmConfig]);

  const handleSaveApiKey = (provider: LLMProvider) => {
    const apiKey = apiKeys[provider].trim();
    
    if (!apiKey) {
      notifications.show({
        title: 'API Key Required',
        message: 'API key cannot be empty',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setLlmConfig(prev => ({
      ...prev,
      [provider]: { apiKey }
    }));

    notifications.show({
      title: 'Success!',
      message: `${providers.find(p => p.id === provider)?.name} API key saved successfully!`,
      color: 'green',
      icon: <IconCheck size={16} />,
    });
  };

  const toggleShowKey = (provider: LLMProvider) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const isConfigured = (provider: LLMProvider) => {
    return !!llmConfig[provider]?.apiKey?.trim();
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Container size="lg">
      <Stack gap="xl">
        {/* Provider Cards */}
        <Grid>
          {providers.map((provider) => {
            const Icon = provider.icon;
            const configured = isConfigured(provider.id);
            
            return (
              <Grid.Col key={provider.id} span={{ base: 12, md: 6, lg: 4 }}>
                <Paper 
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
                    <Group gap="md" justify="space-between">
                      <Group gap="sm">
                        <ThemeIcon 
                          size="lg" 
                          variant="light" 
                          color={provider.color}
                        >
                          <Icon size={20} />
                        </ThemeIcon>
                        <div>
                          <Title order={4}>{provider.name}</Title>
                          {configured && (
                            <Badge 
                              variant="light" 
                              color="green" 
                              size="sm"
                              leftSection={<IconCheck size={12} />}
                            >
                              Configured
                            </Badge>
                          )}
                        </div>
                      </Group>
                    </Group>

                    <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                      {provider.description}
                    </Text>

                    {/* API Key Input */}
                    <Stack gap="sm">
                      {/* Anthropic Model Dropdown & Test Button */}
                      {provider.id === 'anthropic' && (
                        <>
                          <TextInput
                            label="API Key"
                            placeholder={`Enter your ${provider.name} API key`}
                            type={showKeys[provider.id] ? 'text' : 'password'}
                            value={apiKeys[provider.id]}
                            onChange={(e) => setApiKeys(prev => ({ 
                              ...prev, 
                              [provider.id]: e.target.value 
                            }))}
                            rightSection={
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                onClick={() => toggleShowKey(provider.id)}
                              >
                                {showKeys[provider.id] ? (
                                  <IconEyeOff size={16} />
                                ) : (
                                  <IconEye size={16} />
                                )}
                              </ActionIcon>
                            }
                            styles={{ input: { fontSize: '14px' } }}
                          />
                          {anthropicLoading && <Text size="xs" c="dimmed">Loading models...</Text>}
                          {anthropicError && <Text size="xs" c="red">{anthropicError}</Text>}
                          {anthropicModels.length > 0 && (
                            <>
                              <Text size="xs" c="dimmed" mt={4}>Select Model</Text>
                              <select
                                value={anthropicModel}
                                onChange={e => setAnthropicModel(e.target.value)}
                                style={{ width: '100%', padding: 8, borderRadius: 6, marginBottom: 8 }}
                              >
                                {anthropicModels.map((m) => (
                                  <option value={m.id} key={m.id}>{m.displayName} ({m.id})</option>
                                ))}
                              </select>
                              <Button
                                onClick={handleTestAnthropic}
                                loading={testLoading}
                                variant="light"
                                color="violet"
                                leftSection={<IconCheck size={16} />}
                                mt={4}
                                style={{ width: '100%' }}
                                disabled={!apiKeys.anthropic.trim() || !anthropicModel}
                              >
                                Test Connection
                              </Button>
                            </>
                          )}
                        </>
                      )}
                      {/* Non-Anthropic Providers */}
                      {provider.id !== 'anthropic' && (
                        <TextInput
                          label="API Key"
                          placeholder={`Enter your ${provider.name} API key`}
                          type={showKeys[provider.id] ? 'text' : 'password'}
                          value={apiKeys[provider.id]}
                          onChange={(e) => setApiKeys(prev => ({ 
                            ...prev, 
                            [provider.id]: e.target.value 
                          }))}
                          rightSection={
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              onClick={() => toggleShowKey(provider.id)}
                            >
                              {showKeys[provider.id] ? (
                                <IconEyeOff size={16} />
                              ) : (
                                <IconEye size={16} />
                              )}
                            </ActionIcon>
                          }
                          styles={{ input: { fontSize: '14px' } }}
                        />
                      )}

                      <TextInput
                        label="API Key"
                        placeholder={`Enter your ${provider.name} API key`}
                        type={showKeys[provider.id] ? 'text' : 'password'}
                        value={apiKeys[provider.id]}
                        onChange={(e) => setApiKeys(prev => ({ 
                          ...prev, 
                          [provider.id]: e.target.value 
                        }))}
                        rightSection={
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => toggleShowKey(provider.id)}
                          >
                            {showKeys[provider.id] ? (
                              <IconEyeOff size={16} />
                            ) : (
                              <IconEye size={16} />
                            )}
                          </ActionIcon>
                        }
                        styles={{
                          input: {
                            fontSize: '14px',
                          },
                        }}
                      />
                      
                      <Group gap="xs">
                        <Button 
                          onClick={() => handleSaveApiKey(provider.id)}
                          disabled={!apiKeys[provider.id].trim()}
                          variant="gradient"
                          gradient={{ from: provider.color + '.6', to: provider.color + '.8' }}
                          leftSection={<IconKey size={16} />}
                          style={{ flex: 1 }}
                        >
                          Save Key
                        </Button>
                        <ActionIcon
                          variant="light"
                          color={provider.color}
                          size="lg"
                          onClick={() => window.open(provider.getKeyUrl, '_blank')}
                        >
                          <IconExternalLink size={16} />
                        </ActionIcon>
                      </Group>
                    </Stack>

                    {/* Security Notice */}
                    <Alert 
                      icon={<IconShield size={16} />}
                      title="Secure & Private"
                      color={provider.color}
                      variant="light"
                      styles={{
                        root: {
                          fontSize: '12px',
                        },
                      }}
                    >
                      <Text size="xs">
                        • Stored locally in your browser<br/>
                        • Never sent to our servers<br/>
                        • Only used for AI API calls
                      </Text>
                    </Alert>
                  </Stack>
                </Paper>
              </Grid.Col>
            );
          })}
        </Grid>

        <Divider />

        {/* Help Section */}
        <Paper shadow="sm" radius="md" p="xl" withBorder style={{ borderStyle: 'dashed' }}>
          <Stack align="center" gap="lg">
            <ThemeIcon size="xl" variant="light" color="blue">
              <IconInfoCircle size={28} />
            </ThemeIcon>
            
            <div style={{ textAlign: 'center' }}>
              <Title order={3} mb="sm">Need Help Getting API Keys?</Title>
              <Text c="dimmed" mb="lg">
                Click the links below to get API keys from each provider
              </Text>
            </div>
            
            <Grid style={{ width: '100%', maxWidth: '600px' }}>
              {providers.map((provider) => {
                const Icon = provider.icon;
                return (
                  <Grid.Col key={provider.id} span={{ base: 12, sm: 4 }}>
                    <Paper p="md" withBorder style={{ textAlign: 'center' }}>
                      <Stack gap="sm">
                        <ThemeIcon 
                          size="lg" 
                          variant="light" 
                          color={provider.color}
                          mx="auto"
                        >
                          <Icon size={20} />
                        </ThemeIcon>
                        <Title order={5}>{provider.name}</Title>
                        <Button
                          variant="light"
                          color={provider.color}
                          size="sm"
                          rightSection={<IconExternalLink size={14} />}
                          onClick={() => window.open(provider.getKeyUrl, '_blank')}
                          fullWidth
                        >
                          Get API Key
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                );
              })}
            </Grid>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
