'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

// --- TRIAL PRESETS ---
const TRIAL_PRESETS = {
  'Peluk boleh?': {
    reply: 'Boleh sayang, sini saya peluk erat kamu dengan sepenuh jiwa raga.',
    emotion: 'romantic',
  },
  'Temani saya mengobrol': {
    reply: 'Baik, saya akan mengobrol dengan kamu,',
    emotion: 'neutral',
  },
  'Coba kata kasar': {
    reply: 'Kamu. Jangan kasar ya. no no no ,ya.',
    emotion: 'angry',
  },
};

// --- EMOTION LOGIC ---
const ROMANTIC_WORDS = [
  'peluk', 'pelukan', 'memeluk', 'cium', 'ciuman', 'mencium', 'sayang', 'sayangku',
  'hangat', 'kehangatan', 'cinta', 'rindu', 'kangen', 'manja', 'gemas', 'belai',
  'merindukan', 'menyayangi', 'kasih', 'dekap', 'babe', 'honey', 'sweetheart', 
  'mesra', 'romantis', 'indah', 'candu'
];

const ROMANTIC_PHRASES = [
  'aku sayang kamu', 'aku cinta kamu', 'aku rindu kamu', 'aku kangen kamu',
  'sayangku', 'cintaku', 'peluk aku', 'peluk saya', 'manja aku', 
  'kangen banget', 'rindu banget', 'mesra ya', 'candu banget'
];

const HARSH_WORDS = [
  'bodoh', 'bego', 'tolol', 'idiot', 'gila', 'kasar', 'jelek', 'babi', 'anjing',
  'bangsat', 'sialan', 'bajingan', 'jancok', 'jancuk', 'mampus', 'setan', 'iblis',
  'bacot', 'pantek', 'kontol', 'memek', 'pepek', 'ngentot', 'goblok', 'bebal',
  'ngentod', 'tai', 'kampret', 'brengsek'
];

const NEGATION_WORDS = ['tidak', 'bukan', 'jangan', 'nggak', 'enggak', 'tak', 'kurang', 'tanpa', 'ga usah', 'jgn'];
const MODERATION_PHRASES = ['sopan', 'bahasa seperti itu', 'tidak dapat melanjutkan', 'permintaan tersebut'];

