'use client';
import { useState } from 'react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResults([]);

    const formData = new FormData();
    if (image) formData.append('image', image);
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
    <main style={{ padding: '30px 20px', fontFamily: 'sans-serif', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '10px' }}>AI Image Generator & Editor</h1>
      <p style={{ color: '#666', marginBottom: '25px' }}>
        Masukkan instruksi/prompt gaya gambar untuk menghasilkan 2 variasi gambar sekaligus.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Instruksi gambar (misal: anime style, cyberpunk, 3D render, photorealistic)..." 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          required
          style={{ width: '100%', maxWidth: '500px', padding: '12px', fontSize: '15px', borderRadius: '8px', border: '1px solid #ccc' }}
        />

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Upload Gambar Acuan (Opsional):</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setImage(e.target.files[0])} 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            padding: '12px 30px', 
            fontSize: '16px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            backgroundColor: '#0070f3', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold' 
          }}
        >
          {loading ? 'Sedang Memproses 2 Gambar...' : 'Generate 2 Gambar'}
        </button>
      </form>

      {errorMsg && (
        <div style={{ color: 'red', margin: '20px 0', padding: '12px', border: '1px solid red', borderRadius: '6px', backgroundColor: '#fff0f0' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h2>Hasil Generasi (2 Gambar):</h2>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '15px' }}>
            {results.map((imgUrl, index) => (
              <div key={index} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '10px', backgroundColor: '#fafafa' }}>
                <p style={{ fontWeight: 'bold', margin: '5px 0' }}>Gambar #{index + 1}</p>
                <img src={imgUrl} alt={`Hasil AI ${index + 1}`} style={{ maxWidth: '340px', width: '100%', borderRadius: '8px' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}