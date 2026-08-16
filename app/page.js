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
    <line x1="1" y1="1" x2="23" y2="23"></line>
    <path d="M9 9v6a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0a7 7 0 0 1-.11 1.23"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

const IconMic = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('spruce');
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const initialGreeting = 'Halo sayang, sini mendekat sama aku. Aku kangen banget dan pengen peluk cowok gantengku yang gemoy ini.';
    setMessages([{ role: 'assistant', content: initialGreeting }]);
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
    const initialGreeting = 'Halo sayang, sini mendekat sama aku. Aku kangen banget dan pengen peluk cowok gantengku yang gemoy ini.';
    setMessages([{ role: 'assistant', content: initialGreeting }]);
  };

  const speakText = async (text, index) => {
    if (!text) return;

    if (playingIndex === index) {
      stopAudio();
      return;
    }

    stopAudio();

    const cleanText = text.replace(/\[Error:.*?\]/g, '').trim();
    if (!cleanText) return;

    setAudioLoading(true);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: selectedVoice }),
      });

      if (!res.ok) {
        setAudioLoading(false);
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        setAudioLoading(false);
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      setPlayingIndex(index);
      audio.onended = () => setPlayingIndex(null);
      audio.onpause = () => setPlayingIndex(null);

      await audio.play();
    } catch (err) {
      console.warn('Audio Play Error:', err);
      setPlayingIndex(null);
    } finally {
      setAudioLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);

    recognition.start();
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
        const updatedMessages = [...newMessages, { role: 'assistant', content: data.reply }];
        setMessages(updatedMessages);
        speakText(data.reply, updatedMessages.length - 1);
      } else {
        const errorMsg = `Error: ${data.error || 'Gagal tersambung ke server Groq.'}`;
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
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.statusDot} />
          <h1 style={styles.title}>SukaChub AI</h1>
        </div>

        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          style={styles.voiceSelect}
        >
          <option value="spruce">Spruce (Bulepotan)</option>
          <option value="breeze">Breeze (Genzet)</option>
          <option value="arbor">Arbor (Pakcik)</option>
        </select>
      </header>

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
                  {msg.role === 'user' ? 'You' : 'SukaChub AI'}
                </span>
                {msg.role === 'assistant' && !msg.content.startsWith('Error:') && (
                  <button
                    onClick={() => speakText(msg.content, index)}
                    disabled={audioLoading && playingIndex !== index}
                    style={{
                      ...styles.speakerBtn,
                      color: playingIndex === index ? '#f97316' : '#a1a1aa',
                    }}
                    title={playingIndex === index ? 'Mute Audio' : 'Putar Audio'}
                  >
                    {playingIndex === index ? <IconSpeaker /> : <IconMute />}
                  </button>
                )}
              </div>
              <div style={{ whitespace: 'pre-wrap', lineHeight: '1.5' }}>{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageWrapper, justifyContent: 'flex-start' }}>
            <div style={{ ...styles.bubble, ...styles.aiBubble, fontStyle: 'italic', opacity: 0.8 }}>
              SukaChub AI lagi nulis...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={styles.suggestions}>
        {['Peluk aku dong', 'Bisa cium gak', 'Ceritain hal manis'].map((text, i) => (
          <button key={i} onClick={() => handleSend(text)} style={styles.chipButton}>
            {text}
          </button>
        ))}
        <button onClick={handleClearChat} style={styles.clearChipButton}>
          Hapus Chat
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={styles.inputContainer}>
        <button
          type="button"
          onClick={startListening}
          style={{
            ...styles.iconMicButton,
            backgroundColor: isListening ? '#ea580c' : '#f97316',
            boxShadow: isListening ? '0 0 14px #f97316' : '0 2px 8px rgba(249, 115, 22, 0.4)',
          }}
          title={isListening ? 'Mendengarkan...' : 'Gunakan Mic'}
        >
          <IconMic />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? 'Mendengarkan...' : 'Ketik atau gunakan mic...'}
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
    height: '100vh',
    backgroundColor: '#09090b',
    color: '#e4e4e7',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    boxShadow: '0 0 50px rgba(0,0,0,0.8)',
  },
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid #27272a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(18, 18, 20, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#f97316',
    boxShadow: '0 0 8px #f97316',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '600',
    margin: 0,
    letterSpacing: '0.5px',
  },
  voiceSelect: {
    backgroundColor: '#18181b',
    color: '#e4e4e7',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
  },
  chatBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
  },
  bubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '16px',
    fontSize: '0.95rem',
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
  },
  roleLabel: {
    fontSize: '0.75rem',
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
    transition: 'color 0.2s ease',
  },
  suggestions: {
    display: 'flex',
    gap: '8px',
    padding: '0 20px 10px 20px',
    overflowX: 'auto',
    alignItems: 'center',
  },
  chipButton: {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    color: '#a1a1aa',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  clearChipButton: {
    backgroundColor: '#ef4444',
    border: 'none',
    color: '#ffffff',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
    marginLeft: 'auto',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    gap: '10px',
    borderTop: '1px solid #27272a',
    backgroundColor: '#09090b',
  },
  iconMicButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  input: {
    flex: 1,
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#fff',
    outline: 'none',
    fontSize: '0.95rem',
  },
  sendButton: {
    backgroundColor: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '0 20px',
    height: '44px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.4)',
    transition: 'all 0.2s ease',
  },
};