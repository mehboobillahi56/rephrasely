"use client";
import { useEffect } from "react";
import { MantineProvider, createTheme } from '@mantine/core';

const theme = createTheme({
  colors: {
    forest: [
      '#f0f9f0',
      '#e1f5e1',
      '#c2ebc2',
      '#a3e0a3',
      '#84d684',
      '#65cc65',
      '#46c246',
      '#27b827',
      '#1e8f1e',
      '#156615'
    ],
    pastel: [
      '#f8fdf8',
      '#f1fbf1',
      '#e4f7e4',
      '#d7f3d7',
      '#caefca',
      '#bdebbd',
      '#b0e7b0',
      '#a3e3a3',
      '#96df96',
      '#89db89'
    ],
    teal: [
      '#e6fffa',
      '#b3f5ec',
      '#80ebde',
      '#4de1d0',
      '#1ad7c2',
      '#00cdb4',
      '#00b8a0',
      '#00a38c',
      '#008e78',
      '#007964'
    ]
  },
  primaryColor: 'forest',
  defaultRadius: 'md',
  fontFamily: 'PT Sans, sans-serif',
  headings: {
    fontFamily: 'PT Sans, sans-serif',
  },
});

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load rephrase function for Electron hotkey support
    if (typeof window !== 'undefined') {
      console.log('[ClientLayout] Setting up rephraseFromMain function...');
      
      // Define the global rephrase function for Electron hotkey
      (window as any).rephraseFromMain = async function(selectedText: string) {
        console.log('===== HOTKEY REPHRASE TRIGGERED =====');
        console.log('ORIGINAL TEXT:', selectedText);
        console.log('Original text length:', selectedText?.length);
        
        // Immediate localStorage check
        console.log('CHECKING LOCALSTORAGE:');
        console.log('- rephrasely-profiles:', localStorage.getItem('rephrasely-profiles'));
        console.log('- rephrasely-selected-profile:', localStorage.getItem('rephrasely-selected-profile'));
        console.log('- rephrasely-llm-config:', localStorage.getItem('rephrasely-llm-config'));
        
        try {
          console.log('[Renderer] rephraseFromMain called with:', selectedText);
          
          // Get data from localStorage
          const profilesData = localStorage.getItem('rephrasely-profiles');
          const selectedProfileId = localStorage.getItem('rephrasely-selected-profile') || '';
          const llmConfigData = localStorage.getItem('rephrasely-llm-config');
          
          if (!profilesData || !llmConfigData) {
            console.log('❌ MISSING CONFIGURATION - returning original text');
            console.log('- Has profiles:', !!profilesData);
            console.log('- Has LLM config:', !!llmConfigData);
            return selectedText;
          }
          
          const profiles = JSON.parse(profilesData);
          const llmConfig = JSON.parse(llmConfigData);
          
          console.log('✅ CONFIGURATION LOADED:');
          console.log('- Number of profiles:', profiles.length);
          console.log('- Selected profile ID:', selectedProfileId);
          console.log('- Available providers:', Object.keys(llmConfig));
          
          // Find selected profile or use first one
          let selectedProfile = profiles.find((p: any) => p.id === selectedProfileId);
          if (!selectedProfile && profiles.length > 0) {
            selectedProfile = profiles[0];
            console.log('⚠️ No selected profile found, using first profile:', selectedProfile.name);
          }
          
          if (!selectedProfile) {
            console.log('❌ NO PROFILES AVAILABLE - returning original text');
            return selectedText;
          }
          
          console.log('🎯 USING PROFILE:', selectedProfile.name);
          console.log('🤖 Provider:', selectedProfile.provider);
          console.log('💬 Prompt:', selectedProfile.prompt);
          
          // Get API key for the profile's provider
          const apiKey = llmConfig[selectedProfile.provider]?.apiKey;
          
          if (!apiKey) {
            console.log('❌ NO API KEY FOUND for provider:', selectedProfile.provider);
            return selectedText;
          }
          
          console.log('🔑 API key found for provider:', selectedProfile.provider);
          console.log('');
          console.log('🚀 CALLING REPHRASE API...');
          
          // Call the Next.js API route instead of direct API call
          const response = await fetch('http://localhost:3000/api/rephraseText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: selectedText,
              prompt: selectedProfile.prompt,
              provider: selectedProfile.provider,
              model: selectedProfile.model,
              apiKey: apiKey
            })
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API call failed: ${response.status} - ${errorData}`);
          }

          const result = await response.json();
          const rephrasedText = result.rephrasedText;

          if (!rephrasedText) {
            throw new Error('No rephrased text returned from API');
          }

          console.log('');
          console.log('===== REPHRASE COMPLETE =====');
          console.log('ORIGINAL TEXT:');
          console.log(selectedText);
          console.log('REPHRASED TEXT:');
          console.log(rephrasedText);
          console.log('Original length:', selectedText.length);
          console.log('Rephrased length:', rephrasedText.length);
          console.log('Change ratio:', ((rephrasedText.length - selectedText.length) / selectedText.length * 100).toFixed(1) + '%');
          console.log('================================');
          console.log('');
          
          return rephrasedText;
          
        } catch (error) {
          console.error('[Renderer] Error in rephraseFromMain:', error);
          console.log('');
          console.error('ERROR IN REPHRASE FUNCTION:', error);
          console.log('Returning ERROR MESSAGE instead of original text for debugging');
          console.log('');
          return `ERROR: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
        }
      };

      console.log('[ClientLayout] rephraseFromMain function loaded and accessible:', typeof (window as any).rephraseFromMain);

      // Test function for manual debugging
      (window as any).testRephraseFunction = async function() {
        const testText = "This is a test sentence for rephrasing.";
        console.log('[Renderer] Testing rephrase function with:', testText);
        const result = await (window as any).rephraseFromMain(testText);
        console.log('[Renderer] Test result:', result);
        return result;
      };

      // Simple debug function to test hotkey flow
      (window as any).debugHotkey = function() {
        console.log('=== HOTKEY DEBUG ===');
        console.log('rephraseFromMain exists:', typeof (window as any).rephraseFromMain);
        console.log('Profiles:', localStorage.getItem('rephrasely-profiles'));
        console.log('Selected profile:', localStorage.getItem('rephrasely-selected-profile'));
        console.log('LLM config:', localStorage.getItem('rephrasely-llm-config'));
        console.log('Hotkey config:', localStorage.getItem('rephrasely-hotkey-config'));
        return 'Debug info logged to console';
      };

      // Diagnostic function to check configuration
      (window as any).checkConfig = function() {
        console.log('=== CONFIGURATION DIAGNOSTIC ===');
        const profilesData = localStorage.getItem('rephrasely-profiles');
        const selectedProfileId = localStorage.getItem('rephrasely-selected-profile');
        const llmConfigData = localStorage.getItem('rephrasely-llm-config');
        
        console.log('Profiles data:', profilesData);
        console.log('Selected profile ID:', selectedProfileId);
        console.log('LLM config data:', llmConfigData);
        
        if (profilesData) {
          const profiles = JSON.parse(profilesData);
          console.log('Parsed profiles:', profiles);
          console.log('Number of profiles:', profiles.length);
        }
        
        if (llmConfigData) {
          const llmConfig = JSON.parse(llmConfigData);
          console.log('Parsed LLM config:', llmConfig);
          console.log('Available providers:', Object.keys(llmConfig));
        }
        
        return {
          hasProfiles: !!profilesData,
          hasSelectedProfile: !!selectedProfileId,
          hasLLMConfig: !!llmConfigData
        };
      };
    }
    
    console.log('[ClientLayout] All functions loaded successfully!');
    console.log('[ClientLayout] rephraseFromMain type:', typeof (window as any).rephraseFromMain);
    console.log('[ClientLayout] checkConfig type:', typeof (window as any).checkConfig);
    console.log('[ClientLayout] testRephraseFunction type:', typeof (window as any).testRephraseFunction);
    console.log('[ClientLayout] debugHotkey type:', typeof (window as any).debugHotkey);
  }, []); // Empty dependency array - only run once on mount

  return (
    <MantineProvider theme={theme}>
      {children}
    </MantineProvider>
  );
}
