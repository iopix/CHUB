import { NextResponse, NextRequest } from 'next/server';

// Durasi maksimum eksekusi Vercel/Serverless
export const maxDuration = 60;

interface VoiceConfig {
  reference_id: string;
}

// Konfigurasi 5 Karakter Suara Fish Audio
// Silakan sesuaikan nilai 'reference_id' sesuai ID karakter pada akun Fish Audio Anda
const VOICE_CONFIG: Record<string, VoiceConfig> = {
  voice1: {
    reference_id: 'a7b474a678b54034b5e4d11c1be34c14',
  },
  voice2: {
    reference_id: 'dee22c8be7dc4943b36ccd452eba4ddf',
  },
  voice3: {
    reference_id: '33712605756e4d87b4ebeb003dbb5217',
  },
  voice4: {
    reference_id: 'c6509c95d08046a4adc76880ce22789b',
  },
  voice5: {
    reference_id: 'd84cb9ec55574ff68351199500b0c446',
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

// Fungsi Konversi Angka ke Kata (Terbilang Bahasa Indonesia)
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
 * Normalisasi Teks Khusus Fish Audio API (Bahasa Indonesia):
 * Mengubah simbol matematika, desimal/koma, pecahan, dan tanda baca keyboard
 * menjadi ejaan teks Indonesia yang presisi.
 */
function prepareFishAudioText(text: string): string {
  if (!text) return '';

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  let result = text;

  // 1. Bersihkan Tag Error & Titik Tiga
  result = result
    .replace(/\[Error:.*?\]/g, '')
    .replace(/\.\.\./g, '... ');

  // 2. Format Jam 00.00 / 00:00 -> "kosong kosong kosong kosong"
  result = result.replace(/\b00[\.\:]00\b/g, 'kosong kosong kosong kosong');

  // 3. Format Jam HH.MM / HH:MM (Contoh: 19.03 -> "sembilan belas kosong tiga")
  result = result.replace(/\b(\d{1,2})[\.\:](\d{2})\b/g, (_, jam: string, menit: string) => {
    const jamNum = parseInt(jam, 10);
    const menitNum = parseInt(menit, 10);
    
    if (jamNum >= 0 && jamNum <= 23 && menitNum >= 0 && menitNum <= 59) {
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
    }
    return _;
  });

  // 4. Format Tanggal (Contoh: 21/08/2026 atau 21-08-2026)
  result = result.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g, (_, tgl: string, bln: string, thn: string) => {
    const idxBulan = parseInt(bln, 10) - 1;
    const bulanStr = namaBulan[idxBulan] || bln;
    return `${angkaKeTeks(parseInt(tgl, 10))} ${bulanStr} ${angkaKeTeks(parseInt(thn, 10))}`;
  });

  // 5. Simbol Komparasi & Operator Gabungan
  result = result
    .replace(/!=/g, ' tidak sama dengan ')
    .replace(/<=/g, ' kurang dari atau sama dengan ')
    .replace(/>=/g, ' lebih dari atau sama dengan ')
    .replace(/==/g, ' sama dengan ');

  // 6. Logika Desimal & Koma
  // Desimal berbasis nol (0,5 / 0.5 -> "nol koma lima")
  result = result.replace(/\b0[\,\.](\d+)\b/g, (_, desimal: string) => {
    return `nol koma ${angkaKeTeks(parseInt(desimal, 10))}`;
  });
  // Desimal umum antar angka (1,5 / 3.14 -> "satu koma lima")
  result = result.replace(/(\d+)[\,\.](\d+)/g, (_, bulat: string, desimal: string) => {
    return `${angkaKeTeks(parseInt(bulat, 10))} koma ${angkaKeTeks(parseInt(desimal, 10))}`;
  });

  // 7. Simbol Matematika dari Keyboard (Di antara Angka)
  result = result
    // Pecahan & Slash angka (1/2 -> "1 per 2")
    .replace(/(\d+)\s*[\/]\s*(\d+)/g, '$1 per $2')
    // Slash teks biasa (pria/wanita -> "pria atau wanita")
    .replace(/([a-zA-Z]+)\s*[\/]\s*([a-zA-Z]+)/g, '$1 atau $2')
    // Perkalian: 'x', '×', atau '*'
    .replace(/(\d+)\s*[xX×\*]\s*(\d+)/g, '$1 dikali $2')
    // Pembagian: '÷', ':', atau '/'
    .replace(/(\d+)\s*[÷\:]\s*(\d+)/g, '$1 dibagi $2')
    // Pengurangan: '-' HANYA jika berada di antara angka (kata ulang "anak-anak" tetap utuh)
    .replace(/(\d+)\s*[\-]\s*(\d+)/g, '$1 kurang $2')
    // Penjumlahan & Pangkat
    .replace(/(\d+)\s*[\+]\s*(\d+)/g, '$1 tambah $2')
    .replace(/(\d+)\s*[\^]\s*(\d+)/g, '$1 pangkat $2')
    // Kurung angka: (5) atau [5]
    .replace(/[\(\[]\s*(\d+)\s*[\)\]]/g, ' $1 ');

  // 8. Simbol Tunggal & Tanda Baca Keyboard Lainnya
  result = result
    .replace(/\+/g, ' tambah ')
    .replace(/÷/g, ' dibagi ')
    .replace(/=/g, ' sama dengan ')
    .replace(/</g, ' kurang dari ')
    .replace(/>/g, ' lebih dari ')
    .replace(/%/g, ' persen ')
    .replace(/\$/g, ' dolar ')
    .replace(/&/g, ' dan ')
    .replace(/@/g, ' at ')
    .replace(/#/g, ' pagar ');

  // 9. Terbilang Angka Mandiri yang Masih Tersisa
  result = result.replace(/\b(\d+)\b/g, (match: string) => {
    return angkaKeTeks(parseInt(match, 10));
  });

  // 10. Tag Ekspresi Khusus Fish Audio
  result = result.replace(/\b(wkwk+|haha+|hehe+|hihi+|wkwkwk+)\b/gi, '[laughing]');

  return result.replace(/\s+/g, ' ').trim();
}

// Fungsi khusus pemanggilan API Fish Audio
async function fetchFishAudioTTS(text: string, referenceId: string): Promise<Buffer> {
  const fishApiKey = process.env.FISH_API_KEY || '';

  const response = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: {
      ...(fishApiKey ? { Authorization: `Bearer ${fishApiKey}` } : {}),
      'Content-Type': 'application/json',
      model: 's2.1-pro-free',
    },
    body: JSON.stringify({
      text: text,
      reference_id: referenceId,
      format: 'mp3',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fish Audio TTS Error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Handler Utama POST Route
export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'voice1' } = await req.json();
    const cleanText = enhanceEmotionalText(text);

    if (!cleanText) {
      return NextResponse.json({ error: 'Teks kosong' }, { status: 400 });
    }

    const config = VOICE_CONFIG[voice] || VOICE_CONFIG.voice1;
    const fishFormattedText = prepareFishAudioText(cleanText);
    const audioBuffer = await fetchFishAudioTTS(fishFormattedText, config.reference_id);

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