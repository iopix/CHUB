import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VOICE_MAP = {
  spruce: 'en-US-AndrewMultilingualNeural',  // Spruce (Bulepotan)
  arbor: 'ms-MY-OsmanNeural',               // Arbor (Pakcik)
};

export async function POST(req) {
  try {
    const { text, voice = 'spruce' } = await req.json();

    const cleanText = text
      ? text.replace(/\[Error:.*?\]/g, '').trim()
      : '';

    if (!cleanText) {
      return NextResponse.json({ error: 'Teks kosong' }, { status: 400 });
    }

    const tts = new MsEdgeTTS();
    const voiceId = VOICE_MAP[voice] || VOICE_MAP.spruce;

    await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = await tts.toStream(cleanText);

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (err) {
    console.error('Edge TTS Server Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}