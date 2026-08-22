'use client';

import React, { useRef } from 'react';
import styles from './page.module.css';

interface TrialPreset {
  reply: (name: string) => string;
  emotion: string;
}

interface InputSectionProps {
  input: string;
  setInput: (value: string) => void;
  userProfile: any;
  textTrialCount: number;
  voiceTrialCount: number;
  loading: boolean;
  isTyping: boolean;
  isRecording: boolean;
  isInitialized: boolean;
  trialPresets: Record<string, TrialPreset>;
  isSingleChat: boolean;
  setIsSingleChat: (val: boolean) => void;
  handleSend: (text?: string) => void;
  handleClearChat: () => void;
  handlePillClick: (key: string) => void;
  startRecording: () => void;
  stopRecording: (cancel?: boolean) => void;
}

const IconSingleChat = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <polygon points="13 8 10 12 12 12 11 16 14 12 12 12 13 8" fill="currentColor" />
  </svg>
);

const IconMultiChat = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 v.5z" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function InputSection({
  input,
  setInput,
  loading,
  isRecording,
  trialPresets,
  isSingleChat,
  setIsSingleChat,
  handleSend,
  handleClearChat,
  handlePillClick,
  startRecording,
  stopRecording,
}: InputSectionProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && input.trim()) {
      handleSend();
    }
  };

  return (
    <div className={styles.footerWrapper}>
      <div className={styles.capsuleRowWrapper}>
        <div className={styles.capsuleRowScroll} ref={scrollRef}>
          <button
            type="button"
            onClick={handleClearChat}
            className={`${styles.dynamicChipButton} ${styles.clearChipButton}`}
            title="Hapus Percakapan"
          >
            <IconTrash />
            <span>Hapus Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSingleChat(!isSingleChat)}
            className={`${styles.dynamicChipButton} ${isSingleChat ? styles.singleModeActive : ''}`}
            title="Klik untuk switch mode chat"
          >
            {isSingleChat ? <IconSingleChat /> : <IconMultiChat />}
            <span>{isSingleChat ? 'Single Chat' : 'Multi Chat'}</span>
          </button>

          {Object.keys(trialPresets).map((presetKey) => (
            <button
              key={presetKey}
              type="button"
              onClick={() => handlePillClick(presetKey)}
              className={styles.dynamicChipButton}
              disabled={loading}
            >
              {presetKey}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.mainInputBox}>
        <div className={styles.inputBodyContainer}>
          {isRecording ? (
            <div className={styles.recordingOverlay}>
              <div className={styles.waveformContainer}>
                <span className={styles.waveBarRealtime} style={{ height: '16px' }} />
                <span className={styles.waveBarRealtime} style={{ height: '22px' }} />
                <span className={styles.waveBarRealtime} style={{ height: '12px' }} />
              </div>
              <span className={styles.recordingText}>Merekam suara... Sampaikan pesanmu</span>
              <button
                type="button"
                className={styles.cancelRecordBtn}
                onClick={() => stopRecording(true)}
              >
                Batal
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.textForm}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pesan untuk Ava..."
                className={styles.inputField}
                disabled={loading}
              />
            </form>
          )}
        </div>

        <div className={styles.rightActionGroup}>
          {isRecording ? (
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className={styles.sendIconButton}
              title="Selesai & Kirim Suara"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          ) : input.trim() ? (
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading}
              className={styles.sendIconButton}
              title="Kirim Pesan"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={loading}
              className={styles.modeToggleButton}
              title="Tahan/Klik untuk Rekam Suara"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}