'use client';

import { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from './header';

interface InputProps {
  input: string;
  setInput: (value: string) => void;
  userProfile: UserProfile | null;
  trialCount: number;
  loading: boolean;
  isTyping: boolean;
  isRecording: boolean;
  trialPresets: Record<string, unknown>;
  handleSend: (textToSend?: string) => void;
  handleClearChat: () => void;
  handlePillClick: (presetKey: string) => void;
}

export default function InputSection({
  input,
  setInput,
  userProfile,
  trialCount,
  loading,
  isTyping,
  isRecording,
  trialPresets,
  handleSend,
  handleClearChat,
  handlePillClick,
}: InputProps) {
  const router = useRouter();

  return (
    <>
      {/* 3 SAMPLE CAPSULE BUTTONS */}
      <div className="suggestions">
        {Object.keys(trialPresets).map((presetKey, i) => (
          <button
            key={i}
            onClick={() => handlePillClick(presetKey)}
            className="chip-button"
          >
            {presetKey}
          </button>
        ))}
      </div>

      {/* FOOTER INPUT TEXT FORM */}
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          handleSend();
        }}
        className="input-container"
      >
        {userProfile && (
          <button
            type="button"
            onClick={handleClearChat}
            className="clear-button"
          >
            Hapus
          </button>
        )}

        <div
          style={{
            position: 'relative',
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: '0%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder={
              !userProfile
                ? trialCount < 3
                  ? `Trial ${3 - trialCount}/3 (Klik saran di atas)...`
                  : 'Trial habis. Silakan login...'
                : isRecording
                  ? 'Sedang mendengarkan suara...'
                  : 'Ketik pesan untuk SukaChub...'
            }
            className="input-field"
            style={{
              paddingRight: '55px',
              width: '100%',
              backgroundColor: !userProfile ? '#27272a' : '#18181b',
              cursor: !userProfile ? 'not-allowed' : 'text',
            }}
            disabled={!userProfile || isTyping || isRecording}
            maxLength={200}
          />
          <span
            style={{
              position: 'absolute',
              right: '12px',
              fontSize: '0.65rem',
              color: input.length >= 200 ? '#ef4444' : '#71717a',
              pointerEvents: 'none',
              fontWeight: '500',
            }}
          >
            {input.length}/200
          </span>
        </div>

        {!userProfile ? (
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="login-submit-button"
          >
            Login
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || isTyping || isRecording}
            className="send-button"
          >
            {loading || isTyping ? '...' : 'Kirim'}
          </button>
        )}
      </form>
    </>
  );
}