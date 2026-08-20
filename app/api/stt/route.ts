import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('file') as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: 'File audio tidak ditemukan' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY tidak ditemukan' }, { status: 500 });
    }

    // Menyiapkan Payload Multipart Form Data ke Groq Whisper API
    const groqFormData = new FormData();
    groqFormData.append('file', audioFile, 'speech.webm');
    groqFormData.append('model', 'whisper-large-v3-turbo');
    groqFormData.append('language', 'id');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq STT Error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Gagal memproses transkrip audio' },
        { status: response.status }
      );
    }

    return NextResponse.json({ text: data.text });

  } catch (err) {
    console.error('STT Server Error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Terjadi kesalahan pada server STT' },
      { status: 500 }
    );
  }
}