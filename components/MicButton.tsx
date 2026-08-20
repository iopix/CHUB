// components/MicButton.tsx
'use client';

import { useState, useRef } from 'react';

export default function MicButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob);

      const res = await fetch('/api/stt', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.text) onTranscript(data.text);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <button 
      onClick={recording ? stopRecording : startRecording}
      className={`p-3 rounded-full ${recording ? 'bg-red-500' : 'bg-blue-500'} text-white`}
    >
      {recording ? 'Stop Mic' : 'Start Mic'}
    </button>
  );
}