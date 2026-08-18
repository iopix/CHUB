'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
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
        throw new Error(data.error || 'Login gagal');
      }

      // Simpan user data ke localStorage (sementara)
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
        <p style={styles.subtitle}>Masuk dengan username dan PIN</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={styles.input}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </form>
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
  },
  card: {
    backgroundColor: '#18181b',
    padding: '40px 30px',
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
    fontSize: '0.9rem',
    textAlign: 'center',
    marginBottom: '24px',
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
    fontSize: '1rem',
    outline: 'none',
  },
  button: {
    backgroundColor: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    color: '#ef4444',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
};