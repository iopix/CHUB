'use client';
import { useState } from 'react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('image', image);

    const res = await fetch('/api/transform', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));
    } else {
      alert('Gagal memproses gambar');
    }
    setLoading(false);
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>AI Image to Image Generator</h1>
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

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Hasil:</h3>
          <img src={result} alt="Hasil AI" style={{ maxWidth: '400px', borderRadius: '8px' }} />
        </div>
      )}
    </main>
  );
}