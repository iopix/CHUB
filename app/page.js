'use client';
import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResults([]);

    const formData = new FormData();
    formData.append('prompt', prompt);

    try {
      const res = await fetch('/api/transform', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem');
      }

      setResults(data.images || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'system-ui, sans-serif', textAlign: 'center', maxWidth: '850px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>AI Image Generator</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Ketik deskripsi gaya atau tema gambar yang diinginkan untuk membuat 2 variasi gambar sekaligus.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Contoh: ubah warna pink dan biru, cyberpunk style, anime portrait..." 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          required
          style={{ width: '100%', maxWidth: '550px', padding: '14px 18px', fontSize: '16px', borderRadius: '10px', border: '1px solid #ccc', outline: 'none' }}
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
          {loading ? 'Memproses 2 Gambar (Harap Tunggu)...' : 'Generate 2 Gambar'}
        </button>
      </form>

      {errorMsg && (
        <div style={{ color: '#d32f2f', margin: '25px 0', padding: '14px', border: '1px solid #ef5350', borderRadius: '8px', backgroundColor: '#ffebee' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '35px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Hasil Generasi (2 Gambar):</h2>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {results.map((imgUrl, index) => (
              <div key={index} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '12px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <p style={{ fontWeight: '600', marginBottom: '10px', color: '#444' }}>Gambar #{index + 1}</p>
                <img 
                  src={imgUrl} 
                  alt={`Hasil AI ${index + 1}`} 
                  style={{ maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '8px', display: 'block' }} 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}