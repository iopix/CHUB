'use client';
import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    const formData = new FormData();
    formData.append('prompt', prompt);

    try {
      const res = await fetch('/api/transform', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Server sibuk. Silakan klik Generate sekali lagi.");
      }

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem');
      }

      setResult(data.image);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'system-ui, sans-serif', textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>AI Image Generator</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Ketik deskripsi gambar yang ingin dibuat.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Contoh: ubah jadi burung, burung cantik warna pink biru..." 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          required
          style={{ width: '100%', maxWidth: '500px', padding: '14px 18px', fontSize: '16px', borderRadius: '10px', border: '1px solid #ccc', outline: 'none' }}
        />

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            padding: '12px 32px', 
            fontSize: '16px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            backgroundColor: loading ? '#888' : '#0070f3', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '10px', 
            fontWeight: '600'
          }}
        >
          {loading ? 'Sedang Memproses Gambar...' : 'Generate Gambar'}
        </button>
      </form>

      {errorMsg && (
        <div style={{ color: '#d32f2f', margin: '25px 0', padding: '14px', border: '1px solid #ef5350', borderRadius: '8px', backgroundColor: '#ffebee' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '35px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '15px' }}>Hasil Gambar:</h2>
          <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '12px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'inline-block' }}>
            <img 
              src={result} 
              alt="Hasil AI" 
              style={{ maxWidth: '450px', width: '100%', height: 'auto', borderRadius: '8px', display: 'block' }} 
            />
          </div>
        </div>
      )}
    </main>
  );
}