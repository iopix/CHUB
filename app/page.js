'use client';
import { useState } from 'react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('image', image);
    formData.append('prompt', prompt);

    const res = await fetch('/api/transform', { method: 'POST', body: formData });
    const data = await res.json();
    
    if (data.image) {
      setResult(data.image);
    } else {
      alert("Error: " + data.error);
    }
    setLoading(false);
  };

  return (
    <main style={{ padding: '20px', backgroundColor: '#0f0f0f', color: 'white', minHeight: '100vh' }}>
      <h1>AI Image Modifier</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />
        <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt..." />
        <button type="submit" disabled={loading}>{loading ? 'Memproses...' : 'Generate'}</button>
      </form>
      {result && <img src={result} style={{ maxWidth: '500px', marginTop: '20px' }} />}
    </main>
  );
}