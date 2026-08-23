'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { useRouter } from 'next/navigation';
import Header, { UserProfile } from './header';
import InputSection from './input';
import styles from './page.module.css';

interface Message { role: 'user' | 'assistant'; content: string; }
interface TrialPreset { reply: (name: string) => string; emotion: string; }
type ActiveReaction = 'kepala' | 'perut' | 'kaki' | 'peluk' | 'marah' | null;
interface RippleEffect { id: number; x: number; y: number; }

const TRIAL_PRESETS: Record<string, TrialPreset> = {
  'tgl berapa?': { reply: (name: string) => `Hari ini hari ${['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()]}, ${name}!`, emotion: 'neutral' },
  'Peluk boleh?': { reply: (name: string) => `Boleh ${name}, sini saya peluk erat kamu dengan sepenuh jiwa raga.`, emotion: 'romantic' },
  'Temani saya mengobrol': { reply: (name: string) => `Tentu ${name}, saya akan mengobrol dan menemani hari-harimu.`, emotion: 'neutral' },
  'Coba kata kasar': { reply: (name: string) => `Maaf ${name}, jangan berkata kasar ya. No no no!`, emotion: 'angry' },
};

const VOICE_OPTIONS = [
  { id: 'voice1', label: 'Voice 1' },
  { id: 'voice2', label: 'Voice 2' },
  { id: 'voice3', label: 'Voice 3' },
  { id: 'voice4', label: 'Voice 4' },
  { id: 'voice5', label: 'Voice 5' },
];

const IconTrashOrange = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

/* SVG Aksen HUD Futuristik untuk Bubble Chat */
const SciFiHudDecoration = ({ isUser }: { isUser: boolean }) => (
  <svg
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1,
    }}
    preserveAspectRatio="none"
    viewBox="0 0 100 100"
  >
    <path
      d={isUser ? "M 8,0 L 92,0 L 100,12 L 100,88 L 92,100 L 0,100 L 0,12 Z" : "M 0,0 L 92,0 L 100,12 L 100,100 L 8,100 L 0,88 Z"}
      fill="none"
      stroke={isUser ? "#f97316" : "#fb923c"}
      strokeWidth="1.5"
      vectorEffect="non-scaling-stroke"
    />
    {isUser ? (
      <>
        <line x1="15" y1="3" x2="35" y2="3" stroke="#f97316" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <line x1="85" y1="97" x2="95" y2="97" stroke="#f97316" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <rect x="2" y="30" width="3" height="12" fill="#f97316" />
      </>
    ) : (
      <>
        <line x1="65" y1="3" x2="85" y2="3" stroke="#f97316" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <line x1="5" y1="97" x2="20" y2="97" stroke="#f97316" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <rect x="95" y="30" width="3" height="12" fill="#f97316" />
      </>
    )}
  </svg>
);