const detectEmotion = (text = '', userText = '') => {
  if (!text && !userText) return 'neutral';
  
  const combinedText = `${text} ${userText}`.toLowerCase().replace(/[.,!?;:]/g, '');
  const words = combinedText.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    if (HARSH_WORDS.includes(words[i])) {
      const prevWords = words.slice(Math.max(0, i - 2), i);
      const isNegated = prevWords.some(w => NEGATION_WORDS.includes(w));
      if (!isNegated) return 'angry';
    }
  }

  const lowerAIText = text.toLowerCase();
  if (MODERATION_PHRASES.some(phrase => lowerAIText.includes(phrase))) {
    return 'angry';
  }

  const hasRomanticPhrase = ROMANTIC_PHRASES.some(phrase => combinedText.includes(phrase));
  let romanticWordCount = 0;
  ROMANTIC_WORDS.forEach(word => {
    if (combinedText.includes(word)) romanticWordCount++;
  });

  if (hasRomanticPhrase || romanticWordCount >= 2) {
    return 'romantic'; 
  }

  return 'neutral'; 
};

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [trialCount, setTrialCount] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUserProfile(JSON.parse(userData));
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
  }, []);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('spruce');
  const [autoVoice, setAutoVoice] = useState(true);
  const [remainingTokens, setRemainingTokens] = useState(null);
  const [emotion, setEmotion] = useState('neutral');
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [displayMessages, setDisplayMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);
  const [typingText, setTypingText] = useState('');

  const [inputDisabled, setInputDisabled] = useState(true);

  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const menuRef = useRef(null);
  
  const videoIdleRef = useRef(null);
  const videoARef = useRef(null);
  const videoA0Ref = useRef(null);
  const videoHRef = useRef(null);
  const videoMRef = useRef(null);
  
  const abortControllerRef = useRef(null);

  const isSpeaking = playingIndex !== null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTimeQuestion = (text) => {
    const timeKeywords = [
      'hari ini', 'hari apa', 'tanggal berapa', 'jam berapa', 'waktu', 
      'pukul', 'jam', 'hari', 'tanggal', 'bulan', 'tahun',
      'hr ini', 'hr apa', 'tgl berapa', 'j berapa',
      'tgl', 'tanggal', 'jam', 'pukul', 'waktu'
    ];
    const lowerText = text.toLowerCase();
    return timeKeywords.some(keyword => lowerText.includes(keyword));
  };

  const getLocalTimeResponse = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `Hari ini ${dayName}, ${date} ${monthName} ${year}, jam ${hours}.${minutes} sayang. Ada yang bisa aku bantu?`;
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- SMOOTH VIDEO TRANSITION ---
  const switchVideo = (activeVideoRef) => {
    const allVideos = [
      { ref: videoIdleRef, name: 'idle' },
      { ref: videoARef, name: 'A' },
      { ref: videoA0Ref, name: 'A0' },
      { ref: videoHRef, name: 'H' },
      { ref: videoMRef, name: 'M' }
    ];

    allVideos.forEach(({ ref }) => {
      if (ref.current) {
        ref.current.pause();
        if (ref.current !== activeVideoRef?.current) {
          ref.current.currentTime = 0;
        }
      }
    });

    if (activeVideoRef?.current) {
      activeVideoRef.current.currentTime = 0;
      activeVideoRef.current.play().catch(() => {});
    }
  };

  // --- VIDEO CONTROL WITH SMOOTH TRANSITION ---
  useEffect(() => {
    if (isSpeaking) {
      switchVideo(videoARef);
    } else if (isTyping) {
      if (emotion === 'romantic') {
        switchVideo(videoHRef);
      } else if (emotion === 'angry') {
        switchVideo(videoMRef);
      } else {
        switchVideo(videoA0Ref);
      }
    } else {
      switchVideo(videoIdleRef);
    }
  }, [isSpeaking, isTyping, emotion]);

  useEffect(() => {
    const initialGreeting = 'Hai, Perkenalkan , Saya SukaChub virtual chat yang akan menemani kamu , merindukan kehangatan dan kehadiran kamu.';
    const initialMsg = { role: 'assistant', content: initialGreeting, isTyping: false };
    setMessages([initialMsg]);
    setDisplayMessages([initialMsg]);
    
    const initialEmotion = detectEmotion(initialGreeting);
    setEmotion(initialEmotion);
    
    setInputDisabled(true);

    if (!autoVoice) {
      setInputDisabled(false);
    } else {
      setTimeout(() => {
        if (autoVoice) speakText(initialGreeting, 0);
      }, 500);
    }

    return () => {
      stopAudio();
      clearTimeout(typingTimeoutRef.current);
    };
  }, []);

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
    clearTimeout(typingTimeoutRef.current);
    
    const initialGreeting = 'Hai, Perkenalkan , Saya SukaChub virtual chat yang akan menemani kamu , merindukan kehangatan dan kehadiran kamu.';
    const initialMsg = { role: 'assistant', content: initialGreeting, isTyping: false };
    setMessages([initialMsg]);
    setDisplayMessages([initialMsg]);
    setTypingText('');
    
    const initialEmotion = detectEmotion(initialGreeting);
    setEmotion(initialEmotion);
    
    setInputDisabled(true);
    if (autoVoice) {
      setTimeout(() => speakText(initialGreeting, 0), 300);
    } else {
      setInputDisabled(false);
    }
  };

  // --- TYPING EFFECT WITH AUDIO SYNC (NO EMOJI) ---
  const typeMessageWithAudio = async (fullText, messageIndex, userQuery = '', forcedEmotion = null) => {
    // 1. Tampilkan teks penuh dulu
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

    // 2. Set emotion untuk video
    const currentEmotion = forcedEmotion || detectEmotion(fullText, userQuery);
    setEmotion(currentEmotion);

    // 3. Generate audio di background
    if (autoVoice) {
      try {
        const cleanText = fullText.replace(/\[Error:.*?\]/g, '').replace(/[*_#]/g, '').trim();
        if (!cleanText) {
          if (messageIndex === 0) setInputDisabled(false);
          return;
        }

        // Fetch audio
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

        // Play audio & mulai typing effect bersamaan
        audio.onplay = () => {
          setPlayingIndex(messageIndex);
          
          // Mulai typing effect SELARAS dengan audio
          startTypingEffect(fullText, messageIndex);
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
                content: fullText,
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
    } else {
      // Mode tanpa audio
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
      if (messageIndex === 0) {
        setInputDisabled(false);
      }
    }
  };

  // --- TYPING EFFECT (dipanggil dari audio.onplay) ---
  const startTypingEffect = (fullText, messageIndex) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsTyping(true);
    setTypingMessageIndex(messageIndex);
    setTypingText('');

    // Reset display ke kosong dulu
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

  // --- SPEAK TEXT (untuk initial greeting & manual play) ---
  const speakText = async (text, index, customUserText = null) => {
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

    const cleanText = text.replace(/\[Error:.*?\]/g, '').replace(/[*_#]/g, '').trim();
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
    } catch (err) {
      if (err.name !== 'AbortError') {
        stopAudio();
        if (targetIndex === 0 && autoVoice) {
          setInputDisabled(false);
        }
      }
    }
  };

  const handlePillClick = (presetKey) => {
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

    const userMsg = { role: 'user', content: presetKey, isTyping: false };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setDisplayMessages(prev => [...prev, userMsg]);

    const aiMsg = { role: 'assistant', content: '', isTyping: true };
    const updatedMessages = [...newMessages, { role: 'assistant', content: preset.reply }];
    setMessages(updatedMessages);

    const displayIndex = updatedMessages.length - 1;
    setDisplayMessages(prev => [...prev, aiMsg]);

    typeMessageWithAudio(preset.reply, displayIndex, presetKey, preset.emotion);
  };

  const handleSend = async (textToSend) => {
    if (!userProfile) {
      if (trialCount >= 3) {
        router.push('/login');
      }
      return;
    }

    const query = textToSend || input;
    if (!query.trim() || loading || isTyping || inputDisabled) return;

    if (isTimeQuestion(query)) {
      const userMsg = { role: 'user', content: query, isTyping: false };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setDisplayMessages(prev => [...prev, userMsg]);
      if (!textToSend) setInput('');
      
      const timeReply = getLocalTimeResponse();
      const aiMsg = { role: 'assistant', content: timeReply, isTyping: false };
      setMessages(prev => [...prev, { role: 'assistant', content: timeReply }]);
      setDisplayMessages(prev => [...prev, aiMsg]);
      
      if (autoVoice) speakText(timeReply, newMessages.length);
      return;
    }

    const userMsg = { role: 'user', content: query, isTyping: false };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setDisplayMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        if (data.remainingTokens) setRemainingTokens(data.remainingTokens);
        
        const aiMsg = { role: 'assistant', content: '', isTyping: true };
        const updatedMessages = [...newMessages, { role: 'assistant', content: data.reply }];
        setMessages(updatedMessages);
        
        const displayIndex = updatedMessages.length - 1;
        setDisplayMessages(prev => [...prev, aiMsg]);
        
        typeMessageWithAudio(data.reply, displayIndex, query);
        
      } else {
        const errorMsg = `Error: ${data.error || 'Gagal tersambung.'}`;
        setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        setDisplayMessages(prev => [...prev, { role: 'assistant', content: errorMsg, isTyping: false }]);
        setLoading(false);
      }
    } catch (err) {
      const errorMsg = `Error Network: ${err.message}`;
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
              {userProfile 
                ? (userProfile.username || userProfile.email || 'User') 
                : 'Belum Login'}
            </span>
          </div>

          {userProfile && remainingTokens !== null && !isMobile && (
            <span style={styles.tokenBadge}>
              {Number(remainingTokens).toLocaleString('id-ID')} Tkn
            </span>
          )}
        </div>

        <div style={styles.voiceControlGroup}>
          <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} style={styles.voiceSelect}>
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
        <div style={styles.avatarLayer}>
          <div style={styles.avatarContainer}>
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
                opacity: !isSpeaking && !isTyping ? 1 : 0,
              }}
            />
            <video
              ref={videoA0Ref}
              src="/A0.webm"
              muted
              loop
              playsInline
              preload="auto"
              style={{
                ...styles.avatarVideo,
                opacity: isTyping && emotion === 'neutral' ? 1 : 0,
              }}
            />
            <video
              ref={videoHRef}
              src="/H.webm"
              muted
              loop
              playsInline
              preload="auto"
              style={{
                ...styles.avatarVideo,
                opacity: isTyping && emotion === 'romantic' ? 1 : 0,
              }}
            />
            <video
              ref={videoMRef}
              src="/M.webm"
              muted
              loop
              playsInline
              preload="auto"
              style={{
                ...styles.avatarVideo,
                opacity: isTyping && emotion === 'angry' ? 1 : 0,
              }}
            />
            <video
              ref={videoARef}
              src="/A.webm"
              muted
              loop
              playsInline
              preload="auto"
              style={{
                ...styles.avatarVideo,
                opacity: isSpeaking ? 1 : 0,
              }}
            />
          </div>
        </div>

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
                      ? (userProfile?.username || userProfile?.email || 'User') 
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

      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={styles.inputContainer}>
        {userProfile && (
          <button type="button" onClick={handleClearChat} style={styles.clearButton}>
            Hapus
          </button>
        )}
        
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              !userProfile
                ? trialCount < 3 
                  ? `Trial ${3 - trialCount}/3 (Klik tombol saran di atas)...` 
                  : "Trial habis. Silakan login..."
                : inputDisabled 
                  ? "Tunggu AI selesai bicara..." 
                  : "Ketik pesan hangat..."
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
const styles = {
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
  },
  avatarVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transition: 'opacity 0.4s ease-in-out',
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
  },
  topSpacer: {
    minHeight: 'clamp(180px, 35vh, 240px)',
    flexShrink: 0,
  },
  messageWrapper: { display: 'flex', width: '100%' },
  bubble: {
    maxWidth: '88%',
    padding: '10px 14px',
    borderRadius: '18px',
    fontSize: 'clamp(0.82rem, 2.5vw, 0.9rem)',
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