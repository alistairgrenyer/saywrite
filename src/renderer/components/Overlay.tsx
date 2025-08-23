import React, { useState, useEffect } from 'react';
import { Profile } from '../../core/types/Profile';
import '../styles/Overlay.css';

// Mock profiles for now - will be replaced with actual profiles from store
const mockProfiles: Profile[] = [
  {
    id: 'formal',
    name: 'Formal',
    tone: 'Professional',
    constraints: ['Use formal language', 'Avoid contractions'],
  },
  {
    id: 'casual',
    name: 'Casual',
    tone: 'Friendly',
    constraints: ['Use conversational language'],
  },
];

interface OverlayProps {
  currentStep: 'idle' | 'recording' | 'transcript' | 'profile' | 'preview';
  setCurrentStep: React.Dispatch<React.SetStateAction<'idle' | 'recording' | 'transcript' | 'profile' | 'preview'>>;
  transcript: string;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  onSettingsClick: () => void;
  onInsert: () => Promise<void>;
}

const Overlay: React.FC<OverlayProps> = ({
  currentStep,
  setCurrentStep,
  transcript,
  setTranscript,
  draft,
  setDraft,
  onSettingsClick,
  onInsert,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [insertFailed, setInsertFailed] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles);

  // Simulate recording and transcription
  useEffect(() => {
    if (currentStep === 'recording' && !isRecording) {
      setIsRecording(true);
      
      // Simulate recording completion after 3 seconds
      const timer = setTimeout(() => {
        setIsRecording(false);
        // Mock transcription result
        setTranscript('This is a sample transcription of what the user said.');
        setCurrentStep('transcript');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, isRecording, setTranscript, setCurrentStep]);

  // Handle profile selection
  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile);
    setCurrentStep('preview');
    
    // Simulate rewrite API call
    setTimeout(() => {
      setDraft(`This is a rewritten version of the transcript using the ${profile.name} profile. It follows these constraints: ${profile.constraints.join(', ')}.`);
    }, 1000);
  };

  // Retry insertion
  const handleRetryInsertion = async () => {
    const success = await window.electronAPI.retryInsertion();
    if (success) {
      setInsertFailed(false);
      setCurrentStep('idle');
      setTranscript('');
      setDraft('');
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    await window.electronAPI.setClipboardText(draft);
    // Show temporary success message
    // This would be implemented with a toast notification
  };

  // Regenerate draft
  const handleRegenerate = () => {
    if (selectedProfile) {
      // Simulate rewrite API call with different result
      setTimeout(() => {
        setDraft(`This is a regenerated version of the text using the ${selectedProfile.name} profile. The constraints are: ${selectedProfile.constraints.join(', ')}.`);
      }, 1000);
    }
  };

  return (
    <div className={`overlay ${currentStep !== 'idle' ? 'active' : ''}`}>
      <div className="overlay-header">
        <h1>SayWrite</h1>
        <button onClick={onSettingsClick} className="settings-button">⚙️</button>
      </div>

      <div className="overlay-content">
        {currentStep === 'idle' && (
          <div className="idle-state">
            <p>Press hotkey to start recording</p>
          </div>
        )}

        {currentStep === 'recording' && (
          <div className="recording-state">
            <div className="recording-indicator"></div>
            <p>Recording... (Release key to stop)</p>
          </div>
        )}

        {currentStep === 'transcript' && (
          <div className="transcript-state">
            <h2>Transcript</h2>
            <div className="transcript-box">
              <p>{transcript}</p>
            </div>
            <div className="action-buttons">
              <button onClick={() => setCurrentStep('profile')}>Continue</button>
              <button onClick={() => {
                setCurrentStep('idle');
                setTranscript('');
              }}>Cancel</button>
            </div>
          </div>
        )}

        {currentStep === 'profile' && (
          <div className="profile-state">
            <h2>Select Profile</h2>
            <div className="profiles-list">
              {profiles.map((profile) => (
                <div 
                  key={profile.id} 
                  className="profile-item"
                  onClick={() => handleProfileSelect(profile)}
                >
                  <h3>{profile.name}</h3>
                  <p>{profile.tone}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setCurrentStep('transcript')}>Back</button>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="preview-state">
            <h2>Preview</h2>
            <div className="preview-box">
              <p>{draft}</p>
            </div>
            <div className="action-buttons">
              <button onClick={onInsert}>Insert</button>
              <button onClick={handleCopy}>Copy</button>
              <button onClick={handleRegenerate}>Regenerate</button>
              <button onClick={() => setCurrentStep('profile')}>Back</button>
            </div>
          </div>
        )}

        {insertFailed && (
          <div className="insert-failed-overlay">
            <div className="insert-failed-modal">
              <h2>Insertion Failed</h2>
              <p>Please click where you want to insert the text and try again.</p>
              <div className="action-buttons">
                <button onClick={handleRetryInsertion}>Retry</button>
                <button onClick={() => setInsertFailed(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overlay;
