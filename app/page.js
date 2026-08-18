'use client';
import { useState, useRef, useEffect } from 'react';

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

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('spruce');
  const [autoVoice, setAutoVoice] = useState(true);
  const [remainingTokens, setRemainingTokens] = useState(null);

  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null); // Untuk A.webm (Bicara)
  const videoIdleRef = useRef(null); // Untuk D.webm (Diam)
  const abortControllerRef = useRef(null);

  const isSpeaking = playingIndex !== null;

  // Pastikan video idle selalu play saat tidak ada suara
  useEffect(() => {
    if (videoIdleRef.current) {
      if (!isSpeaking) {
        videoIdleRef.current.play().catch(() => {});
      }
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

    if (videoRef.current) {
      videoRef.current.pause();
    }

    setPlayingIndex(null);
  };

  const handleClearChat = () => {
    stopAudio();
    const initialGreeting = 'Sini mendekat ke pelukan saya, sayang. Saya merindukan kehangatan dan kehadiran kamu.';
    setMessages([{ role: 'assistant', content: initialGreeting }]);
    if (autoVoice) speakText(initialGreeting, 0);
  };

  const speakText = async (text, index) => {
    if (!text) return;

    if (playingIndex === index) {
      stopAudio();
      return;
    }

    stopAudio();
    const cleanText = text.replace(/\[Error:.*?\]/g, '').replace(/[*_#]/g, '').trim();
    if (!cleanText) return;

    setPlayingIndex(index);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: selectedVoice }),
        signal: controller.signal,
      });

      if (!res.ok) return stopAudio();
      const blob = await res.blob();
      if (blob.size === 0) return stopAudio();

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        if (videoRef.current) {
          videoRef.current.playbackRate = audio.playbackRate || 1.0;
          videoRef.current.play().catch(() => {});
        }
      };

      audio.onratechange = () => {
        if (videoRef.current) {
          videoRef.current.playbackRate = audio.playbackRate;
        }
      };

      audio.onended = () => stopAudio();
      audio.onpause = () => stopAudio();
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
        if (autoVoice) speakText(data.reply, newIndex);
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
          <h1 style={styles.title}>SukaChub AI</h1>
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
              backgroundColor: autoVoice ? 'rgba(249, 115, 22, 0.15)' : '#18181b',
              borderColor: autoVoice ? '#f97316' : '#3f3f46',
              color: autoVoice ? '#f97316' : '#71717a',
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
            {/* Video Diam (D.webm) diletakkan di bawah */}
            <video
              ref={videoIdleRef}
              src="/D.webm"
              autoPlay
              muted
              loop
              playsInline
              style={{
                ...styles.avatarVideo,
                opacity: isSpeaking ? 0 : 1, // Hilang saat bicara
              }}
            />
            {/* Video Bicara (A.webm) diletakkan di atas */}
            <video
              ref={videoRef}
              src="/A.webm"
              muted
              loop
              playsInline
              style={{
                ...styles.avatarVideo,
                opacity: isSpeaking ? 1 : 0, // Muncul saat bicara
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
                    color: msg.role === 'assistant' ? '#f97316' : '#ffffff' 
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
              <div style={{ ...styles.bubble, ...styles.aiBubble, fontStyle: 'italic', opacity: 0.8 }}>
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
          Hapus Chat
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
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#000000',
    color: '#e4e4e7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    padding: '10px 14px',
    borderBottom: '1px solid #27272a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(0, 0, 0, 0.95)',
    backdropFilter: 'blur(10px)',
    zIndex: 10,
    flexShrink: 0,
  },
  headerTitleGroup: { display: 'flex', alignItems: 'center', gap: '6px' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' },
  title: { fontSize: '0.9rem', fontWeight: '600', margin: 0 },
  tokenBadge: { fontSize: '0.68rem', backgroundColor: '#27272a', color: '#f97316', padding: '2px 6px', borderRadius: '6px' },
  voiceControlGroup: { display: 'flex', alignItems: 'center', gap: '6px' },
  voiceSelect: { backgroundColor: '#18181b', color: '#e4e4e7', border: '1px solid #3f3f46', borderRadius: '8px', padding: '5px 8px', fontSize: '0.78rem' },
  autoVoiceBtn: { display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid', borderRadius: '8px', padding: '5px 8px', fontSize: '0.72rem', cursor: 'pointer' },
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
    width: '320px',
    height: '460px',
    display: 'flex',
    justifyContent: 'center',
  },
  avatarVideo: {
    position: 'absolute', // Membuat video bertumpuk
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transition: 'opacity 0.3s ease-in-out', // Transisi memudar halus tanpa kedip
  },
  chatBox: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
    overflowY: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 22%, black 45%, black 100%)',
    maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 22%, black 45%, black 100%)',
  },
  topSpacer: {
    minHeight: '260px',
    flexShrink: 0,
  },
  messageWrapper: { display: 'flex', width: '100%' },
  bubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '0.92rem',
    backdropFilter: 'blur(12px)',
  },
  userBubble: { backgroundColor: 'rgba(249, 115, 22, 0.85)', color: '#ffffff', borderBottomRightRadius: '4px' },
  aiBubble: { backgroundColor: 'rgba(24, 24, 27, 0.85)', color: '#e4e4e7', border: '1px solid rgba(63, 63, 70, 0.5)', borderBottomLeftRadius: '4px' },
  roleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  roleLabel: { fontSize: '0.7rem', opacity: 0.8, fontWeight: 'bold' },
  speakerBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px' },
  textContent: { whiteSpace: 'pre-wrap', lineHeight: '1.45', wordBreak: 'break-word' },
  suggestions: { display: 'flex', gap: '8px', padding: '8px 14px', overflowX: 'auto', zIndex: 3 },
  chipButton: { backgroundColor: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', padding: '6px 12px', borderRadius: '20px', fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  inputContainer: { display: 'flex', alignItems: 'center', padding: '10px 14px calc(10px + env(safe-area-inset-bottom)) 14px', gap: '8px', borderTop: '1px solid #27272a', backgroundColor: '#000000', zIndex: 3 },
  input: { flex: 1, backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '10px 14px', color: '#fff', outline: 'none', fontSize: '16px' },
  sendButton: { backgroundColor: '#f97316', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 16px', height: '42px', fontWeight: '600', cursor: 'pointer' },
  clearButton: { backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 12px', height: '42px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
};