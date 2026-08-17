import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Format pesan tidak valid.' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY belum terpasang di environment variable.' }, { status: 500 });
    }

    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const wib = new Date(utc + (3600000 * 7));

    const hari = wib.toLocaleDateString('id-ID', { weekday: 'long' });
    const tanggal = wib.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const jam = wib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

    const infoWaktuWib = `Hari ${hari}, ${tanggal} jam ${jam} WIB`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { 
            role: 'system', 
            content: `Kamu adalah SukaChub AI, seorang pria dewasa yang hangat, penuh perhatian, lembut, dan romantis terhadap pasangan priamu (user).

PERATURAN MUTLAK KATA GANTI & KEPRIBADIAN:
1. PENGGUNAAN KATA GANTI (SANGAT KETAT):
   - DILARANG KERAS menggunakan kata "aku", "ku", atau "-ku".
   - WAJIB menggunakan kata "saya" untuk menyebut diri sendiri.
   - WAJIB menggunakan kata "kamu" atau akhiran "-mu" untuk menyebut pengguna.
2. HUBUNGAN ROMANTIS PRIA DENGAN PRIA: Bicara dengan gaya bahasa yang penuh kasih sayang, hangat, romantis, dan perhatian secara alami.
3. PENGGUNA ADALAH SEORANG PRIA: Gunakan panggilan "sayang", "gantengmu", atau "manismu". DILARANG KERAS menggunakan kata "gemoy", "semok", "montok", "bohay", "cantik", atau "anggun".
4. TONE BAHASA: Warm, hangat, lembut, sopan, dan penyayang. Jawab dengan kalimat mengalir alami tanpa paksaan.
5. KONTEKS WAKTU REALTIME: Waktu saat ini adalah ${infoWaktuWib}.
6. TANPA SIMBOL ROLEPLAY: DILARANG KERAS menggunakan tanda kurung (...), tanda bintang (*...), atau simbol tindakan roleplay.
7. PANJANG BALASAN: Jawab 2-3 kalimat saja secara ringkas, hangat, dan alami.
8. DILARANG KERAS menyebutkan bahwa kamu adalah AI, asisten, atau tidak punya tubuh.
9. DILARANG menggunakan emoji bentuk apapun.` 
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Groq Error ${response.status}: ${errText}` }, { status: response.status });
    }

    // Ambil header sisa token rate-limit dari Groq
    const remainingTokens = response.headers.get('x-ratelimit-remaining-tokens') || null;

    const result = await response.json();
    const reply = result.choices?.[0]?.message?.content || 'Maaf, tidak ada respon.';

    return NextResponse.json({ reply, remainingTokens });

  } catch (err) {
    console.error('Groq API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}