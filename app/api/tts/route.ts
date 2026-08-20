import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

type VoiceType = 'spruce' | 'arbor';

interface VoiceConfig {
  voice: string;
  pitch: string;
  rate: string;
  volume: string;
}

const VOICE_CONFIG: Record<VoiceType, VoiceConfig> = {
  spruce: { 
    voice: 'id-ID-ArdiNeural', 
    pitch: '-34Hz',
    rate: '-10%',
    volume: '+50%'
  },
  arbor: { 
    voice: 'id-ID-ArdiNeural', 
    pitch: '-20Hz',
    rate: '+1%',
    volume: '+30%'
  },
};

function enhanceEmotionalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[Error:.*?\]/g, '')
    .replace(/\.\.\./g, '... ')
    .replace(/!+/g, '! ')
    .replace(/\?+/g, '? ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(req: Request) {
  try {
    const { text, voice = 'spruce' } = await req.json();
    const cleanText = enhanceEmotionalText(text);

    if (!cleanText) {
      return NextResponse.json({ error: 'Teks kosong' }, { status: 400 });
    }

    const tts = new MsEdgeTTS();
    const voiceKey: VoiceType = (voice in VOICE_CONFIG) ? voice : 'spruce';
    const config = VOICE_CONFIG[voiceKey];

    await tts.setMetadata(config.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = await tts.toStream(cleanText, {
      pitch: config.pitch,
      rate: config.rate,
      volume: config.volume,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of audioStream) {
            controller.enqueue(new Uint8Array(chunk));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (err) {
    console.error('Edge TTS Server Error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal memproses TTS' },
      { status: 500 }
    );
  }
}