'use client';
import { useState, useRef, useEffect } from 'react';

// Corong Unmute
const IconSpeaker = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

// Corong Mute
const IconMute = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <line x1="23" y1="9" x2="17" y2="15"></line>
    <line x1="17" y1="9" x2="23" y2="15"></line>
  </svg>
);

// SVG Auto Suara ON
const IconAutoVoiceOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10v4" />
    <path d="M6 6v12" />
    <path d="M10 3v18" />
    <path d="M14 8v8" />
    <path d="M18 5v14" />
    <path d="M22 10v4" />
  </svg>
);

// SVG Auto Suara OFF
const IconAutoVoiceOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10v4" />
    <path d="M6 6v12" />
    <line x1="2" y1="2" x2="22" y2="22" />
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

  useEffect(() => {
    const initialGreeting = 'Sini mendekat ke pelukan saya, sayang. Saya merindukan kehangatan dan kehadiran kamu.';
    setMessages([{ role: 'assistant', content: initialGreeting }]);
    
    if (autoVoice) {
      speakText(initialGreeting, 0);
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingIndex(null);
  };

  const handleClearChat = () => {
    stopAudio();
    const initialGreeting = 'Sini mendekat ke pelukan saya, sayang. Saya merindukan kehangatan dan kehadiran kamu.';
    setMessages([{ role: 'assistant', content: initialGreeting }]);
    if (autoVoice) {
      speakText(initialGreeting, 0);
    }
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

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: selectedVoice }),
      });

      if (!res.ok) {
        setPlayingIndex(null);
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        setPlayingIndex(null);
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => setPlayingIndex(null);
      audio.onpause = () => setPlayingIndex(null);
      audio.onerror = () => setPlayingIndex(null);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay blocked or interrupted:', err);
          setPlayingIndex(null);
        });
      }
    } catch (err) {
      console.warn('TTS Fetch Error:', err);
      setPlayingIndex(null);
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
        // Simpan sisa token Groq jika dikembalikan dari backend
        if (data.remainingTokens !== undefined && data.remainingTokens !== null) {
          setRemainingTokens(data.remainingTokens);
        }

        const updatedMessages = [...newMessages, { role: 'assistant', content: data.reply }];
        const newIndex = updatedMessages.length - 1;
        setMessages(updatedMessages);

        if (autoVoice) {
          speakText(data.reply, newIndex);
        }
      } else {
        const errorMsg = `Error: ${data.error || 'Gagal tersambung ke server.'}`;
        setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error Network: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Mobile Friendly */}
      <header style={styles.header}>
        <div style={styles.headerTitleGroup}>
          <div style={styles.statusDot} />
          <h1 style={styles.title}>SukaChub AI</h1>
          {remainingTokens !== null && (
            <span style={styles.tokenBadge} title="Sisa token Groq limit">
              {Number(remainingTokens).toLocaleString('id-ID')} Tkn
            </span>
          )}
        </div>

        {/* Kontrol Suara & Auto Play Toggle */}
        <div style={styles.voiceControlGroup}>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            style={styles.voiceSelect}
          >
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
            title={autoVoice ? 'Auto Suara: ON' : 'Auto Suara: OFF'}
          >
            {autoVoice ? <IconAutoVoiceOn /> : <IconAutoVoiceOff />}
            <span style={styles.autoVoiceText}>{autoVoice ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageWrapper,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                ...styles.bubble,
                ...(msg.role === 'user' ? styles.userBubble : styles.aiBubble),
              }}
            >
              <div style={styles.roleHeader}>
                <span style={styles.roleLabel}>
                  {msg.role === 'user' ? 'Kamu' : 'SukaChub AI'}
                </span>
                {msg.role === 'assistant' && !msg.content.startsWith('Error:') && (
                  <button
                    onClick={() => speakText(msg.content, index)}
                    style={{
                      ...styles.speakerBtn,
                      color: playingIndex === index ? '#f97316' : '#a1a1aa',
                    }}
                    title={playingIndex === index ? 'Matikan Suara' : 'Putar Suara'}
                  >
                    {playingIndex === index ? <IconSpeaker /> : <IconMute />}
                  </button>
                )}
              </div>
              <div style={styles.textContent}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageWrapper, justifyContent: 'flex-start' }}>
            <div style={{ ...styles.bubble, ...styles.aiBubble, fontStyle: 'italic', opacity: 0.8 }}>
              SukaChub AI sedang mengetik...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div style={styles.suggestions}>
        {['Peluk saya erat-erat', 'Temani saya mengobrol', 'Manjain saya dong'].map((text, i) => (
          <button key={i} onClick={() => handleSend(text)} style={styles.chipButton}>
            {text}
          </button>
        ))}
        <button onClick={handleClearChat} style={styles.clearChipButton}>
          Hapus Chat
        </button>
      </div>

      {/* Input Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={styles.inputContainer}>
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
    backgroundColor: '#09090b',
    color: '#e4e4e7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxShadow: '0 0 50px rgba(0,0,0,0.8)',
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    padding: '10px 14px',
    borderBottom: '1px solid #27272a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(18, 18, 20, 0.95)',
    backdropFilter: 'blur(10px)',
    zIndex: 10,
    flexShrink: 0,
    gap: '8px',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#f97316',
    boxShadow: '0 0 8px #f97316',
    flexShrink: 0,
  },
  title: {
    fontSize: '0.9rem',
    fontWeight: '600',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tokenBadge: {
    fontSize: '0.68rem',
    fontWeight: '600',
    backgroundColor: '#27272a',
    color: '#f97316',
    padding: '2px 6px',
    borderRadius: '6px',
    border: '1px solid #3f3f46',
    whiteSpace: 'nowrap',
  },
  voiceControlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  voiceSelect: {
    backgroundColor: '#18181b',
    color: '#e4e4e7',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    padding: '5px 8px',
    fontSize: '0.78rem',
    outline: 'none',
    cursor: 'pointer',
  },
  autoVoiceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid',
    borderRadius: '8px',
    padding: '5px 8px',
    fontSize: '0.72rem',
    fontWeight: '600',
    cursor: 'pointer',
    touchAction: 'manipulation',
    transition: 'all 0.2s ease',
  },
  autoVoiceText: {
    fontSize: '0.7rem',
    lineHeight: 1,
  },
  chatBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    WebkitOverflowScrolling: 'touch',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
  },
  bubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '0.92rem',
  },
  userBubble: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  aiBubble: {
    backgroundColor: '#18181b',
    color: '#e4e4e7',
    border: '1px solid #27272a',
    borderBottomLeftRadius: '4px',
  },
  roleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
    gap: '8px',
  },
  roleLabel: {
    fontSize: '0.7rem',
    opacity: 0.6,
    fontWeight: 'bold',
  },
  speakerBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
  },
  textContent: {
    whiteSpace: 'pre-wrap',
    lineHeight: '1.45',
    wordBreak: 'break-word',
  },
  suggestions: {
    display: 'flex',
    gap: '8px',
    padding: '8px 14px',
    overflowX: 'auto',
    alignItems: 'center',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    flexShrink: 0,
  },
  chipButton: {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    color: '#a1a1aa',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    touchAction: 'manipulation',
  },
  clearChipButton: {
    backgroundColor: '#ef4444',
    border: 'none',
    color: '#ffffff',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
    flexShrink: 0,
    marginLeft: 'auto',
    touchAction: 'manipulation',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px calc(10px + env(safe-area-inset-bottom)) 14px',
    gap: '8px',
    borderTop: '1px solid #27272a',
    backgroundColor: '#09090b',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '10px 14px',
    color: '#fff',
    outline: 'none',
    fontSize: '16px',
    minWidth: 0,
  },
  sendButton: {
    backgroundColor: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '0 16px',
    height: '42px',
    fontWeight: '600',
    fontSize: '0.88rem',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.4)',
    touchAction: 'manipulation',
  },
};