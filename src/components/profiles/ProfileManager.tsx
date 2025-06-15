'use client';

import { useState, useEffect } from 'react';
import { Paper, Button, Group, Text, Modal, TextInput, Textarea as MantineTextarea, Select as MantineSelect, Badge, Title, Stack, SimpleGrid } from '@mantine/core';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { useToast } from '@/hooks/use-toast';
import { Profile, LLMProvider, LLMConfig, HotkeyConfig } from '@/lib/types';
import { Plus, Edit3, Trash2, Sparkles, Bot, Zap, Settings } from 'lucide-react';

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
    model: ''
  });
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      model: ''
    });
    setEditingProfile(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (profile: Profile) => {
    setFormData({
      name: profile.name,
      prompt: profile.prompt,
      provider: profile.provider,
      model: profile.model
    });
    setEditingProfile(profile);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.prompt.trim() || !formData.provider || !formData.model) {
      toast("Please fill in all fields.", {
        type: "error"
      });
      return;
    }

    // Check if API key exists for the selected provider
    const providerConfig = llmConfig[formData.provider];
    if (!providerConfig?.apiKey) {
      toast(`Please configure your ${LLM_PROVIDERS.find(p => p.value === formData.provider)?.label} API key in Settings first.`, {
        type: "error"
      });
      return;
    }

    if (editingProfile) {
      // Update existing profile
      const updatedProfiles = profiles.map(profile =>
        profile.id === editingProfile.id
          ? { ...profile, ...formData }
          : profile
      );
      setProfiles(updatedProfiles);
      toast(`"${formData.name}" has been updated successfully.`, {
        type: "success"
      });
    } else {
      // Create new profile
      const newProfile: Profile = {
        id: Date.now().toString(),
        ...formData
      };
      setProfiles([...profiles, newProfile]);
      toast(`"${formData.name}" has been created successfully.`, {
        type: "success"
      });
    }

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

    toast(`"${profileToDelete.name}" and its associated hotkeys have been removed.`, {
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
    <div>
      <Group justify="center" mb="md">
        <Bot size={32} className="text-primary" />
      </Group>
      <Title order={1} ta="center" fw={900}>
        Rephrasing Profiles
      </Title>
      <Text size="lg" c="dimmed" ta="center" style={{ maxWidth: 600, margin: '0 auto' }}>
        Create and manage custom rephrasing profiles with different prompts and AI models to transform your text in unique ways.
      </Text>
      <SimpleGrid cols={3} spacing="lg" mb="xl">
        <Paper shadow="md" radius="md" p="lg" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', border: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}>
              <Sparkles className="h-5 w-5" color="#3b82f6" />
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
              <Zap className="h-5 w-5" color="#10b981" />
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
              <Settings className="h-5 w-5" color="#eab308" />
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
                : 'Create a custom rephrasing profile with specific prompts and AI models.'}
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
            <Group grow>
              <MantineSelect
                label="AI Provider"
                data={LLM_PROVIDERS.map(provider => ({ value: provider.value, label: provider.label }))}
                value={formData.provider}
                onChange={(value: string | null) => setFormData({ ...formData, provider: value as LLMProvider, model: '' })}
                placeholder="Select provider"
                required
              />
              <MantineSelect
                label="Model"
                data={
                  formData.provider === 'anthropic'
                    // Show fetched Anthropic models (or fallback hardcoded ones)
                    ? anthropicModels.map(model => ({ value: model.id, label: model.label }))
                    : formData.provider === 'google'
                    // Only show Genkit-supported Google models
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
            <Group justify="right" mt="md">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" gradient={{ from: 'green', to: 'teal', deg: 90 }}>
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
              <Bot size={32} />
            </Badge>
          </Group>
          <Title order={3}>No profiles yet</Title>
          <Text c="dimmed" maw={320} mx="auto">
            Create your first rephrasing profile to get started with AI-powered text transformation.
          </Text>
          <Button onClick={openCreateDialog} variant="gradient" gradient={{ from: 'green', to: 'teal', deg: 90 }} leftSection={<Plus size={18} />}>
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
                  <Button variant="outline" size="xs" onClick={() => openEditDialog(profile)} leftSection={<Edit3 size={14} />}>
                    Edit
                  </Button>
                  <Button variant="outline" color="red" size="xs" onClick={() => handleDelete(profile.id)} leftSection={<Trash2 size={14} />}>
                    Delete
                  </Button>
                </Group>
              </Paper>
            );
          })}
        </Group>
      )}
    </div>
  );
}
