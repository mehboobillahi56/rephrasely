'use client';

import { useState, useEffect } from 'react';
import { Paper, Button, Group, Text, Modal, TextInput, Textarea as MantineTextarea, Select as MantineSelect, Badge, Title, Stack, SimpleGrid, Alert, Kbd, ThemeIcon, Container } from '@mantine/core';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { useToast } from '@/hooks/use-toast';
import { Profile, LLMProvider, LLMConfig, HotkeyConfig } from '@/lib/types';
import { IconPlus, IconEdit, IconTrash, IconSparkles, IconRobot, IconBolt, IconSettings, IconKeyboard, IconMicrophone, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react';

// Genkit-supported model IDs and display names
const GENKIT_GOOGLE_MODELS = [
  { id: 'googleai/gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { id: 'googleai/gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { id: 'googleai/gemini-pro', label: 'Gemini Pro' },
];
const GENKIT_ANTHROPIC_MODELS = [
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-opus', label: 'Claude 3 Opus' },
  { id: 'claude-3-haiku', label: 'Claude 3 Haiku' },
];

const LLM_PROVIDERS: { value: LLMProvider; label: string; models: { id: string; label: string }[] }[] = [
  {
    value: 'google',
    label: 'Google AI',
    models: GENKIT_GOOGLE_MODELS
  },
  {
    value: 'meta',
    label: 'Meta',
    models: [
      { id: 'llama-3.1-405b', label: 'Llama 3.1 405B' },
      { id: 'llama-3.1-70b', label: 'Llama 3.1 70B' },
      { id: 'llama-3.1-8b', label: 'Llama 3.1 8B' },
    ]
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    models: GENKIT_ANTHROPIC_MODELS
  }
];

export function ProfileManager() {
  // --- Dynamic model state for Anthropic ---
  const [anthropicModels, setAnthropicModels] = useState<{ id: string; label: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelFetchError, setModelFetchError] = useState<string | null>(null);
  const [profiles, setProfiles] = useLocalStorageState<Profile[]>('rephrasely-profiles', []);
  const [llmConfig] = useLocalStorageState<LLMConfig>('rephrasely-llm-config', {
    google: { apiKey: '' },
    meta: { apiKey: '' },
    anthropic: { apiKey: '' }
  });
  const [hotkeyConfig, setHotkeyConfig] = useLocalStorageState<HotkeyConfig[]>('rephrasely-hotkey-config', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    provider: '' as LLMProvider,
    model: '',
    hotkey: '',
  });
  const [isMounted, setIsMounted] = useState(false);
  const [recordingHotkey, setRecordingHotkey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync hotkey config to Electron
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.setHotkeyConfig(hotkeyConfig);
    }
  }, [hotkeyConfig]);

  // Fetch Anthropic models dynamically when provider or API key changes
  useEffect(() => {
    if (formData.provider === 'anthropic') {
      const apiKey = llmConfig.anthropic?.apiKey;
      if (!apiKey) {
        // If no API key, show the hardcoded Genkit models
        setAnthropicModels(GENKIT_ANTHROPIC_MODELS);
        setLoadingModels(false);
        return;
      }
      setLoadingModels(true);
      setModelFetchError(null);
      fetch('/api/getAnthropicModels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.models && Array.isArray(data.models)) {
            // Filter fetched models to only show Genkit-supported ones
            const supportedModels = data.models
              .filter((fetchedModel: any) => 
                GENKIT_ANTHROPIC_MODELS.some(supported => 
                  fetchedModel.id === supported.id || 
                  fetchedModel.id.includes(supported.id.replace('claude-', ''))
                )
              )
              .map((model: any) => ({
                id: model.id,
                label: model.displayName || model.id
              }));
            
            // If no supported models found, fall back to hardcoded ones
            setAnthropicModels(supportedModels.length > 0 ? supportedModels : GENKIT_ANTHROPIC_MODELS);
          } else {
            // Fallback to hardcoded models if API fails
            setAnthropicModels(GENKIT_ANTHROPIC_MODELS);
            setModelFetchError(data.error || 'Failed to fetch models, using default models');
          }
        })
        .catch(err => {
          // Fallback to hardcoded models on error
          setAnthropicModels(GENKIT_ANTHROPIC_MODELS);
          setModelFetchError(err.message || 'Failed to fetch models, using default models');
        })
        .finally(() => setLoadingModels(false));
    } else {
      setAnthropicModels([]);
      setModelFetchError(null);
      setLoadingModels(false);
    }
  }, [formData.provider, llmConfig.anthropic?.apiKey]);

  const resetForm = () => {
    setFormData({
      name: '',
      prompt: '',
      provider: '' as LLMProvider,
      model: '',
      hotkey: '',
    });
    setEditingProfile(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (profile: Profile) => {
    const existingHotkey = hotkeyConfig.find(h => h.profileId === profile.id);
    setFormData({
      name: profile.name,
      prompt: profile.prompt,
      provider: profile.provider,
      model: profile.model,
      hotkey: existingHotkey?.combination || '',
    });
    setEditingProfile(profile);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.prompt.trim() || !formData.provider || !formData.model) {
      toast("Missing Information", {
        description: "Please fill in all required fields.",
        type: "error"
      });
      return;
    }

    const profileId = editingProfile?.id || Date.now().toString();
    const newProfile: Profile = {
      id: profileId,
      name: formData.name.trim(),
      prompt: formData.prompt.trim(),
      provider: formData.provider,
      model: formData.model
    };

    if (editingProfile) {
      setProfiles(prev => prev.map(p => p.id === editingProfile.id ? newProfile : p));
    } else {
      setProfiles(prev => [...prev, newProfile]);
    }

    // Handle hotkey configuration
    if (formData.hotkey) {
      const newHotkeyConfig: HotkeyConfig = {
        id: `hotkey-${profileId}`,
        profileId: profileId,
        combination: formData.hotkey,
        keyLabel: formData.name,
      };

      setHotkeyConfig(prev => {
        const filtered = prev.filter(h => h.profileId !== profileId);
        return [...filtered, newHotkeyConfig];
      });
    } else {
      // Remove hotkey if cleared
      setHotkeyConfig(prev => prev.filter(h => h.profileId !== profileId));
    }

    toast(editingProfile ? "Profile Updated" : "Profile Created", {
      description: `Profile "${formData.name}" has been ${editingProfile ? 'updated' : 'created'} successfully.`,
      type: "success"
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (profileId: string) => {
    const profileToDelete = profiles.find(p => p.id === profileId);
    if (!profileToDelete) return;

    // Remove profile
    const updatedProfiles = profiles.filter(profile => profile.id !== profileId);
    setProfiles(updatedProfiles);

    // Remove associated hotkeys
    const updatedHotkeys = hotkeyConfig.filter(hotkey => hotkey.profileId !== profileId);
    setHotkeyConfig(updatedHotkeys);

    toast("Profile Deleted", {
      description: `Profile "${profileToDelete.name}" and its associated hotkeys have been removed.`,
      type: "success"
    });
  };

  const getProviderIcon = (provider: LLMProvider) => {
    switch (provider) {
      case 'google': return '🟢';
      case 'meta': return '🔵';
      case 'anthropic': return '🟣';
      default: return '⚡';
    }
  };

  const getHotkeyForProfile = (profileId: string) => {
    const hotkey = hotkeyConfig.find(h => h.profileId === profileId);
    return hotkey ? hotkey.combination : null;
  };

  const startRecording = () => {
    setRecordingHotkey(true);
    setFormData(prev => ({ ...prev, hotkey: '' }));
    
    let recordingTimeout: NodeJS.Timeout;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Build the combination string step by step
      let combination = '';
      
      // Add modifiers first
      if (e.ctrlKey || e.metaKey) {
        combination += (e.metaKey ? 'Cmd' : 'Ctrl') + '+';
      }
      if (e.altKey) {
        combination += 'Alt+';
      }
      if (e.shiftKey) {
        combination += 'Shift+';
      }
      
      // Only process non-modifier keys
      const isModifierKey = ['Control', 'Meta', 'Alt', 'Shift', 'ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight'].includes(e.code || e.key);
      
      if (!isModifierKey) {
        // Use e.key for the main key, but clean it up
        let mainKey = e.key;
        
        // Handle special cases
        if (mainKey.length === 1) {
          mainKey = mainKey.toUpperCase();
        } else {
          // Map special keys to readable names
          const keyMap: { [key: string]: string } = {
            ' ': 'Space',
            'Enter': 'Enter',
            'Escape': 'Esc',
            'Backspace': 'Backspace',
            'Tab': 'Tab',
            'Delete': 'Del',
            'ArrowUp': 'Up',
            'ArrowDown': 'Down',
            'ArrowLeft': 'Left',
            'ArrowRight': 'Right'
          };
          mainKey = keyMap[mainKey] || mainKey;
        }
        
        combination += mainKey;
        
        // Only accept combinations with at least one modifier
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
          console.log('Captured combination:', combination);
          setFormData(prev => ({ ...prev, hotkey: combination }));
          setRecordingHotkey(false);
          document.removeEventListener('keydown', handleKeyDown);
          if (recordingTimeout) clearTimeout(recordingTimeout);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Auto-stop recording after 10 seconds
    recordingTimeout = setTimeout(() => {
      setRecordingHotkey(false);
      document.removeEventListener('keydown', handleKeyDown);
    }, 10000);
  };

  const handleHotkeyChange = (newHotkey: string | null) => {
    setFormData({ ...formData, hotkey: newHotkey || '' });
  };

  const handleStartRecording = () => {
    startRecording();
  };

  const handleStopRecording = () => {
    setRecordingHotkey(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (recordingHotkey) {
      const hotkey = `${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.code}`;
      handleHotkeyChange(hotkey);
      handleStopRecording();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [recordingHotkey]);

  if (!isMounted) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="center" mb="md">
        <IconRobot size={32} className="text-primary" />
      </Group>
      
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Title order={1} fw={900} mb="sm">
          Rephrasing Profiles
        </Title>
        <Text size="lg" c="dimmed" style={{ maxWidth: 600, margin: '0 auto 1rem auto' }}>
          Create and manage custom rephrasing profiles with different prompts and AI models to transform your text in unique ways.
        </Text>
        <Button 
          onClick={() => {
            setFormData({
              name: '',
              prompt: '',
              provider: '' as LLMProvider,
              model: '',
              hotkey: '',
            });
            setEditingProfile(null);
            setIsDialogOpen(true);
          }}
          variant="gradient" 
          gradient={{ from: 'forest.6', to: 'teal.6', deg: 90 }} 
          leftSection={<IconPlus size={18} />}
          size="md"
        >
          Create Profile
        </Button>
      </div>

      <SimpleGrid 
        cols={{ base: 1, sm: 2, md: 3 }} 
        spacing="lg" 
        mb="xl"
        style={{ maxWidth: '100%' }}
      >
        <Paper shadow="md" radius="md" p="lg" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', border: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}>
              <IconSparkles className="h-5 w-5" color="#3b82f6" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#3b82f6' }}>Total Profiles</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }}>{profiles.length}</p>
            </div>
          </div>
        </Paper>
        <Paper shadow="md" radius="md" p="lg" style={{ background: 'linear-gradient(135deg, #c6f6d5 0%, #9bc2e6 100%)', border: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 }}>
              <IconBolt className="h-5 w-5" color="#10b981" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#10b981' }}>Hotkey Profiles</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#065f46' }}>{profiles.filter(p => getHotkeyForProfile(p.id)).length}</p>
            </div>
          </div>
        </Paper>
        <Paper shadow="md" radius="md" p="lg" style={{ background: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)', border: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: 'rgba(253, 224, 71, 0.1)', borderRadius: 8 }}>
              <IconSettings className="h-5 w-5" color="#eab308" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#eab308' }}>LLM Providers</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#713f12' }}>{Object.keys(llmConfig).length}</p>
            </div>
          </div>
        </Paper>
      </SimpleGrid>

      <Modal opened={isDialogOpen} onClose={() => setIsDialogOpen(false)} centered>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Title order={4}>{editingProfile ? 'Edit Profile' : 'Create New Profile'}</Title>
            <Text c="dimmed" size="sm">
              {editingProfile
                ? 'Update your rephrasing profile settings.'
                : 'Create a custom rephrasing profile with specific prompts and AI models to transform your text in unique ways.'}
            </Text>
            <TextInput
              label="Profile Name"
              placeholder="e.g., Formal Business, Casual Friendly"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <MantineTextarea
              label="Rephrasing Prompt"
              placeholder="e.g., Rephrase this text to be more formal and professional..."
              value={formData.prompt}
              onChange={e => setFormData({ ...formData, prompt: e.target.value })}
              minRows={4}
              required
            />
            <Group gap="md" grow>
              <MantineSelect
                label="Provider"
                placeholder="Select provider"
                data={LLM_PROVIDERS.map(provider => ({ value: provider.value, label: provider.label }))}
                value={formData.provider}
                onChange={(value: string | null) => setFormData({ ...formData, provider: value as LLMProvider || '', model: '' })}
                required
              />
              <MantineSelect
                label="Model"
                data={
                  formData.provider === 'anthropic'
                    ? anthropicModels.map(model => ({ value: model.id, label: model.label }))
                    : formData.provider === 'google'
                    ? GENKIT_GOOGLE_MODELS.map(model => ({ value: model.id, label: model.label }))
                    : (LLM_PROVIDERS.find(p => p.value === formData.provider)?.models.map(model => ({ value: model.id, label: model.label })) ?? [])
                }
                value={formData.model}
                onChange={(value: string | null) => setFormData({ ...formData, model: value || '' })}
                placeholder={loadingModels ? "Loading..." : "Select model"}
                disabled={!formData.provider || (formData.provider === 'anthropic' && loadingModels)}
                required
              />
              {modelFetchError && formData.provider === 'anthropic' && (
                <Text color="red" size="xs" mt={2}>{modelFetchError}</Text>
              )}
            </Group>

            {/* Hotkey Configuration Section */}
            <Stack gap="sm">
              <Group gap="sm">
                <ThemeIcon size="sm" variant="light" color="teal">
                  <IconKeyboard size={16} />
                </ThemeIcon>
                <Text size="sm" fw={500}>Hotkey Configuration (Optional)</Text>
              </Group>

              <div>
                <Text size="sm" fw={500} mb="xs">Key Combination</Text>
                <Group gap="sm">
                  <TextInput
                    placeholder="Press 'Record' and then your key combination"
                    value={formData.hotkey}
                    readOnly
                    style={{ flex: 1 }}
                    rightSection={formData.hotkey ? <Kbd size="xs">{formData.hotkey}</Kbd> : null}
                  />
                  <Button
                    variant={recordingHotkey ? 'filled' : 'light'}
                    color={recordingHotkey ? 'red' : 'forest'}
                    onClick={handleStartRecording}
                    disabled={recordingHotkey}
                    leftSection={<IconMicrophone size={16} />}
                    size="sm"
                  >
                    {recordingHotkey ? 'Recording...' : 'Record'}
                  </Button>
                  {formData.hotkey && (
                    <Button
                      variant="subtle"
                      color="gray"
                      onClick={() => setFormData({ ...formData, hotkey: '' })}
                      size="sm"
                    >
                      Clear
                    </Button>
                  )}
                </Group>
                {recordingHotkey && (
                  <Alert 
                    icon={<IconInfoCircle size={16} />}
                    title="Recording Keys"
                    color="blue"
                    variant="light"
                    mt="xs"
                  >
                    Press your key combination now (e.g., Ctrl+R or Ctrl+Shift+R). It will be captured immediately.
                  </Alert>
                )}
              </div>
            </Stack>

            <Group justify="right" mt="md">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" gradient={{ from: 'forest.6', to: 'teal.6', deg: 90 }}>
                {editingProfile ? 'Update Profile' : 'Create Profile'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {profiles.length === 0 ? (
        <Paper shadow="md" radius="md" p="lg" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e6f4ea 100%)', border: 0 }}>
          <Group justify="center">
            <Badge color="gray" size="xl" radius="xl" variant="light">
              <IconRobot size={32} />
            </Badge>
          </Group>
          <Title order={3}>No profiles yet</Title>
          <Text c="dimmed" maw={320} mx="auto">
            Create your first rephrasing profile to get started with AI-powered text transformation.
          </Text>
          <Button onClick={openCreateDialog} variant="gradient" gradient={{ from: 'forest.6', to: 'pastel.6', deg: 90 }} leftSection={<IconPlus size={18} />}>
            Create Your First Profile
          </Button>
        </Paper>
      ) : (
        <Group align="stretch" gap="lg" wrap="wrap">
          {profiles.map((profile) => {
            const hotkey = getHotkeyForProfile(profile.id);
            const providerInfo = LLM_PROVIDERS.find(p => p.value === profile.provider);
            return (
              <Paper key={profile.id} withBorder p="md" radius="md" shadow="xs" style={{ minWidth: 320, maxWidth: 400, flex: '1 1 320px', background: 'linear-gradient(135deg, #f8fafc 0%, #e6f4ea 100%)' }}>
                <Group>
                  <Group>
                    <Badge color="green" size="lg" radius="md" variant="light">
                      {getProviderIcon(profile.provider)}
                    </Badge>
                    <Stack gap={0}>
                      <Title order={4} size="h6">{profile.name}</Title>
                      <Text size="xs" c="dimmed">{providerInfo?.label} • {profile.model}</Text>
                    </Stack>
                  </Group>
                  {hotkey && (
                    <Badge color="teal" size="xs" variant="outline" radius="sm" style={{ fontFamily: 'Source Code Pro, monospace' }}>
                      {hotkey}
                    </Badge>
                  )}
                </Group>
                <Text size="sm" c="dimmed" mb="md" lineClamp={3}>{profile.prompt}</Text>
                <Group gap="sm">
                  <Button variant="outline" size="xs" onClick={() => openEditDialog(profile)} leftSection={<IconEdit size={14} />}>
                    Edit
                  </Button>
                  <Button variant="outline" color="red" size="xs" onClick={() => handleDelete(profile.id)} leftSection={<IconTrash size={14} />}>
                    Delete
                  </Button>
                </Group>
              </Paper>
            );
          })}
        </Group>
      )}
    </Container>
  );
}
