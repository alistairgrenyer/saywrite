import React, { useState, useEffect } from 'react';
import Overlay from './components/Overlay';
import SettingsModal from './components/SettingsModal';
import './styles/App.css';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'idle' | 'recording' | 'transcript' | 'profile' | 'preview'>('idle');
  const [transcript, setTranscript] = useState('');
  const [draft, setDraft] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Register hotkeys on component mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const registerHotkeys = async () => {
      try {
        // Register hotkey for recording (Alt+Shift+S)
        await window.electronAPI.registerHotkey({
          key: 'S',
          modifiers: ['Alt', 'Shift'],
          action: 'startRecording'
        });

        // Register hotkey for toggling overlay visibility (Alt+Shift+X)
        await window.electronAPI.registerHotkey({
          key: 'X',
          modifiers: ['Alt', 'Shift'],
          action: 'toggleOverlay'
        });

        // Listen for hotkey events
        const unsubscribe = window.electronAPI.onHotkeyTriggered((data: { action: string }) => {
          const action = data.action;
          if (action === 'startRecording') {
            setCurrentStep('recording');
          } else if (action === 'toggleOverlay') {
            setCurrentStep(prev => prev === 'idle' ? 'idle' : 'idle');
          }
        });
      } catch (error) {
        console.error('Failed to register hotkeys:', error);
      }
    };

    registerHotkeys();

    // Cleanup on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Handle insertion of text
  const handleInsert = async () => {
    if (!draft) return;

    try {
      // Save current clipboard content
      const originalClipboard = await window.electronAPI.getClipboardText();
      
      // Set draft text to clipboard
      await window.electronAPI.setClipboardText(draft);
      
      // Simulate Ctrl+V to paste
      const success = await window.electronAPI.insertText();
      
      if (success) {
        // Reset state after successful insertion
        setCurrentStep('idle');
        setTranscript('');
        setDraft('');
        
        // Restore original clipboard content
        await window.electronAPI.setClipboardText(originalClipboard);
      } else {
        // Handle insertion failure
        console.error('Insertion failed');
        // Show error message or retry UI
      }
    } catch (error) {
      console.error('Error during insertion:', error);
    }
  };

  return (
    <div className="app">
      <Overlay
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        transcript={transcript}
        setTranscript={setTranscript}
        draft={draft}
        setDraft={setDraft}
        onSettingsClick={() => setShowSettings(true)}
        onInsert={handleInsert}
      />
      
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default App;
