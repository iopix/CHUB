'use client';

import { useState, ChangeEvent, FormEvent, TouchEvent, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from './header';
import styles from './page.module.css';

interface InputProps {
  input: string;
  setInput: (value: string) => void;
  userProfile: UserProfile | null;
  textTrialCount: number;
  voiceTrialCount: number;
  loading: boolean;
  isTyping: boolean;
  isRecording: boolean;
  isInitialized?: boolean;
  trialPresets: Record<string, unknown>;
  handleSend: (textToSend?: string) => void;
  handleClearChat: () => void;
  handlePillClick: (presetKey: string) => void;
  startRecording?: () => void;
  stopRecording?: () => void;
}

// --- SVG ICONS ---
const IconKeyboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M18 12h.01M8 16h8" />
  </svg>
);

const IconMic = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function InputSection({
  input,
  setInput,
  userProfile,
  textTrialCount,
  voiceTrialCount,
  loading,
  isTyping,
  isRecording,
  isInitialized = true,
  trialPresets,
  handleSend,
  handleClearChat,
  handlePillClick,
  startRecording,
  stopRecording,
}: InputProps) {
  const router = useRouter();
  const [isKeyboardMode, setIsKeyboardMode] = useState<boolean>(false);

  const handleStartInteraction = () => {
    if (!userProfile && voiceTrialCount >= 2) {
      router.push('/login');
      return;
    }
    if (loading || isTyping || !startRecording) return;
    startRecording();
  };

  const handleEndInteraction = () => {
    if (!stopRecording || !isRecording) return;
    stopRecording();
    setIsKeyboardMode(true); 
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => handleStartInteraction();
  
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    handleStartInteraction();
  };

  const presetKeys = Object.keys(trialPresets).slice(0, 3);
  const isTextTrialEnded = !userProfile && textTrialCount >= 2;
  const isVoiceTrialEnded = !userProfile && voiceTrialCount >= 2;

  return (
    <div className={styles.footerWrapper}>
      {/* KONTROL PILL & HAPUS CHAT */}
      <div 
        className={styles.capsuleRow} 
        style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}
      >
        {/* Hapus Chat di kiri & permanen dengan warna orange */}
        <button
          type="button"
          onClick={handleClearChat}
          className={`${styles.dynamicChipButton} ${styles.clearChipButton}`}
          style={{ 
            flexShrink: 0, 
            backgroundColor: '#f97316', // Warna orange
            color: '#ffffff',           // Teks putih agar kontras
            borderColor: '#f97316'      // Border menyesuaikan warna background
          }}
        >
          <IconTrash />
          <span>Hapus Chat</span>
        </button>

        {/* Kontainer Pill Scrollable */}
        <div 
          style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            gap: '8px', 
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none' /* IE/Edge */ 
          }}
        >
          {presetKeys.map((presetKey, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePillClick(presetKey)}
              className={styles.dynamicChipButton}
              style={{ whiteSpace: 'nowrap' }}
            >
              {presetKey}
            </button>
          ))}
          
          {/* Tambahan Pill Teks Full */}
          <button
            type="button"
            onClick={() => handlePillClick("Sekarang hari jam berapa ?")}
            className={styles.dynamicChipButton}
            style={{ whiteSpace: 'nowrap' }}
          >
            Sekarang hari jam berapa ?
          </button>
        </div>
      </div>

      {isRecording && (
        <div className={styles.recordingOverlay}>
          <div className={styles.recordingText}>
            Lepaskan untuk selesai merekam
          </div>
          <div className={styles.waveformContainer}>
            <span className={styles.waveBar} />
            <span className={styles.waveBar} />
            <span className={styles.waveBar} />
            <span className={styles.waveBar} />
            <span className={styles.waveBar} />
            <span className={styles.waveBar} />
            <span className={styles.waveBar} />
            <span className={styles.waveBar} />
            <span className={styles.waveBar} />
            <span className={styles.waveBar} />
          </div>
        </div>
      )}

      <div className={styles.mainInputBox}>
        <div className={styles.inputBodyContainer}>
          {!isKeyboardMode ? (
            <div
              className={`${styles.holdToTalkButton} ${isVoiceTrialEnded ? styles.disabledHold : ''}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleEndInteraction}
              onTouchCancel={handleEndInteraction}
              onMouseDown={handleMouseDown}
              onMouseUp={handleEndInteraction}
              onMouseLeave={handleEndInteraction}
            >
              <span>
                {!isInitialized
                  ? 'Memuat...'
                  : !userProfile
                    ? voiceTrialCount < 2
                      ? `Trial Voice ${2 - voiceTrialCount}/2...`
                      : 'Login untuk kirim voice'
                    : loading
                      ? 'Memproses...'
                      : 'Tahan untuk berbicara'}
              </span>
            </div>
          ) : (
            <form
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                handleSend();
              }}
              className={styles.textForm}
            >
              <input
                type="text"
                value={input}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                placeholder={
                  !userProfile
                    ? textTrialCount < 2
                      ? `Trial Teks ${2 - textTrialCount}/2...`
                      : 'Silakan login...'
                    : 'Ketik pesan...'
                }
                className={styles.inputField}
                disabled={!isInitialized || isTextTrialEnded || isTyping || isRecording}
                maxLength={200}
                autoFocus
              />
              <span className={styles.charCounter}>
                {input.length}/200
              </span>
            </form>
          )}
        </div>

        <div className={styles.rightActionGroup}>
          {!userProfile && isInitialized && ((isKeyboardMode && isTextTrialEnded) || (!isKeyboardMode && isVoiceTrialEnded)) ? (
            <button
              type="button"
              onClick={() => router.push('/login')}
              className={styles.loginSubmitButton}
            >
              Login
            </button>
          ) : isKeyboardMode && input.trim().length > 0 ? (
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || isTyping}
              className={styles.sendIconButton}
            >
              <IconSend />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsKeyboardMode(!isKeyboardMode)}
              className={styles.modeToggleButton}
              title={isKeyboardMode ? 'Mode Suara' : 'Mode Teks'}
            >
              {isKeyboardMode ? <IconMic /> : <IconKeyboard />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}