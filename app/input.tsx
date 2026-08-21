'use client';

import { useState, useRef, ChangeEvent, FormEvent, TouchEvent, MouseEvent as ReactMouseEvent } from 'react';
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
  stopRecording?: (cancel?: boolean) => void; 
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

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
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
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memicu ketika ditekan (jari mobile atau klik kiri mouse)
  const handlePressStart = (e: TouchEvent<HTMLDivElement> | ReactMouseEvent<HTMLDivElement>) => {
    if ('button' in e && e.button !== 0) return; // Abaikan jika bukan klik kiri pada mouse

    if (!userProfile && voiceTrialCount >= 2) {
      router.push('/login');
      return;
    }
    if (loading || isTyping || !startRecording) return;

    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

    // Memicu rekaman HANYA jika ditahan lebih dari 300ms
    holdTimeoutRef.current = setTimeout(() => {
      startRecording();
    }, 300);
  };

  // Memicu saat tekanan dilepas
  const handlePressEnd = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (isRecording && stopRecording) {
      stopRecording(false);
      setIsKeyboardMode(true); 
    }
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
        <button
          type="button"
          onClick={handleClearChat}
          className={`${styles.dynamicChipButton} ${styles.clearChipButton}`}
          style={{ 
            flexShrink: 0, 
            backgroundColor: '#f97316',
            color: '#ffffff',
            borderColor: '#f97316'
          }}
        >
          <IconTrash />
          <span>Hapus Chat</span>
        </button>

        <div 
          style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            gap: '8px', 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
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
        <div className={styles.recordingOverlay} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
          
          {/* Sisi Kiri: Teks & Visualisasi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className={styles.recordingText}>
              Merekam...
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

          {/* Sisi Kanan: Hanya Tombol X Merah */}
          <div style={{ display: 'flex', alignItems: 'center', zIndex: 10 }}>
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                if (stopRecording) stopRecording(true);
                setIsKeyboardMode(true);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (stopRecording) stopRecording(true);
                setIsKeyboardMode(true);
              }}
              style={{
                width: '34px', height: '34px',
                borderRadius: '50%', backgroundColor: '#ef4444', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                cursor: 'pointer'
              }}
              title="Batalkan"
            >
              <IconX />
            </button>
          </div>
        </div>
      )}

      <div className={styles.mainInputBox}>
        <div className={styles.inputBodyContainer}>
          {!isKeyboardMode ? (
            <div
              className={`${styles.holdToTalkButton} ${isVoiceTrialEnded ? styles.disabledHold : ''}`}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              onTouchCancel={handlePressEnd}
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onContextMenu={(e) => e.preventDefault()} 
              style={{ 
                touchAction: 'none', 
                userSelect: 'none', 
                WebkitUserSelect: 'none' // Mencegah sorot biru di mobile saat ditahan
              }}
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
                  loading
                    ? 'Memproses suara...' // Placeholder berubah jika sedang transkrip
                    : !userProfile
                      ? textTrialCount < 2
                        ? `Trial Teks ${2 - textTrialCount}/2...`
                        : 'Silakan login...'
                      : 'Ketik pesan...'
                }
                className={styles.inputField}
                // Jika masih loading (suara belum selesai dibaca/diproses), input dimatikan
                disabled={!isInitialized || isTextTrialEnded || isTyping || isRecording || loading}
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
              disabled={loading || isTyping} // Send dimatikan jika loading
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
              disabled={loading} // Cegah toggle mode jika suara masih diproses
            >
              {isKeyboardMode ? <IconMic /> : <IconKeyboard />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}