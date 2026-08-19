'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// --- IKON MATA (TOGGLE PIN) ---
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const router = useRouter();

  // Handler ubah Username (hanya huruf & angka, 5 - 20 karakter)
  const handleUsernameChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, ''); // Hapus selain huruf dan angka
    if (value.length <= 20) {
      setUsername(value);
    }
  };

  // Handler ubah PIN (hanya angka, maks 6 digit)
  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Hapus selain angka
    if (value.length <= 6) {
      setPin(value);
    }
  };

  const isUsernameValid = username.length >= 5 && username.length <= 20;
  const isPinValid = pin.length === 6;
  const isFormValid = isUsernameValid && isPinValid && agreed;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!isUsernameValid) {
      setError('Username harus terdiri dari 5 - 20 huruf/angka.');
      return;
    }

    if (!isPinValid) {
      setError('PIN harus terdiri dari 6 digit angka.');
      return;
    }

    if (!agreed) {
      setError('Anda harus menyetujui untuk berinteraksi dengan santun.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        // Jika salah 3x, langsung lempar ke ipixchat.my.id
        if (nextAttempts >= 3) {
          window.location.href = 'https://ipixchat.my.id';
          return;
        }

        throw new Error(
          `${data.error || 'PIN atau Username salah.'} (Gagal ${nextAttempts}/3 x)`
        );
      }

      // Reset hitungan kegagalan jika login berhasil
      setFailedAttempts(0);

      // Simpan user data ke localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect ke halaman utama
      router.push('/');
      router.refresh();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>SukaChub Login</h1>
        <p style={styles.subtitle}>
          Gunakan Username dan 6 digit PIN angka yang sama saat pendaftaran di ipixchat
        </p>

        <form onSubmit={handleLogin} style={styles.form}>
          {/* Input Username (5-20 Huruf/Angka) */}
          <input
            type="text"
            placeholder="Username (5-20 huruf/angka)"
            value={username}
            onChange={handleUsernameChange}
            minLength={5}
            maxLength={20}
            style={styles.input}
            required
          />

          {/* Wrapper PIN dengan Tombol Mata */}
          <div style={styles.pinWrapper}>
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="PIN (6 digit angka)"
              value={pin}
              onChange={handlePinChange}
              style={styles.pinInput}
              required
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              style={styles.eyeButton}
              title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
            >
              {showPin ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>

          {/* Centang Kecil Teks Orange */}
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={styles.checkbox}
            />
            <span style={styles.checkboxText}>
              Setuju berinteraksi dengan santun
            </span>
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            style={{
              ...styles.button,
              opacity: loading || !isFormValid ? 0.5 : 1,
              cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </form>

        {/* Pemberitahuan Pendaftaran */}
        <div style={styles.registerPrompt}>
          <span>Belum punya User/PIN atau baru ingin mendaftar?</span>
          <a
            href="https://ipixchat.my.id/chat"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.registerLink}
          >
            Daftar akun di ipixchat.my.id/chat
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#000000',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: '#18181b',
    padding: '40px 30px 30px 30px',
    borderRadius: '24px',
    maxWidth: '400px',
    width: '100%',
    border: '1px solid #3f3f46',
    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
  },
  title: {
    color: '#f97316',
    fontSize: '1.8rem',
    fontWeight: '700',
    fontStyle: 'italic',
    marginBottom: '4px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginBottom: '24px',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  input: {
    backgroundColor: '#27272a',
    border: '1px solid #3f3f46',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
  },
  pinWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  pinInput: {
    width: '100%',
    backgroundColor: '#27272a',
    border: '1px solid #3f3f46',
    borderRadius: '12px',
    padding: '12px 46px 12px 16px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    letterSpacing: '2px',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    marginTop: '2px',
    userSelect: 'none',
  },
  checkbox: {
    width: '14px',
    height: '14px',
    accentColor: '#f97316',
    cursor: 'pointer',
  },
  checkboxText: {
    color: '#f97316',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    marginTop: '4px',
    transition: 'all 0.2s ease',
  },
  error: {
    color: '#ef4444',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  registerPrompt: {
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #27272a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: '#a1a1aa',
    textAlign: 'center',
  },
  registerLink: {
    color: '#f97316',
    fontWeight: '600',
    textDecoration: 'underline',
  },
};