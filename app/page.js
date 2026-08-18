'use client';
import { useState, useRef, useEffect } from 'react';

// --- ICONS ---
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

// --- LOGIKA EMOSI ---
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('spruce');
  const [autoVoice, setAutoVoice] = useState(true);
  const [remainingTokens, setRemainingTokens] = useState(null);
  const [emotion, setEmotion] = useState('neutral');

  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  
  const videoRef = useRef(null);
  const videoIdleRef = useRef(null);
  const videoRomanticRef = useRef(null);
  const videoAngryRef = useRef(null);
  
  const abortControllerRef = useRef(null);

  const isSpeaking = playingIndex !== null;

  useEffect(() => {
    if (isSpeaking) {
      videoIdleRef.current?.pause();
    } else {
      videoIdleRef.current?.play().catch(() => {});
      
      [videoRef, videoRomanticRef, videoAngryRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    }
  }, [isSpeaking]);

  useEffect(() => {
    const initialGreeting = 'Sini mendekat ke pelukan saya, sayang. Saya merindukan kehangatan dan kehadiran kamu.';
    setMessages([{ role: 'assistant', content: initialGreeting }]);
    if (autoVoice) speakText(initialGreeting, 0);

    return () => stopAudio();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

    [videoRef, videoRomanticRef, videoAngryRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });

    setPlayingIndex(null);
  };

  const handleClearChat = () => {
    stopAudio();
    const initialGreeting = 'Sini mendekat ke pelukan saya, sayang. Saya merindukan kehangatan dan kehadiran kamu.';
    setMessages([{ role: 'assistant', content: initialGreeting }]);
    if (autoVoice) speakText(initialGreeting, 0);
  };

  const speakText = async (text, index, customUserText = null) => {
    if (!text) return;

    if (playingIndex === index) {
      stopAudio();
      return;
    }

    stopAudio();
    const cleanText = text.replace(/\[Error:.*?\]/g, '').replace(/[*_#]/g, '').trim();
    if (!cleanText) return;

    setPlayingIndex(index);
    
    const userTextContext = customUserText !== null 
      ? customUserText 
      : (index > 0 && messages[index - 1]?.role === 'user' ? messages[index - 1].content : '');

    const currentEmotion = detectEmotion(cleanText, userTextContext);
    setEmotion(currentEmotion);

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

      const getActiveVideoRef = () => {
        if (currentEmotion === 'romantic') return videoRomanticRef;
        if (currentEmotion === 'angry') return videoAngryRef;
        return videoRef;
      };

      audio.onplay = () => {
        const activeVideo = getActiveVideoRef();
        if (activeVideo.current) {
          activeVideo.current.playbackRate = audio.playbackRate || 1.0;
          activeVideo.current.play().catch(() => {});
        }
      };

      audio.onratechange = () => {
        const activeVideo = getActiveVideoRef();
        if (activeVideo.current) {
          activeVideo.current.playbackRate = audio.playbackRate;
        }
      };

      audio.onended = () => stopAudio();
      audio.onerror = () => stopAudio();

      await audio.play();
    } catch (err) {
      if (err.name !== 'AbortError') {
        stopAudio();
      }
    }
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
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
        const updatedMessages = [...newMessages, { role: 'assistant', content: data.reply }];
        const newIndex = updatedMessages.length - 1;
        setMessages(updatedMessages);
        if (autoVoice) speakText(data.reply, newIndex, query);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Gagal tersambung.'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error Network: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTitleGroup}>
          <div style={styles.statusDot} />
          <h1 style={styles.title}>SukaChub Virtual Chat</h1>
          {remainingTokens !== null && (
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
            <span>{autoVoice ? 'ON' : 'OFF'}</span>
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
              style={{
                ...styles.avatarVideo,
                opacity: !isSpeaking ? 1 : 0, 
              }}
            />
            <video
              ref={videoRef}
              src="/A.webm"
              muted
              loop
              playsInline
              style={{
                ...styles.avatarVideo,
                opacity: (isSpeaking && emotion === 'neutral') ? 1 : 0, 
              }}
            />
            <video
              ref={videoRomanticRef}
              src="/H.webm"
              muted
              loop
              playsInline
              style={{
                ...styles.avatarVideo,
                opacity: (isSpeaking && emotion === 'romantic') ? 1 : 0, 
              }}
            />
            <video
              ref={videoAngryRef}
              src="/M.webm"
              muted
              loop
              playsInline
              style={{
                ...styles.avatarVideo,
                opacity: (isSpeaking && emotion === 'angry') ? 1 : 0, 
              }}
            />
          </div>
        </div>

        <div style={styles.chatBox}>
          <div style={styles.topSpacer} />
          {messages.map((msg, index) => (
            <div key={index} style={{ ...styles.messageWrapper, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...styles.bubble, ...(msg.role === 'user' ? styles.userBubble : styles.aiBubble) }}>
                <div style={styles.roleHeader}>
                  <span style={{ 
                    ...styles.roleLabel, 
                    color: msg.role === 'assistant' ? '#fb923c' : '#ffffff' 
                  }}>
                    {msg.role === 'user' ? 'Kamu' : 'SukaChub Virtual Chat'}
                  </span>
                  {msg.role === 'assistant' && !msg.content.startsWith('Error:') && (
                    <button
                      onClick={() => speakText(msg.content, index)}
                      style={{ ...styles.speakerBtn, color: playingIndex === index ? '#f97316' : '#a1a1aa' }}
                    >
                      {playingIndex === index ? <IconSpeaker /> : <IconMute />}
                    </button>
                  )}
                </div>
                <div style={styles.textContent}>{msg.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.messageWrapper, justifyContent: 'flex-start' }}>
              <div style={{ ...styles.bubble, ...styles.aiBubble, fontStyle: 'italic', opacity: 0.85 }}>
                SukaChub Virtual Chat sedang mengetik...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div style={styles.suggestions}>
        {['Peluk saya erat-erat', 'Temani saya mengobrol', 'Manjain saya dong'].map((text, i) => (
          <button key={i} onClick={() => handleSend(text)} style={styles.chipButton}>{text}</button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={styles.inputContainer}>
        <button type="button" onClick={handleClearChat} style={styles.clearButton}>
          Hapus
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pesan hangat..."
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.sendButton}>
          {loading ? '...' : 'Kirim'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
    backgroundColor: '#09090b',
    color: '#f4f4f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 0 40px rgba(0, 0, 0, 0.8)',
  },
  header: {
    padding: '12px 16px',
    margin: '10px 12px 0 12px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(24, 24, 27, 0.75)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(63, 63, 70, 0.4)',
    zIndex: 10,
    flexShrink: 0,
  },
  headerTitleGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316', boxShadow: '0 0 8px #f97316' },
  title: { fontSize: '0.88rem', fontWeight: '600', margin: 0, letterSpacing: '-0.01em' },
  tokenBadge: { fontSize: '0.65rem', backgroundColor: 'rgba(39, 39, 42, 0.9)', color: '#f97316', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' },
  voiceControlGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  voiceSelect: { backgroundColor: '#18181b', color: '#f4f4f5', border: '1px solid #3f3f46', borderRadius: '14px', padding: '6px 10px', fontSize: '0.75rem', outline: 'none' },
  autoVoiceBtn: { display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid', borderRadius: '14px', padding: '6px 10px', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  chatBoxWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#09090b',
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
    width: '100%',
    maxWidth: '340px',
    height: '420px',
    display: 'flex',
    justifyContent: 'center',
  },
  avatarVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transition: 'opacity 0.3s ease-in-out',
  },
  chatBox: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 18%, black 38%, black 100%)',
    maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 18%, black 38%, black 100%)',
  },
  topSpacer: {
    minHeight: '230px',
    flexShrink: 0,
  },
  messageWrapper: { display: 'flex', width: '100%' },
  bubble: {
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: '22px',
    fontSize: '0.9rem',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  userBubble: { 
    backgroundColor: 'rgba(249, 115, 22, 0.9)', 
    color: '#ffffff', 
    borderRadius: '22px 22px 4px 22px' 
  },
  aiBubble: { 
    backgroundColor: 'rgba(24, 24, 27, 0.85)', 
    color: '#f4f4f5', 
    border: '1px solid rgba(63, 63, 70, 0.5)', 
    borderRadius: '22px 22px 22px 4px' 
  },
  roleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' },
  roleLabel: { fontSize: '0.7rem', opacity: 0.9, fontWeight: '700' },
  speakerBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' },
  textContent: { whiteSpace: 'pre-wrap', lineHeight: '1.45', wordBreak: 'break-word' },
  suggestions: { 
    display: 'flex', 
    gap: '8px', 
    padding: '8px 16px', 
    overflowX: 'auto', 
    zIndex: 3,
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  },
  chipButton: { 
    backgroundColor: 'rgba(24, 24, 27, 0.8)', 
    border: '1px solid rgba(63, 63, 70, 0.6)', 
    color: '#d4d4d8', 
    padding: '8px 16px', 
    borderRadius: '9999px', 
    fontSize: '0.78rem', 
    fontWeight: '500',
    cursor: 'pointer', 
    whiteSpace: 'nowrap',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  inputContainer: { 
    display: 'flex', 
    alignItems: 'center', 
    padding: '12px 16px calc(12px + env(safe-area-inset-bottom)) 16px', 
    gap: '8px', 
    backgroundColor: '#09090b', 
    zIndex: 3 
  },
  input: { 
    flex: 1, 
    backgroundColor: '#18181b', 
    border: '1px solid #27272a', 
    borderRadius: '24px', 
    padding: '12px 18px', 
    color: '#fff', 
    outline: 'none', 
    fontSize: '0.95rem' 
  },
  sendButton: { 
    backgroundColor: '#f97316', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '24px', 
    padding: '0 20px', 
    height: '46px', 
    fontWeight: '600', 
    cursor: 'pointer',
    fontSize: '0.9rem',
    boxShadow: '0 2px 10px rgba(249, 115, 22, 0.4)'
  },
  clearButton: { 
    backgroundColor: 'rgba(239, 68, 68, 0.15)', 
    color: '#ef4444', 
    border: '1px solid rgba(239, 68, 68, 0.3)', 
    borderRadius: '24px', 
    padding: '0 14px', 
    height: '46px', 
    fontSize: '0.78rem', 
    fontWeight: '600', 
    cursor: 'pointer', 
    whiteSpace: 'nowrap' 
  },
};