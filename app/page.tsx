'use client';

import {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  FormEvent,
  PointerEvent,
  CSSProperties,
  RefObject,
} from 'react';
import { useRouter } from 'next/navigation';

// --- INTERFACES & TYPES ---
interface UserProfile {
  username?: string;
  email?: string;
  [key: string]: unknown;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

interface TrialPreset {
  reply: (name: string) => string;
  emotion: string;
}

type ActiveReaction = 'kepala' | 'peluk' | 'marah' | null;

// --- ICONS ---
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconSpeaker = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const IconMute = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <line x1="23" y1="9" x2="17" y2="15"></line>
    <line x1="17" y1="9" x2="23" y2="15"></line>
  </svg>
);

const IconAutoVoiceOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10v4" /><path d="M6 6v12" /><path d="M10 3v18" /><path d="M14 8v8" /><path d="M18 5v14" /><path d="M22 10v4" />
  </svg>
);

const IconAutoVoiceOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10v4" /><path d="M6 6v12" /><line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

// --- TRIAL PRESETS (MENGGUNAKAN DYNAMIC NAME) ---
const TRIAL_PRESETS: Record<string, TrialPreset> = {
  'Peluk boleh?': {
    reply: (name: string) => `Boleh ${name}, sini saya peluk erat kamu dengan sepenuh jiwa raga.`,
    emotion: 'romantic',
  },
  'Temani saya mengobrol': {
    reply: (name: string) => `Tentu ${name}, saya akan mengobrol dan menemani hari-harimu.`,
    emotion: 'neutral',
  },
  'Coba kata kasar': {
    reply: (name: string) => `Maaf ${name}, jangan berkata kasar ya. No no no!`,
    emotion: 'angry',
  },
};

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [trialCount, setTrialCount] = useState<number>(0);

  // Helper untuk mendapatkan nama panggilan user
  const getUserName = (): string => {
    if (!userProfile) return "nama kamu";
    if (userProfile.username) return userProfile.username;
    if (userProfile.email) return userProfile.email.split('@')[0];
    return 'sayang';
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    let loadedUser: UserProfile | null = null;
    if (userData) {
      try {
        loadedUser = JSON.parse(userData);
        setUserProfile(loadedUser);
      } catch {
        localStorage.removeItem('user');
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }

    const savedTrial = localStorage.getItem('trial_count');
    if (savedTrial) {
      setTrialCount(parseInt(savedTrial, 10));
    }

    // Set Greeting Awal dengan Nama User
    const name = loadedUser?.username || (loadedUser?.email ? loadedUser.email.split('@')[0] : 'sayang');
    const initialGreeting = `Halo ${name}, Saya SukaChub virtual chat yang akan menemani kamu, merindukan kehangatan dan kehadiran kamu.`;
    const initialMsg: Message = { role: 'assistant', content: initialGreeting, isTyping: false };
    
    setMessages([initialMsg]);
    setDisplayMessages([initialMsg]);
    setInputDisabled(true);

    if (autoVoice) {
      setTimeout(() => {
        speakText(initialGreeting, 0);
      }, 500);
    } else {
      setInputDisabled(false);
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('spruce');
  const [autoVoice, setAutoVoice] = useState<boolean>(true);
  const [remainingTokens, setRemainingTokens] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const [, setTypingText] = useState<string>('');

  const [inputDisabled, setInputDisabled] = useState<boolean>(true);

  // --- REAKSI INTERAKTIF AVATAR ---
  const [activeReaction, setActiveReaction] = useState<ActiveReaction>(null);
  const activeReactionRef = useRef<ActiveReaction>(null);
  const isInteractingRef = useRef<boolean>(false);

  useEffect(() => {
    activeReactionRef.current = activeReaction;
  }, [activeReaction]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const avatarContainerRef = useRef<HTMLDivElement | null>(null);

  // Video Refs
  const videoIdleRef = useRef<HTMLVideoElement | null>(null);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoKepalaRef = useRef<HTMLVideoElement | null>(null);
  const videoPelukRef = useRef<HTMLVideoElement | null>(null);
  const videoMarahRef = useRef<HTMLVideoElement | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const isSpeaking = playingIndex !== null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTimeQuestion = (text: string): boolean => {
    const timeKeywords = [
      'hari ini', 'hari apa', 'tanggal berapa', 'jam berapa', 'waktu',
      'pukul', 'jam', 'hari', 'tanggal', 'bulan', 'tahun',
      'hr ini', 'hr apa', 'tgl berapa', 'j berapa',
      'tgl', 'tanggal', 'jam', 'pukul', 'waktu'
    ];
    const lowerText = text.toLowerCase();
    return timeKeywords.some(keyword => lowerText.includes(keyword));
  };

  const getLocalTimeResponse = (): string => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const name = getUserName();
    return `Hari ini ${dayName}, ${date} ${monthName} ${year}, jam ${hours}.${minutes}, ${name}. Ada yang bisa aku bantu?`;
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- SWITCH VIDEO TANPA FLICKER ---
  const switchVideo = (activeVideoRef: RefObject<HTMLVideoElement | null>) => {
    const allVideos = [videoIdleRef, videoARef, videoKepalaRef, videoPelukRef, videoMarahRef];

    allVideos.forEach((ref) => {
      if (ref.current && ref.current !== activeVideoRef?.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });

    if (activeVideoRef?.current) {
      if (activeVideoRef.current.paused) {
        activeVideoRef.current.currentTime = 0;
        activeVideoRef.current.play().catch(() => {});
      }
    }
  };

  // --- CONTROL ACTIVE VIDEO ---
  useEffect(() => {
    if (activeReaction === 'kepala') {
      switchVideo(videoKepalaRef);
    } else if (activeReaction === 'marah') {
      switchVideo(videoMarahRef);
    } else if (activeReaction === 'peluk') {
      switchVideo(videoPelukRef);
    } else if (isSpeaking) {
      switchVideo(videoARef);
    } else {
      switchVideo(videoIdleRef);
    }
  }, [activeReaction, isSpeaking]);

  // --- DETEKSI USAPAN / SENTUHAN ---
  const handlePointerAction = (clientX: number, clientY: number) => {
    if (activeReactionRef.current) return;
    if (!avatarContainerRef.current) return;

    const rect = avatarContainerRef.current.getBoundingClientRect();
    const relativeY = (clientY - rect.top) / rect.height;

    if (relativeY < 0.35) {
      setActiveReaction('marah');
    } else if (relativeY < 0.65) {
      setActiveReaction('peluk');
    } else {
      setActiveReaction('kepala');
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    isInteractingRef.current = true;
    handlePointerAction(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (isInteractingRef.current) {
      handlePointerAction(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    isInteractingRef.current = false;
  };

  // --- CLEANUP TEKS ---
  const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/i'm sorry|im sorry|sorry|maaf/gi, 'Maaf')
      .replace(/\s+/g, ' ')
      .trim();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, loading]);

  const stopAudio = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    setPlayingIndex(null);
  };

  const handleClearChat = () => {
    stopAudio();
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const name = getUserName();
    const initialGreeting = `Halo ${name}, Saya SukaChub virtual chat yang akan menemani kamu, merindukan kehangatan dan kehadiran kamu.`;
    const initialMsg: Message = { role: 'assistant', content: initialGreeting, isTyping: false };
    setMessages([initialMsg]);
    setDisplayMessages([initialMsg]);
    setTypingText('');

    setInputDisabled(true);
    if (autoVoice) {
      setTimeout(() => speakText(initialGreeting, 0), 300);
    } else {
      setInputDisabled(false);
    }
  };

  const startTypingEffect = (fullText: string, messageIndex: number) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsTyping(true);
    setTypingMessageIndex(messageIndex);
    setTypingText('');

    setDisplayMessages(prev => {
      const updated = [...prev];
      if (updated[messageIndex]) {
        updated[messageIndex] = {
          ...updated[messageIndex],
          content: '',
          isTyping: true
        };
      }
      return updated;
    });

    let currentIndex = 0;
    const chars = fullText.split('');

    const typeNextChar = () => {
      if (currentIndex < chars.length) {
        const newText = fullText.substring(0, currentIndex + 1);
        setTypingText(newText);

        setDisplayMessages(prev => {
          const updated = [...prev];
          if (updated[messageIndex]) {
            updated[messageIndex] = {
              ...updated[messageIndex],
              content: newText,
              isTyping: true
            };
          }
          return updated;
        });

        currentIndex++;
        const delay = Math.random() * 30 + 15;
        typingTimeoutRef.current = setTimeout(typeNextChar, delay);
      } else {
        setIsTyping(false);
        setTypingMessageIndex(null);

        setDisplayMessages(prev => {
          const updated = [...prev];
          if (updated[messageIndex]) {
            updated[messageIndex] = {
              ...updated[messageIndex],
              content: fullText,
              isTyping: false
            };
          }
          return updated;
        });

        if (messageIndex === 0 && autoVoice) {
          setInputDisabled(false);
        }
      }
    };

    typingTimeoutRef.current = setTimeout(typeNextChar, 100);
  };

  const typeMessageWithAudio = async (fullText: string, messageIndex: number) => {
    const cleanedFullText = sanitizeText(fullText);

    setDisplayMessages(prev => {
      const updated = [...prev];
      if (updated[messageIndex]) {
        updated[messageIndex] = {
          ...updated[messageIndex],
          content: cleanedFullText,
          isTyping: false
        };
      }
      return updated;
    });

    if (autoVoice) {
      try {
        const cleanText = cleanedFullText.replace(/\[Error:.*?\]/g, '').replace(/[*_#]/g, '').trim();
        if (!cleanText) {
          if (messageIndex === 0) setInputDisabled(false);
          return;
        }

        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, voice: selectedVoice }),
        });

        if (!res.ok) throw new Error('TTS gagal');

        const blob = await res.blob();
        if (blob.size === 0) throw new Error('Audio kosong');

        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setPlayingIndex(messageIndex);
          startTypingEffect(cleanedFullText, messageIndex);
        };

        audio.onended = () => {
          stopAudio();
          if (messageIndex === 0 && autoVoice) {
            setInputDisabled(false);
          }
        };

        audio.onerror = () => {
          stopAudio();
          setDisplayMessages(prev => {
            const updated = [...prev];
            if (updated[messageIndex]) {
              updated[messageIndex] = {
                ...updated[messageIndex],
                content: cleanedFullText,
                isTyping: false
              };
            }
            return updated;
          });
          if (messageIndex === 0 && autoVoice) {
            setInputDisabled(false);
          }
        };

        await audio.play();

      } catch (err) {
        console.warn('TTS Error:', err);
        setDisplayMessages(prev => {
          const updated = [...prev];
          if (updated[messageIndex]) {
            updated[messageIndex] = {
              ...updated[messageIndex],
              content: cleanedFullText,
              isTyping: false
            };
          }
          return updated;
        });
        if (messageIndex === 0 && autoVoice) {
          setInputDisabled(false);
        }
      }
    } else {
      setDisplayMessages(prev => {
        const updated = [...prev];
        if (updated[messageIndex]) {
          updated[messageIndex] = {
            ...updated[messageIndex],
            content: cleanedFullText,
            isTyping: false
          };
        }
        return updated;
      });
      if (messageIndex === 0) {
        setInputDisabled(false);
      }
    }
  };

  const speakText = async (text: string, index: number) => {
    if (!text) return;
    if (playingIndex === index) {
      stopAudio();
      return;
    }
    if (isTyping) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    const cleanText = sanitizeText(text).replace(/\[Error:.*?\]/g, '').replace(/[*_#]/g, '').trim();
    if (!cleanText) return;

    const targetIndex = index;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: selectedVoice }),
        signal: controller.signal,
      });

      if (!res.ok) {
        stopAudio();
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        stopAudio();
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setPlayingIndex(targetIndex);
      };

      audio.onended = () => {
        stopAudio();
        if (targetIndex === 0 && autoVoice) {
          setInputDisabled(false);
        }
      };

      audio.onerror = () => {
        stopAudio();
        if (targetIndex === 0 && autoVoice) {
          setInputDisabled(false);
        }
      };

      await audio.play();
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        stopAudio();
        if (targetIndex === 0 && autoVoice) {
          setInputDisabled(false);
        }
      }
    }
  };

  const handlePillClick = (presetKey: string) => {
    const name = getUserName();

    if (userProfile) {
      handleSend(presetKey);
      return;
    }

    if (trialCount >= 3) {
      router.push('/login');
      return;
    }

    const preset = TRIAL_PRESETS[presetKey];
    if (!preset) return;

    const newTrialCount = trialCount + 1;
    setTrialCount(newTrialCount);
    localStorage.setItem('trial_count', newTrialCount.toString());

    const userMsg: Message = { role: 'user', content: presetKey, isTyping: false };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setDisplayMessages(prev => [...prev, userMsg]);

    const cleanedReply = sanitizeText(preset.reply(name));
    const aiMsg: Message = { role: 'assistant', content: '', isTyping: true };
    const updatedMessages: Message[] = [...newMessages, { role: 'assistant', content: cleanedReply }];
    setMessages(updatedMessages);

    const displayIndex = updatedMessages.length - 1;
    setDisplayMessages(prev => [...prev, aiMsg]);

    typeMessageWithAudio(cleanedReply, displayIndex);
  };

  const handleSend = async (textToSend?: string) => {
    if (!userProfile) {
      if (trialCount >= 3) {
        router.push('/login');
      }
      return;
    }

    const query = textToSend || input;
    if (!query.trim() || loading || isTyping || inputDisabled) return;

    if (isTimeQuestion(query)) {
      const userMsg: Message = { role: 'user', content: query, isTyping: false };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setDisplayMessages(prev => [...prev, userMsg]);
      if (!textToSend) setInput('');

      const timeReply = getLocalTimeResponse();
      const aiMsg: Message = { role: 'assistant', content: timeReply, isTyping: false };
      setMessages(prev => [...prev, { role: 'assistant', content: timeReply }]);
      setDisplayMessages(prev => [...prev, aiMsg]);

      if (autoVoice) speakText(timeReply, newMessages.length);
      return;
    }

    const userMsg: Message = { role: 'user', content: query, isTyping: false };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setDisplayMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const name = getUserName();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userName: name, // Kirim nama user ke backend API
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        if (data.remainingTokens) setRemainingTokens(data.remainingTokens);

        const cleanedReply = sanitizeText(data.reply);
        const aiMsg: Message = { role: 'assistant', content: '', isTyping: true };
        const updatedMessages: Message[] = [...newMessages, { role: 'assistant', content: cleanedReply }];
        setMessages(updatedMessages);

        const displayIndex = updatedMessages.length - 1;
        setDisplayMessages(prev => [...prev, aiMsg]);

        typeMessageWithAudio(cleanedReply, displayIndex);

      } else {
        const errorMsg = `Maaf ${getUserName()}, ada masalah teknis: ${data.error || 'Gagal tersambung.'}`;
        setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        setDisplayMessages(prev => [...prev, { role: 'assistant', content: errorMsg, isTyping: false }]);
        setLoading(false);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const errorMsg = `Maaf ${getUserName()}, koneksi terputus (${errorMessage})`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      setDisplayMessages(prev => [...prev, { role: 'assistant', content: errorMsg, isTyping: false }]);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthAction = () => {
    if (userProfile) {
      localStorage.removeItem('user');
      setUserProfile(null);
      router.push('/login');
    } else {
      router.push('/login');
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTitleGroup}>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={styles.menuBtn}
              title="Buka Menu"
            >
              <IconMenu />
            </button>

            {isMenuOpen && (
              <div style={styles.dropdownGrid}>
                <a href="https://ipix.my.id" target="_blank" rel="noopener noreferrer" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>ipix.my.id</a>
                <a href="https://ipixchat.my.id" target="_blank" rel="noopener noreferrer" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>ipixchat.my.id</a>
                <a href="https://sukachub.my.id" target="_blank" rel="noopener noreferrer" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>sukachub.my.id</a>
                <a href="https://ipix.fun" target="_blank" rel="noopener noreferrer" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>ipix.fun</a>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleAuthAction();
                  }}
                  style={{
                    ...styles.gridItem,
                    ...(userProfile ? styles.gridLogout : styles.gridLogin)
                  }}
                >
                  {userProfile ? 'Logout' : 'Login'}
                </button>
              </div>
            )}
          </div>

          <div style={styles.titleWrapper}>
            <h1 style={{ ...styles.title, fontStyle: 'italic', fontWeight: '700' }}>
              SukaChub your virtual chat
            </h1>
            <span style={{
              ...styles.userBadge,
              backgroundColor: userProfile ? 'rgba(249, 115, 22, 0.15)' : 'rgba(239, 68, 68, 0.2)',
              color: userProfile ? '#f97316' : '#ef4444'
            }}>
              {getUserName()}
            </span>
          </div>

          {userProfile && remainingTokens !== null && !isMobile && (
            <span style={styles.tokenBadge}>
              {Number(remainingTokens).toLocaleString('id-ID')} Tkn
            </span>
          )}
        </div>

        <div style={styles.voiceControlGroup}>
          <select value={selectedVoice} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedVoice(e.target.value)} style={styles.voiceSelect}>
            <option value="spruce">Deep Voice</option>
            <option value="arbor">Man Voice</option>
          </select>
          <button
            type="button"
            onClick={() => setAutoVoice(!autoVoice)}
            style={{
              ...styles.autoVoiceBtn,
              backgroundColor: autoVoice ? 'rgba(249, 115, 22, 0.2)' : '#18181b',
              borderColor: autoVoice ? '#f97316' : '#3f3f46',
              color: autoVoice ? '#f97316' : '#a1a1aa',
            }}
          >
            {autoVoice ? <IconAutoVoiceOn /> : <IconAutoVoiceOff />}
            <span>{autoVoice ? 'Sound ON' : 'Sound OFF'}</span>
          </button>
        </div>
      </header>

      <div style={styles.chatBoxWrapper}>
        {/* LAYER AVATAR INTERAKTIF */}
        <div style={styles.avatarLayer}>
          <div
            ref={avatarContainerRef}
            style={styles.avatarContainer}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* IDLE VIDEO */}
            <video
              ref={videoIdleRef}
              src="/D.webm"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              style={{
                ...styles.avatarVideo,
                opacity: !isSpeaking && !activeReaction ? 1 : 0,
              }}
            />

            {/* SPEAKING VIDEO */}
            <video
              ref={videoARef}
              src="/A.webm"
              muted
              loop
              playsInline
              preload="auto"
              style={{
                ...styles.avatarVideo,
                opacity: isSpeaking && !activeReaction ? 1 : 0,
              }}
            />

            {/* REAKSI: MARAH */}
            <video
              ref={videoMarahRef}
              src="/Marah.webm"
              muted
              playsInline
              preload="auto"
              onEnded={() => setActiveReaction(null)}
              style={{
                ...styles.avatarVideo,
                opacity: activeReaction === 'marah' ? 1 : 0,
              }}
            />

            {/* REAKSI: PELUK */}
            <video
              ref={videoPelukRef}
              src="/Peluk.webm"
              muted
              playsInline
              preload="auto"
              onEnded={() => setActiveReaction(null)}
              style={{
                ...styles.avatarVideo,
                opacity: activeReaction === 'peluk' ? 1 : 0,
              }}
            />

            {/* REAKSI: KEPALA */}
            <video
              ref={videoKepalaRef}
              src="/Kepala.webm"
              muted
              playsInline
              preload="auto"
              onEnded={() => setActiveReaction(null)}
              style={{
                ...styles.avatarVideo,
                opacity: activeReaction === 'kepala' ? 1 : 0,
              }}
            />
          </div>
        </div>

        {/* LAYER CHAT */}
        <div style={styles.chatBox}>
          <div style={styles.topSpacer} />
          {displayMessages.map((msg, index) => (
            <div key={index} style={{ ...styles.messageWrapper, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...styles.bubble, ...(msg.role === 'user' ? styles.userBubble : styles.aiBubble) }}>
                <div style={styles.roleHeader}>
                  <span style={{
                    ...styles.roleLabel,
                    color: msg.role === 'assistant' ? '#fb923c' : '#ffffff',
                    fontWeight: '700',
                    fontStyle: 'italic',
                  }}>
                    {msg.role === 'user'
                      ? getUserName()
                      : 'SukaChub Virtual Chat'}
                  </span>
                  {msg.role === 'assistant' && !msg.content?.startsWith('Error:') && !msg.isTyping && msg.content && (
                    <button
                      onClick={() => speakText(msg.content, index)}
                      style={{ ...styles.speakerBtn, color: playingIndex === index ? '#f97316' : '#a1a1aa' }}
                    >
                      {playingIndex === index ? <IconSpeaker /> : <IconMute />}
                    </button>
                  )}
                </div>
                <div style={styles.textContent}>
                  {msg.content || ''}
                  {msg.isTyping && index === typingMessageIndex && (
                    <span style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '1em',
                      backgroundColor: '#f97316',
                      marginLeft: '2px',
                      animation: 'blink 0.5s step-end infinite',
                      verticalAlign: 'text-bottom',
                    }} />
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && !isTyping && (
            <div style={{ ...styles.messageWrapper, justifyContent: 'flex-start' }}>
              <div style={{ ...styles.bubble, ...styles.aiBubble, fontStyle: 'italic', opacity: 0.85 }}>
                <span style={styles.waveDots}>
                  <span style={{ color: '#f97316' }}>.</span>
                  <span style={{ color: '#fb923c' }}>.</span>
                  <span style={{ color: '#fdba74' }}>.</span>
                </span>
                <span style={{ marginLeft: '6px', fontSize: '0.85rem', color: '#a1a1aa' }}>sedang mikir...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div style={styles.suggestions}>
        {Object.keys(TRIAL_PRESETS).map((presetKey, i) => (
          <button key={i} onClick={() => handlePillClick(presetKey)} style={styles.chipButton}>
            {presetKey}
          </button>
        ))}
      </div>

      <form onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); handleSend(); }} style={styles.inputContainer}>
        {userProfile && (
          <button type="button" onClick={handleClearChat} style={styles.clearButton}>
            Hapus
          </button>
        )}

        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder={
              !userProfile
                ? trialCount < 3
                  ? `Trial ${3 - trialCount}/3 (Klik tombol saran di atas)...`
                  : "Trial habis. Silakan login..."
                : inputDisabled
                  ? "Tunggu AI selesai bicara..."
                  : `Ketik pesan untuk SukaChub...`
            }
            style={{
              ...styles.input,
              paddingRight: '55px',
              width: '100%',
              backgroundColor: !userProfile ? '#27272a' : '#18181b',
              cursor: !userProfile ? 'not-allowed' : 'text'
            }}
            disabled={!userProfile || isTyping || inputDisabled}
            maxLength={200}
          />
          <span style={{
            position: 'absolute',
            right: '12px',
            fontSize: '0.65rem',
            color: input.length >= 200 ? '#ef4444' : '#71717a',
            pointerEvents: 'none',
            fontWeight: '500'
          }}>
            {input.length}/200
          </span>
        </div>

        {!userProfile ? (
          <button
            type="button"
            onClick={() => router.push('/login')}
            style={styles.loginSubmitButton}
          >
            Login
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || isTyping || inputDisabled}
            style={styles.sendButton}
          >
            {loading || isTyping ? '...' : 'Kirim'}
          </button>
        )}
      </form>

      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .wave-dots span {
          display: inline-block;
          font-size: 1.8rem;
          line-height: 1;
          animation: bounce 0.6s ease-in-out infinite alternate;
        }
        .wave-dots span:nth-child(1) { animation-delay: 0s; }
        .wave-dots span:nth-child(2) { animation-delay: 0.15s; }
        .wave-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