function SwipeableMessage({ 
  children, 
  onDelete 
}: { 
  children: React.ReactNode; 
  onDelete: () => void;
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startXRef.current;
    if (Math.abs(diff) < 120) setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (Math.abs(translateX) > 65) onDelete();
    setTranslateX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return;
    const diff = e.clientX - startXRef.current;
    if (Math.abs(diff) < 120) setTranslateX(diff);
  };

  const handleMouseUp = () => {
    if (isSwiping && Math.abs(translateX) > 65) onDelete();
    setIsSwiping(false);
    setTranslateX(0);
  };

  const isDraggingActive = Math.abs(translateX) > 15;

  return (
    <div 
      className={styles.swipeContainer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {isDraggingActive && (
        <div className={styles.swipeTrashBackground}>
          <IconTrashOrange />
        </div>
      )}
      <div 
        className={styles.swipeContent} 
        style={{ 
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [textTrialCount, setTextTrialCount] = useState<number>(0);
  const [voiceTrialCount, setVoiceTrialCount] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const getUserName = (): string => {
    if (!userProfile) return "sayang";
    if (userProfile.username) return userProfile.username;
    if (userProfile.email) return userProfile.email.split('@')[0];
    return 'sayang';
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isAudioRendering, setIsAudioRendering] = useState<boolean>(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  
  const [selectedVoice, setSelectedVoice] = useState<string>('voice1');
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState<boolean>(false);
  const [autoVoice, setAutoVoice] = useState<boolean>(false);
  const [prevMultiAutoVoice, setPrevMultiAutoVoice] = useState<boolean>(false);
  
  const [remainingTokens, setRemainingTokens] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>('Auto-Detect Server');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const [isSingleChat, setIsSingleChat] = useState<boolean>(false);
  const [activeSingleIndex, setActiveSingleIndex] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [activeReaction, setActiveReaction] = useState<ActiveReaction>(null);
  const activeReactionRef = useRef<ActiveReaction>(null);

  const [isWelcomeBubble, setIsWelcomeBubble] = useState<boolean>(true);
  const [displayedStatusText, setDisplayedStatusText] = useState<string>('');

  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const voiceMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { activeReactionRef.current = activeReaction; }, [activeReaction]);

  useEffect(() => {
    if (isSingleChat) {
      setPrevMultiAutoVoice(autoVoice);
      setAutoVoice(true);
    } else {
      setAutoVoice(prevMultiAutoVoice);
    }
  }, [isSingleChat]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    let loadedUser: UserProfile | null = null;
    if (userData) {
      try { loadedUser = JSON.parse(userData); setUserProfile(loadedUser); }
      catch { localStorage.removeItem('user'); setUserProfile(null); }
    } else { setUserProfile(null); }

    const savedTextTrial = localStorage.getItem('text_trial_count');
    if (savedTextTrial) setTextTrialCount(parseInt(savedTextTrial, 10));

    const savedVoiceTrial = localStorage.getItem('voice_trial_count');
    if (savedVoiceTrial) setVoiceTrialCount(parseInt(savedVoiceTrial, 10));

    const name = loadedUser?.username || (loadedUser?.email ? loadedUser.email.split('@')[0] : 'sayang');
    const initialGreeting = `Halo ${name}, haha Saya SukaChub virtual chat yang akan menemani kamu, merindukan kehangatan dan kehadiran kamu.`;
    const initialMsg: Message = { role: 'assistant', content: initialGreeting };

    setMessages([initialMsg]);
    setIsInitialized(true);
    setIsWelcomeBubble(true);
  }, []);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const avatarContainerRef = useRef<HTMLDivElement | null>(null);

  const videoIdleRef = useRef<HTMLVideoElement | null>(null);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoKepalaRef = useRef<HTMLVideoElement | null>(null);
  const videoPelukRef = useRef<HTMLVideoElement | null>(null);
  const videoMarahRef = useRef<HTMLVideoElement | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isSpeaking = playingIndex !== null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(event.target as Node)) setIsVoiceDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTimeQuestion = (text: string): boolean => {
    const timeKeywords = ['hari ini', 'hari apa', 'tanggal berapa', 'jam berapa', 'waktu', 'pukul', 'jam', 'hari', 'tanggal', 'bulan', 'tahun', 'hr ini', 'hr apa', 'tgl berapa', 'j berapa', 'tgl', 'tanggal', 'jam', 'pukul', 'waktu'];
    const lowerText = text.toLowerCase();
    return timeKeywords.some(keyword => lowerText.includes(keyword));
  };

  const getLocalTimeResponse = (): string => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `Hari ini ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, jam ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}, ${getUserName()}. Ada yang bisa aku bantu?`;
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const switchVideo = (activeVideoRef: RefObject<HTMLVideoElement | null>) => {
    [videoIdleRef, videoARef, videoKepalaRef, videoPelukRef, videoMarahRef].forEach((ref) => {
      if (ref.current && ref.current !== activeVideoRef?.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    if (activeVideoRef?.current && activeVideoRef.current.paused) {
      activeVideoRef.current.currentTime = 0;
      activeVideoRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (activeReaction === 'marah' || activeReaction === 'kepala') switchVideo(videoMarahRef);
    else if (activeReaction === 'perut' || activeReaction === 'peluk') switchVideo(videoPelukRef);
    else if (activeReaction === 'kaki') switchVideo(videoKepalaRef);
    else if (isSpeaking) switchVideo(videoARef);
    else switchVideo(videoIdleRef);
  }, [activeReaction, isSpeaking]);

  const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text.replace(/i'm sorry|im sorry|sorry|maaf/gi, 'Maaf').replace(/\s+/g, ' ').trim();
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const stopAudio = () => {
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null; }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsAudioRendering(false);
    setPlayingIndex(null);
  };

  const startSyncSpeechAndTyping = async (text: string, index: number) => {
    if (!text) return;
    setIsWelcomeBubble(false);
    stopAudio();

    const cleanText = sanitizeText(text).replace(/\[Error:.*?\]/g, '').replace(/[*_#]/g, '').trim();
    if (!cleanText) return;

    setDisplayedStatusText(cleanText);
    setIsAudioRendering(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: selectedVoice }), signal: controller.signal,
      });
      if (!res.ok) throw new Error('TTS Failed');
      const blob = await res.blob();
      if (blob.size === 0) throw new Error('Audio Empty');

      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;

      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaElementSource(audio);
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 1.5;

        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
      } catch (e) {
        console.warn('Web Audio API Gain Node fallback:', e);
      }

      audio.onplay = () => {
        setIsAudioRendering(false);
        setPlayingIndex(index);
      };

      audio.onended = () => {
        stopAudio();
      };
      audio.onerror = () => {
        stopAudio();
      };

      await audio.play();
    } catch {
      setIsAudioRendering(false);
      stopAudio();
    }
  };

  const handleChatMessageClick = (msg: Message, index: number) => {
    setIsWelcomeBubble(false);
    setActiveSingleIndex(index);
    startSyncSpeechAndTyping(msg.content, index);
  };

  const handleBubbleSpeakerClick = () => {
    if (isSpeaking) {
      stopAudio();
    } else {
      const currentText = displayedStatusText || (messages.length > 0 ? messages[messages.length - 1].content : '');
      if (currentText) startSyncSpeechAndTyping(currentText, activeSingleIndex ?? 0);
    }
  };

  const triggerReactionByPart = (part: 'kepala' | 'perut' | 'kaki') => {
    if (part === 'kepala') {
      setActiveReaction('marah');
      startSyncSpeechAndTyping('Aduh! Jangan pegang-pegang kepala dong!', 0);
    } else if (part === 'perut') {
      setActiveReaction('perut');
      startSyncSpeechAndTyping('Haha geli banget! Perut buncitku jadi goyang!', 0);
    } else if (part === 'kaki') {
      setActiveReaction('kaki');
      startSyncSpeechAndTyping('Eh? Kenapa kamu pegang-pegang kakiku?', 0);
    }
  };

  const handleAvatarSingleClick = (part: 'kepala' | 'perut' | 'kaki', e: React.MouseEvent) => {
    if (avatarContainerRef.current) {
      const rect = avatarContainerRef.current.getBoundingClientRect();
      const id = Date.now();
      setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    }
    triggerReactionByPart(part);
  };

  const handleClearChat = () => {
    stopAudio();
    const initialGreeting = `Halo ${getUserName()}, haha Saya SukaChub virtual chat yang akan menemani kamu, merindukan kehangatan dan kehadiran kamu.`;
    const initialMsg: Message = { role: 'assistant', content: initialGreeting };
    setMessages([initialMsg]);
    setActiveSingleIndex(null);

    if (autoVoice) {
      startSyncSpeechAndTyping(initialGreeting, 0);
    } else {
      setIsWelcomeBubble(true);
      setDisplayedStatusText('');
    }
  };

  const handleRemoveSingleMessage = (indexToRemove: number) => {
    stopAudio();
    setMessages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (activeSingleIndex === indexToRemove) setActiveSingleIndex(null);
    setDisplayedStatusText('');
  };

  const startRecording = async () => {
    if (!userProfile) {
      if (voiceTrialCount >= 2) { router.push('/login'); return; }
    }
    if (loading || isRecording) return;
    stopAudio();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { alert("Akses mic diblokir atau tidak didukung!"); return; }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        if (audioBlob.size === 0) return;
        const formData = new FormData();
        formData.append('file', audioBlob);
        setLoading(true);
        try {
          const res = await fetch('/api/stt', { method: 'POST', body: formData });
          const data = await res.json();
          if (res.ok && data.text) {
            if (!userProfile) {
              const newVoiceCount = voiceTrialCount + 1;
              setVoiceTrialCount(newVoiceCount);
              localStorage.setItem('voice_trial_count', newVoiceCount.toString());
            }
            handleSend(data.text);
          }
        } catch (err) { console.error('STT Error:', err); }
        finally { setLoading(false); }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) { alert("Izin mic ditolak!"); console.error('Akses mikrofon ditolak:', err); }
  };

  const stopRecording = (cancel = false) => {
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        mediaRecorderRef.current.onstop = () => {
          if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
        };
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePillClick = (presetKey: string) => {
    const name = getUserName();

    if (isSingleChat) {
      const userMsg: Message = { role: 'user', content: presetKey };
      const updatedMessages = [...messages, userMsg];
      const newIdx = updatedMessages.length - 1;
      setMessages(updatedMessages);
      setActiveSingleIndex(newIdx);
      startSyncSpeechAndTyping(presetKey, newIdx);
      return;
    }

    if (presetKey === 'Hari apa?' || presetKey === 'tgl berapa?') {
      const reply = TRIAL_PRESETS['tgl berapa?'].reply(name);
      const userMsg: Message = { role: 'user', content: 'tgl berapa?' };
      const aiMsg: Message = { role: 'assistant', content: reply };
      const updatedMessages = [...messages, userMsg, aiMsg];
      setMessages(updatedMessages);
      if (autoVoice) startSyncSpeechAndTyping(reply, updatedMessages.length - 1);
      return;
    }

    if (userProfile) { handleSend(presetKey); return; }
    if (textTrialCount >= 2) { router.push('/login'); return; }
    const preset = TRIAL_PRESETS[presetKey];
    if (!preset) return;

    const newTextTrialCount = textTrialCount + 1;
    setTextTrialCount(newTextTrialCount);
    localStorage.setItem('text_trial_count', newTextTrialCount.toString());

    const userMsg: Message = { role: 'user', content: presetKey };
    const cleanedReply = sanitizeText(preset.reply(name));
    const aiMsg: Message = { role: 'assistant', content: cleanedReply };

    const updatedMessages = [...messages, userMsg, aiMsg];
    setMessages(updatedMessages);

    if (autoVoice) {
      startSyncSpeechAndTyping(cleanedReply, updatedMessages.length - 1);
    } else {
      setIsWelcomeBubble(false);
      setDisplayedStatusText(cleanedReply);
    }
  };

  const handleSend = async (textToSend?: string) => {
    if (!userProfile) {
      if (textTrialCount >= 2) { router.push('/login'); return; }
      const newTextTrialCount = textTrialCount + 1;
      setTextTrialCount(newTextTrialCount);
      localStorage.setItem('text_trial_count', newTextTrialCount.toString());
    }

    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: query };

    if (isSingleChat) {
      const updatedMessages = [...messages, userMsg];
      const newIdx = updatedMessages.length - 1;
      setMessages(updatedMessages);
      setActiveSingleIndex(newIdx);
      if (!textToSend) setInput('');
      startSyncSpeechAndTyping(query, newIdx);
      return;
    }

    if (isTimeQuestion(query)) {
      if (!textToSend) setInput('');
      const timeReply = getLocalTimeResponse();
      const aiMsg: Message = { role: 'assistant', content: timeReply };
      const updatedMessages = [...messages, userMsg, aiMsg];
      setMessages(updatedMessages);

      if (autoVoice) {
        startSyncSpeechAndTyping(timeReply, updatedMessages.length - 1);
      } else {
        setIsWelcomeBubble(false);
        setDisplayedStatusText(timeReply);
      }
      return;
    }

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), userName: getUserName() }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        if (data.remainingTokens) setRemainingTokens(data.remainingTokens);
        if (data.model) setActiveModel(data.model);
        const cleanedReply = sanitizeText(data.reply);
        const aiMsg: Message = { role: 'assistant', content: cleanedReply };
        const updatedMessages = [...newMessages, aiMsg];
        setMessages(updatedMessages);

        if (autoVoice) {
          startSyncSpeechAndTyping(cleanedReply, updatedMessages.length - 1);
        } else {
          setIsWelcomeBubble(false);
          setDisplayedStatusText(cleanedReply);
        }
      } else {
        const errorMsg = `Maaf ${getUserName()}, ada masalah teknis: ${data.error || 'Gagal tersambung.'}`;
        setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        setIsWelcomeBubble(false);
        setDisplayedStatusText(errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = `Maaf ${getUserName()}, koneksi terputus (${err instanceof Error ? err.message : 'Unknown error'})`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      setIsWelcomeBubble(false);
      setDisplayedStatusText(errorMsg);
    } finally { setLoading(false); }
  };

  const handleAuthAction = () => {
    if (userProfile) { localStorage.removeItem('user'); setUserProfile(null); router.push('/login'); }
    else router.push('/login');
  };

  const activeVoiceObj = VOICE_OPTIONS.find((v) => v.id === selectedVoice) || VOICE_OPTIONS[0];

  return (
    <div className={styles.container}>
      <Header
        isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} userProfile={userProfile}
        userName={getUserName()} activeModel={activeModel} remainingTokens={remainingTokens}
        isMobile={isMobile} handleAuthAction={handleAuthAction} menuRef={menuRef}
      />

      <div className={styles.mainContent}>
        <div className={styles.chatSection}>
          <div className={styles.chatBox}>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isSelectedActive = activeSingleIndex === index;

              return (
                <div 
                  key={index} 
                  className={styles.messageWrapper} 
                  style={{ justifyContent: isSingleChat ? 'flex-start' : (isUser ? 'flex-end' : 'flex-start') }}
                >
                  <SwipeableMessage onDelete={() => handleRemoveSingleMessage(index)}>
                    <div 
                      onClick={() => handleChatMessageClick(msg, index)}
                      className={`${styles.futuristicHudFrame} ${
                        isUser ? styles.userHudFrame : styles.aiHudFrame
                      } ${isSelectedActive ? styles.orangeOutlineGlow : ''}`}
                      title="Klik untuk putar suara / Geser Kiri-Kanan untuk hapus"
                    >
                      <SciFiHudDecoration isUser={isUser} />
                      
                      <div className={styles.hudInnerContent}>
                        <div className={isUser && !isSingleChat ? styles.roleHeaderRight : styles.roleHeader}>
                          <span className={styles.orangeBrightLabelText}>
                            {isUser ? getUserName() : 'SukaChub Virtual Chat'}
                          </span>
                        </div>
                        <div className={styles.textContent}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  </SwipeableMessage>
                </div>
              );
            })}

            {loading && (
              <div className={styles.messageWrapper} style={{ justifyContent: 'flex-start' }}>
                <div className={`${styles.futuristicHudFrame} ${styles.aiHudFrame}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SciFiHudDecoration isUser={false} />
                  <div className={styles.hudInnerContent} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={styles.loadingDots}><span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} /></div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>MEMPROSES DATA...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        <div className={`${styles.avatarSection} ${isMobile ? styles.avatarSectionMobile : ''}`}>
          {/* Status Ava dalam Frame HUD Futuristic Orange Hitam Sesuai Referensi Gambar */}
          <div className={styles.dynamicStatusBubbleFixedHud}>
            <SciFiHudDecoration isUser={false} />

            <div className={styles.hudInnerContentBox}>
              {/* Header Info Status */}
              <div className={styles.bubbleStatusHeader}>
                <span className={styles.idlePromptText}>
                  <strong style={{ color: autoVoice ? '#f97316' : '#a1a1aa' }}>
                    AUTO VOICE {autoVoice ? 'ON' : 'OFF'}
                  </strong>
                  {' — '}{autoVoice ? 'Balasan otomatis diputar.' : 'Sentuh balon chat untuk mendengarkan.'}
                </span>
              </div>

              <div className={styles.dynamicDividerLine} />

              {/* 1. Teks Berjalan Horisontal */}
              <div className={styles.marqueeContainer}>
                <div className={styles.marqueeText}>
                  {displayedStatusText || 'Selamat datang di SukaChub Virtual Chat! Balasan chat akan muncul di sini...'}
                </div>
              </div>

              {/* 2. Visualizer Spektrum di Tengah */}
              <div className={styles.centerVisualizerBox}>
                <span className={styles.visDot} />
                <span className={styles.visDot} />
                <span className={`${styles.visBar} ${isSpeaking ? styles.visBarActive : ''}`} style={{ height: '10px' }} />
                <span className={`${styles.visBar} ${isSpeaking ? styles.visBarActive : ''}`} style={{ height: '16px', animationDelay: '-0.2s' }} />
                <span className={`${styles.visBar} ${isSpeaking ? styles.visBarActive : ''}`} style={{ height: '22px', animationDelay: '-0.4s' }} />
                <span className={`${styles.visBar} ${isSpeaking ? styles.visBarActive : ''}`} style={{ height: '14px', animationDelay: '-0.1s' }} />
                <span className={`${styles.visBar} ${isSpeaking ? styles.visBarActive : ''}`} style={{ height: '18px', animationDelay: '-0.3s' }} />
                <span className={styles.visDot} />
                <span className={styles.visDot} />
              </div>

              {/* Area Bawah: 3. Loading Dots & 4. Speaker Rounded */}
              <div className={styles.bubbleBottomControls}>
                {/* 3. Loading Dots Render Suara */}
                <div className={styles.loadingAudioDots}>
                  <span className={`${styles.loadDot} ${isAudioRendering ? styles.loadDotActive : ''}`} />
                  <span className={`${styles.loadDot} ${isAudioRendering ? styles.loadDotActive : ''}`} style={{ animationDelay: '-0.2s' }} />
                  <span className={`${styles.loadDot} ${isAudioRendering ? styles.loadDotActive : ''}`} style={{ animationDelay: '-0.4s' }} />
                </div>

                {/* 4. Speaker Rounded Double-Circle (On/Off Dinamis) */}
                <button
                  type="button"
                  onClick={handleBubbleSpeakerClick}
                  className={`${styles.roundedSpeakerBtn} ${isSpeaking ? styles.roundedSpeakerActive : ''}`}
                  title="Dengarkan Suara / Hentikan"
                >
                  <div className={styles.roundedSpeakerBtnInner}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      {isSpeaking && (
                        <>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </>
                      )}
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <div className={styles.speechTailDinamis} />
          </div>

          <div ref={avatarContainerRef} className={styles.avatarContainer} onContextMenu={(e) => e.preventDefault()}>
            <div className={styles.hitboxHead} title="Sentuh Kepala (Marah)" onClick={(e) => handleAvatarSingleClick('kepala', e)} />
            <div className={styles.hitboxBelly} title="Sentuh Perut (Goyang)" onClick={(e) => handleAvatarSingleClick('perut', e)} />
            <div className={styles.hitboxLegs} title="Sentuh Kaki (Bingung)" onClick={(e) => handleAvatarSingleClick('kaki', e)} />

            {ripples.map((r) => (<span key={r.id} className={styles.asmrRipple} style={{ left: `${r.x}px`, top: `${r.y}px` }} />))}

            <video ref={videoIdleRef} src="/D.webm" autoPlay muted loop playsInline preload="auto" className={styles.avatarVideo} style={{ opacity: !isSpeaking && !activeReaction ? 1 : 0 }} />
            <video ref={videoARef} src="/A.webm" muted loop playsInline preload="auto" className={styles.avatarVideo} style={{ opacity: isSpeaking && !activeReaction ? 1 : 0 }} />
            <video ref={videoMarahRef} src="/Marah.webm" muted playsInline preload="auto" onEnded={() => setActiveReaction(null)} className={styles.avatarVideo} style={{ opacity: activeReaction === 'marah' ? 1 : 0 }} />
            <video ref={videoPelukRef} src="/Peluk.webm" muted playsInline preload="auto" onEnded={() => setActiveReaction(null)} className={styles.avatarVideo} style={{ opacity: activeReaction === 'peluk' || activeReaction === 'perut' ? 1 : 0 }} />
            <video ref={videoKepalaRef} src="/Kepala.webm" muted playsInline preload="auto" onEnded={() => setActiveReaction(null)} className={styles.avatarVideo} style={{ opacity: activeReaction === 'kepala' || activeReaction === 'kaki' ? 1 : 0 }} />
          </div>

          <div className={styles.avatarTouchGridBottom}>
            <span className={styles.gridGuideLabel}>Sentuh Ava:</span>
            <div className={styles.gridGuideGroupSkewed}>
              <button
                type="button"
                onClick={() => triggerReactionByPart('kepala')}
                className={`${styles.futuristicHudBtn} ${activeReaction === 'marah' || activeReaction === 'kepala' ? styles.activeOrangeHud : ''}`}
              >
                Kepala
              </button>
              <button
                type="button"
                onClick={() => triggerReactionByPart('perut')}
                className={`${styles.futuristicHudBtn} ${activeReaction === 'perut' || activeReaction === 'peluk' ? styles.activeOrangeHud : ''}`}
              >
                Badan
              </button>
              <button
                type="button"
                onClick={() => triggerReactionByPart('kaki')}
                className={`${styles.futuristicHudBtn} ${activeReaction === 'kaki' ? styles.activeOrangeHud : ''}`}
              >
                Kaki
              </button>
            </div>
          </div>

          <div className={styles.bottomVoiceControlPanel}>
            <div className={styles.customVoiceDropdownWrapper} ref={voiceMenuRef}>
              <button
                type="button"
                onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                className={styles.futuristicVoiceBtn}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{activeVoiceObj.label}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isVoiceDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {isVoiceDropdownOpen && (
                <div className={styles.voiceTailPopover}>
                  {VOICE_OPTIONS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVoice(v.id);
                        setIsVoiceDropdownOpen(false);
                      }}
                      className={`${styles.voiceOptionItem} ${selectedVoice === v.id ? styles.voiceOptionSelected : ''}`}
                    >
                      <span>{v.label}</span>
                      {selectedVoice === v.id && <span className={styles.orangeDotGlow} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="button" 
              disabled={isSingleChat}
              onClick={() => {
                if (isSingleChat) return;
                const nextState = !autoVoice;
                setAutoVoice(nextState);
                if (!nextState) setDisplayedStatusText('');
              }} 
              className={`${styles.futuristicAutoVoiceBtn} ${
                autoVoice ? styles.futuristicAutoVoiceActive : styles.futuristicAutoVoiceInactive
              } ${isSingleChat ? styles.disabledAutoVoiceBtn : ''}`}
              title={isSingleChat ? "Auto Voice selalu aktif di Mode Single Chat" : "Toggle Auto Voice"}
            >
              {autoVoice ? 'AUTO VOICE ON' : 'AUTO VOICE OFF'}
            </button>
          </div>
        </div>
      </div>

      <InputSection
        input={input}
        setInput={setInput}
        userProfile={userProfile}
        textTrialCount={textTrialCount}
        voiceTrialCount={voiceTrialCount}
        loading={loading}
        isTyping={false}
        isRecording={isRecording}
        isInitialized={isInitialized}
        trialPresets={TRIAL_PRESETS}
        isSingleChat={isSingleChat}
        setIsSingleChat={setIsSingleChat}
        handleSend={handleSend}
        handleClearChat={handleClearChat}
        handlePillClick={handlePillClick}
        startRecording={startRecording}
        stopRecording={stopRecording}
      />
    </div>
  );
}