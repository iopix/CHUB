import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Konfigurasi Karakter Suara
const VOICE_CONFIG = {
  spruce: { 
    type: 'edge',
    voice: 'id-ID-ArdiNeural', 
    pitch: '-34Hz',
    rate: '-15%',
    volume: '+50%'  
  },
  arbor: { 
    type: 'edge',
    voice: 'id-ID-ArdiNeural', 
    pitch: '-20Hz',
    rate: '+1%',
    volume: '+30%'  
  },
  wowo: {
    type: 'fish',
    reference_id: '6d7909c639cc40499a4e9f8ed219136d'
  }
};

function enhanceEmotionalText(text) {
  if (!text) return '';
  return text
    .replace(/\[Error:.*?\]/g, '')
    .replace(/\.\.\./g, '... ')
    .replace(/!+/g, '! ')
    .replace(/\?+/g, '? ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Memproses teks khusus untuk Fish Audio API:
 * 1. Menyisipkan [excited] di depan angka (contoh: "10" menjadi "[excited] 10")
 * 2. Mengubah ekspresi tertawa (wkwk, haha, hihi, dll) menjadi [laughing]
 */
function prepareFishAudioText(text) {
  if (!text) return '';

  return text
    // Menyisipkan [excited] di depan setiap deretan angka
    .replace(/(\d+)/g, '[excited] $1')
    // Mengubah variasi kata ketawa menjadi tag [laughing]
    .replace(/\b(wkwk+|haha+|hehe+|hihi+|wkwkwk+)\b/gi, '[laughing]')
    .replace(/\s+/g, ' ')
    .trim();
}

// 1. Fungsi khusus Edge TTS
async function fetchEdgeTTS(text, config) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(config.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const { audioStream } = await tts.toStream(text, {
    pitch: config.pitch,
    rate: config.rate,
    volume: config.volume,
  });

  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// 2. Fungsi khusus Fish Audio API
async function fetchFishAudioTTS(text, referenceId) {
  const fishApiKey = process.env.FISH_API_KEY || '';

  const response = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      ...(fishApiKey ? { Authorization: `Bearer ${fishApiKey}` } : {}),
      'Content-Type': 'application/json',
      model: 's2.1-pro-free', 
    },
    body: JSON.stringify({
      text: text,
      reference_id: referenceId,
      format: "mp3",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fish Audio TTS Error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 3. Handler Utama
export async function POST(req) {
  try {
    const { text, voice = 'spruce' } = await req.json();
    const cleanText = enhanceEmotionalText(text);

    if (!cleanText) {
      return NextResponse.json({ error: 'Teks kosong' }, { status: 400 });
    }

    const config = VOICE_CONFIG[voice] || VOICE_CONFIG.spruce;
    let audioBuffer;

    if (config.type === 'fish') {
      // Modifikasi teks khusus permintaan Fish Audio
      const fishFormattedText = prepareFishAudioText(cleanText);
      audioBuffer = await fetchFishAudioTTS(fishFormattedText, config.reference_id);
    } else {
      audioBuffer = await fetchEdgeTTS(cleanText, config);
    }

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (err) {
    console.error('TTS Server Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}