// ===== STYLES =====
const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    backgroundColor: '#000000',
    color: '#f4f4f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    padding: '10px 12px',
    margin: '8px 10px 0 10px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(24, 24, 27, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(63, 63, 70, 0.4)',
    zIndex: 10,
    flexShrink: 0,
    gap: '6px',
    flexWrap: 'wrap',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: '1 1 auto',
    minWidth: '120px',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    flexShrink: 0,
  },
  dropdownGrid: {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    left: 0,
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '16px',
    padding: '10px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
    zIndex: 100,
    boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
    minWidth: '180px',
  },
  gridItem: {
    backgroundColor: '#27272a',
    color: '#f4f4f5',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: '500',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    border: '1px solid #3f3f46',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLogout: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    fontWeight: '600',
    marginTop: '2px',
  },
  gridLogin: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    fontWeight: '600',
    marginTop: '2px',
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  title: {
    fontSize: 'clamp(0.75rem, 3vw, 0.88rem)',
    fontWeight: '600',
    margin: 0,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
  },
  userBadge: {
    fontSize: '0.65rem',
    padding: '1px 8px',
    borderRadius: '10px',
    fontWeight: '600',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tokenBadge: {
    fontSize: '0.6rem',
    backgroundColor: 'rgba(39, 39, 42, 0.9)',
    color: '#f97316',
    padding: '2px 7px',
    borderRadius: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  voiceControlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    flexShrink: 0,
  },
  voiceSelect: {
    backgroundColor: '#18181b',
    color: '#f4f4f5',
    border: '1px solid #3f3f46',
    borderRadius: '12px',
    padding: '4px 8px',
    fontSize: 'clamp(0.6rem, 2vw, 0.75rem)',
    outline: 'none',
    maxWidth: '90px',
  },
  autoVoiceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid',
    borderRadius: '12px',
    padding: '4px 10px',
    fontSize: 'clamp(0.55rem, 1.8vw, 0.72rem)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  chatBoxWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  avatarLayer: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    pointerEvents: 'none',
    zIndex: 1,
    paddingTop: '10px',
  },
  avatarContainer: {
    position: 'relative',
    width: 'min(100%, 400px)',
    height: 'min(60vh, 500px)',
    maxHeight: '500px',
    display: 'flex',
    justifyContent: 'center',
    transform: 'scale(1.02)',
    transition: 'transform 0.3s ease',
    marginTop: 'clamp(30px, 8vh, 80px)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  avatarVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transition: 'opacity 0.2s linear',
    pointerEvents: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  chatBox: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
    overflowY: 'auto',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 30%, black 50%, black 100%)',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 30%, black 50%, black 100%)',
    WebkitOverflowScrolling: 'touch',
    pointerEvents: 'none',
  },
  topSpacer: {
    minHeight: 'clamp(180px, 35vh, 240px)',
    flexShrink: 0,
    pointerEvents: 'none',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
    pointerEvents: 'none',
  },
  bubble: {
    maxWidth: '88%',
    padding: '10px 14px',
    borderRadius: '18px',
    fontSize: 'clamp(0.82rem, 2.5vw, 0.9rem)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    wordBreak: 'break-word',
    pointerEvents: 'auto',
  },
  userBubble: {
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
    color: '#ffffff',
    borderRadius: '18px 18px 4px 18px'
  },
  aiBubble: {
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    color: '#f4f4f5',
    border: '1px solid rgba(63, 63, 70, 0.5)',
    borderRadius: '18px 18px 18px 4px'
  },
  roleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3px',
    gap: '6px'
  },
  roleLabel: {
    fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)',
    opacity: 0.9,
  },
  speakerBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    touchAction: 'manipulation',
  },
  textContent: {
    whiteSpace: 'pre-wrap',
    lineHeight: '1.45',
    wordBreak: 'break-word',
    fontSize: 'clamp(0.82rem, 2.5vw, 0.9rem)',
  },
  waveDots: {
    display: 'inline-flex',
    gap: '3px',
    fontSize: '1.6rem',
    letterSpacing: '2px',
    alignItems: 'center',
  },
  suggestions: {
    display: 'flex',
    gap: '6px',
    padding: '6px 12px',
    overflowX: 'auto',
    zIndex: 3,
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    backgroundColor: '#000000',
  },
  chipButton: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    border: '1px solid rgba(63, 63, 70, 0.6)',
    color: '#d4d4d8',
    padding: '6px 14px',
    borderRadius: '9999px',
    fontSize: 'clamp(0.7rem, 2.2vw, 0.78rem)',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    touchAction: 'manipulation',
    minHeight: '36px',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px calc(8px + env(safe-area-inset-bottom)) 12px',
    gap: '6px',
    backgroundColor: '#000000',
    zIndex: 3,
    borderTop: '1px solid rgba(63, 63, 70, 0.3)',
  },
  input: {
    flex: 1,
    border: '1px solid #27272a',
    borderRadius: '20px',
    padding: '10px 14px',
    color: '#fff',
    outline: 'none',
    fontSize: 'clamp(0.85rem, 2.8vw, 0.95rem)',
    minHeight: '42px',
    WebkitAppearance: 'none',
    backgroundColor: '#18181b',
  },
  sendButton: {
    backgroundColor: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    padding: '0 16px',
    height: '42px',
    minWidth: '60px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
    boxShadow: '0 2px 10px rgba(249, 115, 22, 0.4)',
    touchAction: 'manipulation',
    flexShrink: 0,
  },
  loginSubmitButton: {
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    padding: '0 18px',
    height: '42px',
    minWidth: '65px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
    boxShadow: '0 2px 10px rgba(34, 197, 94, 0.4)',
    touchAction: 'manipulation',
    flexShrink: 0,
  },
  clearButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '20px',
    padding: '0 12px',
    height: '42px',
    fontSize: 'clamp(0.7rem, 2.2vw, 0.78rem)',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    touchAction: 'manipulation',
    flexShrink: 0,
  },
};