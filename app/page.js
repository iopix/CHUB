'use client';
import { useState } from 'react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    setLoading(true);
    setErrorMsg('');
    setResult(null);

    const formData = new FormData();
    formData.append('image', image);

    try {
      const res = await fetch('/api/transform', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

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
    <main style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1>AI Image to Image</h1>
      <form onSubmit={handleSubmit} style={{ margin: '20px 0' }}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setImage(e.target.files[0])} 
          required 
        />
        <br /><br />
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          {loading ? 'Memproses Gambar...' : 'Ubah Gambar'}
        </button>
      </form>

      {errorMsg && (
        <div style={{ color: 'red', margin: '20px 0', padding: '12px', border: '1px solid red', borderRadius: '6px', backgroundColor: '#fff0f0' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Hasil:</h3>
          <img src={result} alt="Hasil AI" style={{ maxWidth: '100%', borderRadius: '8px' }} />
        </div>
      )}
    </main>
  );
}