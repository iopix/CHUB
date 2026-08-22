'use client';

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { UserProfile } from './header';
import styles from './page.module.css';

interface TrialPreset {
  reply: (name: string) => string;
  emotion: string;
}

interface InputSectionProps {
  input: string;
  setInput: (value: string) => void;
  userProfile: UserProfile | null;
  textTrialCount: number;
  voiceTrialCount: number;
  loading: boolean;
  isTyping: boolean;
  isRecording: boolean;
  isInitialized: boolean;
  trialPresets: Record<string, TrialPreset>;
  handleSend: (textToSend?: string) => void;
  handleClearChat: () => void;
  handlePillClick: (presetKey: string) => void;
  startRecording: () => void;
  stopRecording: (cancel?: boolean) => void;
}

const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconMic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconKeyboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <line x1="6" y1="8" x2="6.01" y2="8" />
    <line x1="10" y1="8" x2="10.01" y2="8" />
    <line x1="14" y1="8" x2="14.01" y2="8" />
    <line x1="18" y1="8" x2="18.01" y2="8" />
    <line x1="6" y1="12" x2="6.01" y2="12" />
    <line x1="10" y1="12" x2="10.01" y2="12" />
    <line x1="14" y1="12" x2="14.01" y2="12" />
    <line x1="18" y1="18" x2="18.01" y2="18" />
    <line x1="8" y1="16" x2="16" y2="16" />
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
  loading,
  isRecording,
  trialPresets,
  handleSend,
  handleClearChat,
  handlePillClick,
  startRecording,
  stopRecording,
}: InputSectionProps) {
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isCancelRecording, setIsCancelRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [volumeHeights, setVolumeHeights] = useState<number[]>([4, 4, 4, 4, 4, 4]);

  const startPosYRef = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Context Ref untuk Visualizer Real-time
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Scroll Drag Ref
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isMouseDownScrollRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // --- AUDIO VISUALIZER & TIMER CONTROL ---
  useEffect(() => {
    if (isRecording) {
      // Setup Timer Detik
      setRecordSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);

      // Setup Web Audio API Visualizer dari Mikrofon
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVisualizer = () => {
          analyser.getByteFrequencyData(dataArray);
          
          // Ambil sampel frekuensi dan petakan ke 6 baris tinggi (min: 4px, max: 28px)
          const newHeights = [
            Math.max(4, (dataArray[1] || 0) / 9),
            Math.max(4, (dataArray[3] || 0) / 7),
            Math.max(4, (dataArray[5] || 0) / 5),
            Math.max(4, (dataArray[7] || 0) / 5),
            Math.max(4, (dataArray[4] || 0) / 7),
            Math.max(4, (dataArray[2] || 0) / 9),
          ];

          setVolumeHeights(newHeights);
          animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        };

        updateVisualizer();
      }).catch((err) => {
        console.warn('Gagal akses audio visualizer:', err);
      });
    } else {
      // Cleanup saat Perekaman Selesai/Batal
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((track) => track.stop());

      setRecordSeconds(0);
      setVolumeHeights([4, 4, 4, 4, 4, 4]);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording]);

  // --- GLOBAL WINDOW POINTER LISTENERS (FIX MOUSE LEPAS & CANCEL) ---
  useEffect(() => {
    const handleGlobalPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isPointerDownRef.current) return;
      const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Jika digeser naik lebih dari 40px ke atas -> Status BATAL
      if (startPosYRef.current - currentY > 40) {
        setIsCancelRecording(true);
      } else {
        setIsCancelRecording(false);
      }
    };

    const handleGlobalPointerUp = () => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;
      
      // Hentikan rekaman (apakah dikirim atau dibatalkan berdasarkan isCancelRecording)
      stopRecording(isCancelRecording);
      setIsCancelRecording(false);
    };

    window.addEventListener('mousemove', handleGlobalPointerMove);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchmove', handleGlobalPointerMove);
    window.addEventListener('touchend', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalPointerMove);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchmove', handleGlobalPointerMove);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [stopRecording, isCancelRecording]);

  const handlePointerStart = (clientY: number) => {
    isPointerDownRef.current = true;
    startPosYRef.current = clientY;
    setIsCancelRecording(false);
    startRecording();
  };

  // --- MOUSE DRAG PILL PRESETS ---
  const handleMouseDownScroll = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isMouseDownScrollRef.current = true;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeaveScroll = () => { isMouseDownScrollRef.current = false; };
  const handleMouseUpScroll = () => { isMouseDownScrollRef.current = false; };

  const handleMouseMoveScroll = (e: React.MouseEvent) => {
    if (!isMouseDownScrollRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format detik 00:00
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <footer className={styles.footerWrapper}>
      {/* Baris Preset Pill & Tombol Hapus */}
      <div className={styles.capsuleRowWrapper}>
        <button
          type="button"
          onClick={handleClearChat}
          className={`${styles.dynamicChipButton} ${styles.clearChipButton}`}
          title="Hapus Chat"
        >
          <IconTrash />
          <span>Hapus Chat</span>
        </button>

        <div
          ref={scrollRef}
          className={styles.capsuleRowScroll}
          onMouseDown={handleMouseDownScroll}
          onMouseLeave={handleMouseLeaveScroll}
          onMouseUp={handleMouseUpScroll}
          onMouseMove={handleMouseMoveScroll}
        >
          {Object.keys(trialPresets).map((presetKey) => (
            <button
              key={presetKey}
              type="button"
              onClick={() => handlePillClick(presetKey)}
              className={styles.dynamicChipButton}
            >
              {presetKey}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePillClick('Sekarang tanggal berapa?')}
            className={styles.dynamicChipButton}
          >
            Sekarang tanggal berapa?
          </button>
        </div>
      </div>

      {/* Main Input Component */}
      <div className={styles.mainInputBox}>
        {isRecording ? (
          <div className={`${styles.recordingOverlay} ${isCancelRecording ? styles.recordingOverlayCancel : ''}`}>
            {/* Visualizer Bar Real-time */}
            <div className={styles.waveformContainer}>
              {volumeHeights.map((height, idx) => (
                <span
                  key={idx}
                  className={styles.waveBarRealtime}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            {/* Timer Perekam */}
            <span className={styles.recordingTimer}>
              {formatTimer(recordSeconds)}
            </span>

            {/* Petunjuk Aksi */}
            <span className={styles.recordingText}>
              {isCancelRecording ? 'Lepas mouse/jari untuk BATAL' : 'Geser ke atas untuk batal'}
            </span>
          </div>
        ) : (
          <>
            <div className={styles.inputBodyContainer}>
              {inputMode === 'voice' ? (
                <button
                  type="button"
                  onMouseDown={(e) => handlePointerStart(e.clientY)}
                  onTouchStart={(e) => handlePointerStart(e.touches[0].clientY)}
                  className={styles.holdToTalkButton}
                >
                  Tahan untuk berbicara
                </button>
              ) : (
                <div className={styles.textForm}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pesan..."
                    className={styles.inputField}
                    maxLength={500}
                    disabled={loading}
                  />
                  {input.length > 0 && (
                    <span className={styles.charCounter}>{input.length}/500</span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.rightActionGroup}>
              <button
                type="button"
                onClick={() => setInputMode(inputMode === 'text' ? 'voice' : 'text')}
                className={styles.modeToggleButton}
                title={inputMode === 'text' ? 'Beralih ke Suara' : 'Beralih ke Teks'}
              >
                {inputMode === 'text' ? <IconMic /> : <IconKeyboard />}
              </button>

              {inputMode === 'text' && (
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className={styles.sendIconButton}
                  style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}
                >
                  <IconSend />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </footer>
  );
}