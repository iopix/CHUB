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

type ActiveReaction = 'kepala' | 'perut' | 'kaki' | 'peluk' | 'marah' | null;

interface RippleEffect {
  id: number;
  x: number;
  y: number;
}

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

const IconMicLarge = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

// --- TRIAL PRESETS ---
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

  const getUserName = (): string => {
    if (!userProfile) return "sayang";
    if (userProfile.username) return userProfile.username;
    if (userProfile.email) return userProfile.email.split('@')[0];
    return 'sayang';
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('spruce');
  const [autoVoice, setAutoVoice] = useState<boolean>(true);
  const [remainingTokens, setRemainingTokens] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // State Nama Model AI Aktif
  const [activeModel, setActiveModel] = useState<string>('Auto-Detect Server');

  // State Fitur Microfon / STT
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const [, setTypingText] = useState<string>('');

  const [, setInputDisabled] = useState<boolean>(false);

  // --- REAKSI INTERAKTIF AVATAR & INFO DINAMIS ---
  const [activeReaction, setActiveReaction] = useState<ActiveReaction>(null);
  const activeReactionRef = useRef<ActiveReaction>(null);
  const isInteractingRef = useRef<boolean>(false);

  // State Info Dinamis di atas Avatar
  const [dynamicStatus, setDynamicStatus] = useState<{ text: string; bg: string; border: string }>({
    text: 'Siap mengobrol dan menemani harimu!',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.4)',
  });

  // ASMR Wave Ripples
  const [ripples, setRipples] = useState<RippleEffect[]>([]);

  useEffect(() => {
    activeReactionRef.current = activeReaction;
  }, [activeReaction]);

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

    const name = loadedUser?.username || (loadedUser?.email ? loadedUser.email.split('@')[0] : 'sayang');
    const initialGreeting = `Halo ${name}, Saya SukaChub virtual chat yang akan menemani kamu, merindukan kehangatan dan kehadiran kamu.`;
    const initialMsg: Message = { role: 'assistant', content: initialGreeting, isTyping: false };

    setMessages([initialMsg]);
    setDisplayMessages([initialMsg]);

    if (autoVoice) {
      setTimeout(() => {
        speakText(initialGreeting, 0);
      }, 500);
    } else {
      setInputDisabled(false);
    }
  }, []);

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

  useEffect(() => {
    if (activeReaction === 'marah' || activeReaction === 'kepala') {
      switchVideo(videoMarahRef);
    } else if (activeReaction === 'perut' || activeReaction === 'peluk') {
      switchVideo(videoPelukRef);
    } else if (activeReaction === 'kaki') {
      switchVideo(videoKepalaRef);
    } else if (isSpeaking) {
      switchVideo(videoARef);
    } else {
      switchVideo(videoIdleRef);
    }
  }, [activeReaction, isSpeaking]);

  // --- INTERAKSI SENTUH BAGIAN TUBUH AVATAR ---
  const triggerBodyPartTouch = (part: 'kepala' | 'perut' | 'kaki', e?: React.MouseEvent) => {
    // 1. ASMR Ripple Effect
    if (e && avatarContainerRef.current) {
      const rect = avatarContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    // 2. Tentukan Reaksi dan Update Info Dinamis
    if (part === 'kepala') {
      setActiveReaction('marah');
      setDynamicStatus({
        text: '😡 Sentuh Kepala: Dia MARAH!',
        bg: 'rgba(239, 68, 68, 0.25)',
        border: 'rgba(239, 68, 68, 0.6)',
      });
      speakText('Aduh! Jangan pegang-pegang kepala dong!', 0);
    } else if (part === 'perut') {
      setActiveReaction('perut');
      setDynamicStatus({
        text: '😂 Sentuh Perut: Dia GOYANG!',
        bg: 'rgba(249, 115, 22, 0.25)',
        border: 'rgba(249, 115, 22, 0.6)',
      });
      speakText('Haha geli banget! Perut buncitku jadi goyang!', 0);
    } else if (part === 'kaki') {
      setActiveReaction('kaki');
      setDynamicStatus({
        text: '😕 Sentuh Kaki: Dia BINGUNG!',
        bg: 'rgba(59, 130, 246, 0.25)',
        border: 'rgba(59, 130, 246, 0.6)',
      });
      speakText('Eh? Kenapa kamu pegang-pegang kakiku?', 0);
    }

    // Reset Info Dinamis Setelah 3.5 Detik
    setTimeout(() => {
      setDynamicStatus({
        text: 'Siap mengobrol dan menemani harimu!',
        bg: 'rgba(249, 115, 22, 0.15)',
        border: 'rgba(249, 115, 22, 0.4)',
      });
    }, 3500);
  };

  const handlePointerAction = (clientX: number, clientY: number) => {
    if (activeReactionRef.current) return;
    if (!avatarContainerRef.current) return;

    const rect = avatarContainerRef.current.getBoundingClientRect();
    const relativeY = (clientY - rect.top) / rect.height;

    if (relativeY < 0.35) {
      triggerBodyPartTouch('kepala');
    } else if (relativeY < 0.68) {
      triggerBodyPartTouch('perut');
    } else {
      triggerBodyPartTouch('kaki');
    }
  };

  const handlePointerDownAvatar = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isInteractingRef.current = true;
    handlePointerAction(e.clientX, e.clientY);
  };

  const handlePointerMoveAvatar = (e: PointerEvent<HTMLDivElement>) => {
    if (isInteractingRef.current) {
      handlePointerAction(e.clientX, e.clientY);
    }
  };

  const handlePointerUpAvatar = () => {
    isInteractingRef.current = false;
  };

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

    setInputDisabled(false);
    if (autoVoice) {
      setTimeout(() => speakText(initialGreeting, 0), 300);
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

        setInputDisabled(false);
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
          setInputDisabled(false);
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
          setInputDisabled(false);
        };

        audio.onerror = () => {
          stopAudio();
          setInputDisabled(false);
        };

        await audio.play();

      } catch (err) {
        console.warn('TTS Error:', err);
        setInputDisabled(false);
      }
    } else {
      setInputDisabled(false);
    }
  };

  const speakText = async (text: string, index: number) => {
    if (!text) return;
    if (playingIndex === index) {
      stopAudio();
      return;
    }
    if (isTyping) return;

    stopAudio();

    const cleanText = sanitizeText(text).replace(/\[Error:.*?\]/g, '').replace(/[*_#]/g, '').trim();
    if (!cleanText) return;

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
        setInputDisabled(false);
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        stopAudio();
        setInputDisabled(false);
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setPlayingIndex(index);
      };

      audio.onended = () => {
        stopAudio();
        setInputDisabled(false);
      };

      audio.onerror = () => {
        stopAudio();
        setInputDisabled(false);
      };

      await audio.play();
    } catch {
      stopAudio();
      setInputDisabled(false);
    }
  };

  const startRecording = async (e?: unknown) => {
    if (e && typeof (e as Event).preventDefault === 'function') (e as Event).preventDefault();

    if (!userProfile) {
      if (trialCount >= 3) {
        router.push('/login');
      }
      return;
    }

    if (loading || isTyping || isRecording) return;

    stopAudio();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Akses mic diblokir atau tidak didukung!");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        if (audioBlob.size === 0) return;

        const formData = new FormData();
        formData.append('file', audioBlob);

        setLoading(true);
        try {
          const res = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (res.ok && data.text) {
            handleSend(data.text);
          }
        } catch (err) {
          console.error('STT Error:', err);
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Izin mic ditolak!");
      console.error('Akses mikrofon ditolak:', err);
    }
  };

  const stopRecording = (e?: unknown) => {
    if (e && typeof (e as Event).preventDefault === 'function') (e as Event).preventDefault();
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
    if (!query.trim() || loading || isTyping) return;

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
          userName: name,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        if (data.remainingTokens) setRemainingTokens(data.remainingTokens);
        
        // Update Nama Model AI jika dikembalikan dari backend
        if (data.model) {
          setActiveModel(data.model);
        }

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
            
            {/* Teks Model Aktif & User Badge di bawah Teks Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{
                ...styles.userBadge,
                backgroundColor: userProfile ? 'rgba(249, 115, 22, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                color: userProfile ? '#f97316' : '#ef4444'
              }}>
                {getUserName()}
              </span>
              <span style={styles.modelSubtitle}>
                Model Aktif: {activeModel}
              </span>
            </div>
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

      {/* --- MAIN CONTENT AREA --- */}
      <div style={styles.mainContent}>

        {/* 1. CHAT BUBBLE SECTION */}
        <div style={styles.chatSection}>
          <div style={styles.chatBox}>
            {displayMessages.map((msg, index) => (
              <div key={index} style={{ ...styles.messageWrapper, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  ...styles.bubble,
                  ...(msg.role === 'user' ? styles.userBubble : styles.aiBubble),
                }}>
                  <div style={styles.roleHeader}>
                    <span style={{
                      ...styles.roleLabel,
                      color: msg.role === 'assistant' ? '#fb923c' : '#ffffff',
                      fontWeight: '700',
                      fontStyle: 'italic',
                    }}>
                      {msg.role === 'user' ? getUserName() : 'SukaChub Virtual Chat'}
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

            {/* ANIMASI LOADING 3 TITIK MEMBAL (SEDANG MIKIR) */}
            {loading && !isTyping && (
              <div style={{ ...styles.messageWrapper, justifyContent: 'flex-start' }}>
                <div style={{ ...styles.bubble, ...styles.aiBubble, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="loading-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#a1a1aa', fontStyle: 'italic' }}>sedang mikir...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* 2. AVATAR & MIC SECTION */}
        <div style={{
          ...styles.avatarSection,
          ...(isMobile ? styles.avatarSectionMobile : {}),
        }}>

          {/* INFO DINAMIS DI ATAS AVATAR */}
          <div style={{
            ...styles.dynamicStatusBubble,
            backgroundColor: dynamicStatus.bg,
            borderColor: dynamicStatus.border,
          }}>
            <span style={styles.dynamicStatusDot} />
            <span style={styles.dynamicStatusText}>{dynamicStatus.text}</span>
          </div>

          {/* AVATAR CONTAINER */}
          <div
            ref={avatarContainerRef}
            style={styles.avatarContainer}
            onPointerDown={handlePointerDownAvatar}
            onPointerMove={handlePointerMoveAvatar}
            onPointerUp={handlePointerUpAvatar}
            onPointerCancel={handlePointerUpAvatar}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* HOTSPOT TRANS-INTERAKTIF TERBAGI TIGA AREA */}
            <div
              style={styles.hitboxHead}
              title="Sentuh Kepala (Marah)"
              onClick={(e) => { e.stopPropagation(); triggerBodyPartTouch('kepala', e); }}
            />
            <div
              style={styles.hitboxBelly}
              title="Sentuh Perut (Goyang)"
              onClick={(e) => { e.stopPropagation(); triggerBodyPartTouch('perut', e); }}
            />
            <div
              style={styles.hitboxLegs}
              title="Sentuh Kaki (Bingung)"
              onClick={(e) => { e.stopPropagation(); triggerBodyPartTouch('kaki', e); }}
            />

            {/* ANIMASI ASMR TOUCH RIPPLE */}
            {ripples.map((r) => (
              <span
                key={r.id}
                className="asmr-ripple"
                style={{
                  left: `${r.x}px`,
                  top: `${r.y}px`,
                }}
              />
            ))}

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

            {/* REAKSI: PELUK / GOYANG */}
            <video
              ref={videoPelukRef}
              src="/Peluk.webm"
              muted
              playsInline
              preload="auto"
              onEnded={() => setActiveReaction(null)}
              style={{
                ...styles.avatarVideo,
                opacity: activeReaction === 'peluk' || activeReaction === 'perut' ? 1 : 0,
              }}
            />

            {/* REAKSI: KEPALA / BINGUNG */}
            <video
              ref={videoKepalaRef}
              src="/Kepala.webm"
              muted
              playsInline
              preload="auto"
              onEnded={() => setActiveReaction(null)}
              style={{
                ...styles.avatarVideo,
                opacity: activeReaction === 'kepala' || activeReaction === 'kaki' ? 1 : 0,
              }}
            />
          </div>

          {/* MIC BAWAH AVATAR */}
          <div style={styles.voiceControlPanel}>
            <button
              type="button"
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={stopRecording}
              onPointerCancel={stopRecording}
              onContextMenu={(e) => e.preventDefault()}
              disabled={loading || isTyping}
              style={{
                ...styles.holdMicButton,
                ...(isMobile ? styles.holdMicButtonMobile : {}),
                backgroundColor: isRecording ? '#ef4444' : '#f97316',
                transform: isRecording ? 'scale(1.15)' : 'scale(1)',
                boxShadow: isRecording ? '0 0 30px rgba(239, 68, 68, 0.9)' : '0 4px 25px rgba(249, 115, 22, 0.5)',
              }}
            >
              <IconMicLarge />
            </button>
            <span style={styles.micLabel}>
              {isRecording
                ? 'Lepas untuk kirim...'
                : loading
                  ? 'Memproses...'
                  : 'Tahan jari untuk bicara'}
            </span>
          </div>
        </div>

      </div>

      {/* SUGGESTION BUTTONS */}
      <div style={styles.suggestions}>
        {Object.keys(TRIAL_PRESETS).map((presetKey, i) => (
          <button key={i} onClick={() => handlePillClick(presetKey)} style={styles.chipButton}>
            {presetKey}
          </button>
        ))}
      </div>

      {/* FOOTER INPUT TEXT FORM */}
      <form onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); handleSend(); }} style={styles.inputContainer}>
        {userProfile && (
          <button type="button" onClick={handleClearChat} style={styles.clearButton}>
            Hapus
          </button>
        )}

        <div style={{ position: 'relative', flexGrow: 1, flexShrink: 1, flexBasis: '0%', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder={
              !userProfile
                ? trialCount < 3
                  ? `Trial ${3 - trialCount}/3 (Klik saran di atas)...`
                  : "Trial habis. Silakan login..."
                : isRecording
                  ? "Sedang mendengarkan suara..."
                  : `Ketik pesan untuk SukaChub...`
            }
            style={{
              ...styles.input,
              paddingRight: '55px',
              width: '100%',
              backgroundColor: !userProfile ? '#27272a' : '#18181b',
              cursor: !userProfile ? 'not-allowed' : 'text'
            }}
            disabled={!userProfile || isTyping || isRecording}
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
            disabled={loading || isTyping || isRecording}
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

        /* --- EFEK RIPPLE TOUCH ASMR --- */
        .asmr-ripple {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid #f97316;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 20;
          animation: rippleEffect 0.6s cubic-bezier(0, 0.2, 0.8, 1) forwards;
        }

        @keyframes rippleEffect {
          0% {
            width: 0px;
            height: 0px;
            opacity: 1;
          }
          100% {
            width: 120px;
            height: 120px;
            opacity: 0;
          }
        }

        /* --- ANIMASI 3 TITIK LOADING MEMBAL --- */
        .loading-dots {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .loading-dots .dot {
          width: 6px;
          height: 6px;
          background-color: #f97316;
          border-radius: 50%;
          animation: dotBounce 1.4s infinite ease-in-out both;
        }

        .loading-dots .dot:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dots .dot:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes dotBounce {
          0%, 80%, 100% {
            transform: scale(0.4);
            opacity: 0.3;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        * {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
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
    WebkitTapHighlightColor: 'transparent',
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
    zIndex: 20,
    flexShrink: 0,
    gap: '6px',
    flexWrap: 'wrap',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
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
    WebkitTapHighlightColor: 'transparent',
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
  modelSubtitle: {
    fontSize: '0.65rem',
    color: '#a1a1aa',
    fontWeight: '400',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px',
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
    WebkitTapHighlightColor: 'transparent',
  },
  mainContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  chatSection: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 5,
  },
  chatBox: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    WebkitOverflowScrolling: 'touch',
  },
  avatarSection: {
    width: 'min(45%, 450px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 8px',
    backgroundColor: '#000000',
    borderLeft: '1px solid rgba(63, 63, 70, 0.2)',
    flexShrink: 0,
    position: 'relative',
  },
  avatarSectionMobile: {
    width: '45%',
    padding: '10px 4px',
  },
  dynamicStatusBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    marginBottom: '8px',
    maxWidth: '95%',
    textAlign: 'center',
    zIndex: 15,
  },
  dynamicStatusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#f97316',
    flexShrink: 0,
  },
  dynamicStatusText: {
    fontSize: 'clamp(0.6rem, 1.8vw, 0.72rem)',
    fontWeight: '600',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  avatarContainer: {
    position: 'relative',
    width: '100%',
    height: '40vh',
    minHeight: '200px',
    maxHeight: '400px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
  },
  hitboxHead: {
    position: 'absolute',
    top: '2%',
    width: '60%',
    height: '28%',
    borderRadius: '50%',
    zIndex: 15,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  hitboxBelly: {
    position: 'absolute',
    top: '32%',
    width: '70%',
    height: '35%',
    borderRadius: '40%',
    zIndex: 15,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  hitboxLegs: {
    position: 'absolute',
    top: '68%',
    width: '65%',
    height: '30%',
    borderRadius: '20px',
    zIndex: 15,
    cursor: 'pointer',
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
  voiceControlPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    zIndex: 10,
    flexShrink: 0,
  },
  holdMicButton: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: 'none',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, box-shadow 0.2s ease',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
  },
  holdMicButtonMobile: {
    width: '56px',
    height: '56px',
  },
  micLabel: {
    fontSize: 'clamp(0.6rem, 1.5vw, 0.78rem)',
    color: '#a1a1aa',
    fontWeight: '500',
    textAlign: 'center',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
  },
  bubble: {
    maxWidth: '90%',
    padding: '10px 14px',
    borderRadius: '18px',
    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    wordBreak: 'break-word',
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
    gap: '4px'
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
    WebkitTapHighlightColor: 'transparent',
  },
  textContent: {
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  },
  suggestions: {
    display: 'flex',
    gap: '6px',
    padding: '6px 12px',
    overflowX: 'auto',
    zIndex: 15,
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    backgroundColor: '#000000',
  },
  chipButton: {
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
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
    WebkitTapHighlightColor: 'transparent',
    minHeight: '36px',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px calc(8px + env(safe-area-inset-bottom)) 12px',
    gap: '6px',
    backgroundColor: '#000000',
    zIndex: 15,
    borderTop: '1px solid rgba(63, 63, 70, 0.3)',
  },
  input: {
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
    WebkitTapHighlightColor: 'transparent',
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
    WebkitTapHighlightColor: 'transparent',
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
    WebkitTapHighlightColor: 'transparent',
    flexShrink: 0,
  },
};