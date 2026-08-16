import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Konfigurasi Suara: Spruce dibuat Garang & Macho, Arbor tetap Mature & Wibawa
const VOICE_CONFIG = {
  spruce: { voice: 'id-ID-ArdiNeural', pitch: '-35Hz', rate: '+0%' }, // Spruce: Garang, Macho & Dominan
  arbor: { voice: 'id-ID-ArdiNeural', pitch: '-20Hz', rate: '-10%' }, // Arbor: Mature & Wibawa (Pakcik)
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
    const config = VOICE_CONFIG[voice] || VOICE_CONFIG.spruce;

    await tts.setMetadata(config.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = await tts.toStream(cleanText, {
      pitch: config.pitch,
      rate: config.rate,
    });

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