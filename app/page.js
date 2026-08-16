'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setErrorMsg('Harap unggah gambar acuan terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('prompt', prompt);

    try {
      const res = await fetch('/api/transform', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses gambar.');

      setResult(data.image);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ backgroundColor: '#0b0f17', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', padding: '24px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', fontSize: '14px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#fff' }}>shootstuff/flux-img2img-uncensored</span>
        <span style={{ backgroundColor: '#1e293b', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: '#94a3b8' }}>♥ 131</span>
        <span style={{ backgroundColor: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Agents</span>
        <span style={{ color: '#22c55e', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>● Running</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Panel Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Box Upload Gambar */}
            <div style={{ border: '1px dashed #334155', borderRadius: '8px', backgroundColor: '#161e2e', padding: '40px 20px', textAlign: 'center', position: 'relative', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />

              {preview ? (
                <img src={preview} alt="Input" style={{ maxHeight: '240px', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }} />
              ) : (
                <>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ marginBottom: '12px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#f1f5f9' }}>Letakkan Gambar di Sini</p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#64748b' }}>- atau -</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#38bdf8' }}>Klik untuk Mengunggah</p>
                </>
              )}
            </div>

            {/* Input Text Prompt */}
            <div style={{ backgroundColor: '#161e2e', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                PROMPT
              </label>
              <textarea 
                rows={3}
                placeholder="Masukkan deskripsi perintah gambar..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', padding: '10px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '12px', backgroundColor: loading ? '#334155' : '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Memproses Gambar...' : 'Generate Image'}
            </button>
          </div>

          {/* Panel Output */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ border: '1px solid #1e293b', borderRadius: '8px', backgroundColor: '#161e2e', height: '100%', minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid #1e293b', padding: '8px 14px', fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🖼️ output</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                {result ? (
                  <img src={result} alt="Output" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '6px', objectFit: 'contain' }} />
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
              </div>
            </div>

            <button type="button" disabled style={{ padding: '10px', backgroundColor: '#1e293b', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'not-allowed' }}>
              🔗 Share via Link
            </button>
          </div>

        </div>
      </form>

      {/* Tampilan Error */}
      {errorMsg && (
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#450a0a', border: '1px solid #991b1b', borderRadius: '6px', color: '#fca5a5', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}
    </main>
  );
}