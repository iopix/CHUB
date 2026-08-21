import { NextResponse, NextRequest } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Durasi maksimum eksekusi Vercel/Serverless
export const maxDuration = 60;

interface VoiceConfig {
  type: 'edge' | 'fish';
  voice?: string;
  pitch?: string;
  rate?: string;
  volume?: string;
  reference_id?: string;
}

// Konfigurasi Karakter Suara
const VOICE_CONFIG: Record<string, VoiceConfig> = {
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

// 1. Fungsi Konversi Angka ke Kata (Terbilang Bahasa Indonesia)
function angkaKeTeks(n: number): string {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  n = Math.floor(n);
  if (n < 12) return satuan[n];
  if (n < 20) return angkaKeTeks(n - 10) + ' belas';
  if (n < 100) return angkaKeTeks(Math.floor(n / 10)) + ' puluh ' + angkaKeTeks(n % 10);
  if (n < 200) return 'seratus ' + angkaKeTeks(n - 100);
  if (n < 1000) return angkaKeTeks(Math.floor(n / 100)) + ' ratus ' + angkaKeTeks(n % 100);
  if (n < 2000) return 'seribu ' + angkaKeTeks(n - 1000);
  if (n < 1000000) return angkaKeTeks(Math.floor(n / 1000)) + ' ribu ' + angkaKeTeks(n % 1000);
  if (n < 1000000000) return angkaKeTeks(Math.floor(n / 1000000)) + ' juta ' + angkaKeTeks(n % 1000000);
  return n.toString();
}

/**
 * Normalisasi Teks Khusus Fish Audio API (Indonesia):
 * - Jam 00.00 / 00:00 -> "kosong kosong kosong kosong"
 * - Format Jam HH.MM -> "19.03" menjadi "sembilan belas kosong tiga"
 * - Tanggal (21/08/2026 -> 21 Agustus 2026)
 * - Operasi & Simbol Matematika Lengkap -> Ejaan Bahasa Indonesia
 * - Angka terbilang + Tag [excited]
 * - Ketawa -> Tag [laughing]
 */
function prepareFishAudioText(text: string): string {
  if (!text) return '';

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  let result = text;

  // 1. Format Jam 00.00 atau 00:00 -> Kosong kosong kosong kosong
  result = result.replace(/\b00[\.\:]00\b/g, 'kosong kosong kosong kosong');

  // 2. Format Jam HH.MM / HH:MM (Contoh: 19.03 -> "sembilan belas kosong tiga")
  result = result.replace(/\b(\d{1,2})[\.\:](\d{2})\b/g, (_, jam: string, menit: string) => {
    const jamNum = parseInt(jam, 10);
    const menitNum = parseInt(menit, 10);
    
    const jamStr = angkaKeTeks(jamNum);
    let menitStr = '';
    
    if (menitNum === 0) {
      menitStr = ''; 
    } else if (menit.startsWith('0')) {
      menitStr = ` kosong ${angkaKeTeks(menitNum)}`;
    } else {
      menitStr = ` ${angkaKeTeks(menitNum)}`;
    }

    return `${jamStr}${menitStr}`;
  });

  // 3. Format Tanggal (Contoh: 21/08/2026 atau 21-08-2026)
  result = result.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g, (_, tgl: string, bln: string, thn: string) => {
    const idxBulan = parseInt(bln, 10) - 1;
    const bulanStr = namaBulan[idxBulan] || bln;
    return `${tgl} ${bulanStr} ${thn}`;
  });

  // 4. Operasi & Simbol Matematika Lengkap Bahasa Indonesia
  result = result
    .replace(/!=/g, ' tidak sama dengan ')
    .replace(/<=/g, ' kurang dari atau sama dengan ')
    .replace(/>=/g, ' lebih dari atau sama dengan ')
    .replace(/==/g, ' sama dengan ')
    .replace(/=/g, ' sama dengan ')
    .replace(/</g, ' kurang dari ')
    .replace(/>/g, ' lebih dari ')
    .replace(/\*/g, ' dikali ')
    .replace(/x/gi, ' dikali ')
    .replace(/:/g, ' dibagi ')
    .replace(/\+/g, ' tambah ')
    .replace(/\-/g, ' kurang ')
    .replace(/%/g, ' persen ')
    .replace(/\^/g, ' pangkat ');

  // 5. Terbilang Angka + Tag [excited]
  result = result.replace(/(\d+)/g, (match: string) => {
    const num = parseInt(match, 10);
    return `[excited] ${angkaKeTeks(num)}`;
  });

  // 6. Tag Ketawa
  result = result.replace(/\b(wkwk+|haha+|hehe+|hihi+|wkwkwk+)\b/gi, '[laughing]');

  return result.replace(/\s+/g, ' ').trim();
}

// 2. Fungsi khusus Edge TTS
async function fetchEdgeTTS(text: string, config: VoiceConfig): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(config.voice || 'id-ID-ArdiNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const { audioStream } = await tts.toStream(text, {
    pitch: config.pitch,
    rate: config.rate,
    volume: config.volume,
  });

  const chunks: Uint8Array[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk as Uint8Array);
  }

  return Buffer.concat(chunks);
}

// 3. Fungsi khusus Fish Audio API
async function fetchFishAudioTTS(text: string, referenceId: string): Promise<Buffer> {
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

// 4. Handler Utama
export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'spruce' } = await req.json();
    const cleanText = enhanceEmotionalText(text);

    if (!cleanText) {
      return NextResponse.json({ error: 'Teks kosong' }, { status: 400 });
    }

    const config = VOICE_CONFIG[voice] || VOICE_CONFIG.spruce;
    let audioBuffer: Buffer;

    if (config.type === 'fish') {
      const fishFormattedText = prepareFishAudioText(cleanText);
      audioBuffer = await fetchFishAudioTTS(fishFormattedText, config.reference_id || '');
    } else {
      audioBuffer = await fetchEdgeTTS(cleanText, config);
    }

    // Konversi Buffer ke Uint8Array agar kompatibel dengan NextResponse BodyInit
    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('TTS Server Error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}