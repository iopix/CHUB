// components/MicButton.tsx
'use client';

import { useState, useRef } from 'react';

export default function MicButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Akses mikrofon tidak didukung atau diblokir browser!');
        return;
      }

      // 1. Ambil Stream Audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Deteksi Format Audio (Brave/Safari Kompatibilitas)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // 3. Wajib Matikan Hardware Mic Biar Indikator HP Hilang
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        if (audioBlob.size === 0) return;

        const formData = new FormData();
        formData.append('file', audioBlob);

        setLoading(true);
        try {
          const res = await fetch('/api/stt', { method: 'POST', body: formData });
          const data = await res.json();
          if (res.ok && data.text) {
            onTranscript(data.text);
          } else {
            console.error('STT Response error:', data);
          }
        } catch (err) {
          console.error('Gagal kirim audio ke API:', err);
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Izin mic ditolak! Cek ikon gembok/singa di address bar.');
      console.error('Mic Error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <button
      type="button"
      onClick={recording ? stopRecording : startRecording}
      disabled={loading}
      className={`p-3 rounded-full text-white transition-all ${
        recording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? 'Memproses...' : recording ? 'Stop Mic' : 'Start Mic'}
    </button>
  );
}