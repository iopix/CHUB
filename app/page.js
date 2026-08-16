'use client';
import { useState } from 'react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && !image) {
      setErrorMsg('Pilih gambar atau isi deskripsi/prompt terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    const formData = new FormData();
    if (image) formData.append('image', image);
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
        throw new Error('Server sedang sibuk. Silakan coba klik Generate sekali lagi.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem.');
      }

      setResult(data.image);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '30px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#111' }}>AI Image Editor & Generator</h1>
      <p style={{ color: '#666', marginBottom: '25px', fontSize: '15px' }}>
        Upload gambar acuan dan ketik instruksi perubahan yang kamu inginkan.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '16px', border: '1px solid #e5e5e5' }}>
        
        {/* Tombol Upload Gambar */}
        <div style={{ width: '100%', textAlign: 'left' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#333' }}>
            1. Upload Gambar Acuan (Opsional):
          </label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#fff', 
              border: '1px dashed #0070f3', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          />
          {preview && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Preview Gambar Upload:</p>
              <img src={preview} alt="Preview" style={{ maxHeight: '140px', borderRadius: '8px', border: '1px solid #ddd' }} />
            </div>
          )}
        </div>

        {/* Input Prompt */}
        <div style={{ width: '100%', textAlign: 'left' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#333' }}>
            2. Perintah Edit / Prompt Gambar:
          </label>
          <input 
            type="text" 
            placeholder="Contoh: ubah jadi burung, ubah warna pink dan biru..." 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)}
            required
            style={{ width: '100%', padding: '12px 16px', fontSize: '15px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Tombol Submit */}
        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            width: '100%',
            padding: '14px', 
            fontSize: '16px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            backgroundColor: loading ? '#888' : '#0070f3', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '10px', 
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Memproses Gambar AI...' : 'Generate / Ubah Gambar'}
        </button>
      </form>

      {/* Pesan Error */}
      {errorMsg && (
        <div style={{ color: '#d32f2f', margin: '20px 0', padding: '14px', border: '1px solid #ef5350', borderRadius: '10px', backgroundColor: '#ffebee', fontSize: '14px' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* Hasil Gambar */}
      {result && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '15px', color: '#222' }}>Hasil Gambar AI:</h2>
          <div style={{ border: '1px solid #e1e1e1', borderRadius: '14px', padding: '15px', backgroundColor: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', display: 'inline-block' }}>
            <img 
              src={result} 
              alt="Hasil AI" 
              style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '10px', display: 'block' }} 
            />
          </div>
        </div>
      )}
    </main>
  );
}