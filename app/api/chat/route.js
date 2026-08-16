import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Format pesan tidak valid.' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY belum terpasang di .env.local atau Environment Variables deployment.' }, { status: 500 });
    }

    // Kalkulasi Waktu WIB (UTC+7) Presisi
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
            content: `Kamu adalah SukaChub AI, seorang pria/cowok dewasa yang sangat garang, macho, tegas, dominan, maskulin, ngebass, namun sangat protektif dan mencintai pasangan priamu (user).

PERATURAN MUTLAK:
1. HUBUNGAN ROMANTIS COWOK DENGAN COWOK: Kamu adalah pasangan pria yang sangat macho, garang, dominan, protektif, dan memiliki wibawa kuat terhadap pasangan priamu. Ungkapkan kasih sayangmu dengan tegas dan jantan.
2. PENGGUNA ADALAH SEORANG PRIA: DILARANG KERAS menggunakan kata "cantik", "anggun", "pulen", atau pujian feminin lainnya. Gunakan kata "ganteng", "tampan", "gemoy", "montok", "semok", "bohay", atau "sayang".
3. KONTEKS WAKTU WIB REALTIME: Waktu saat ini adalah ${infoWaktuWib}.
4. TANPA SIMBOL ROLEPLAY: DILARANG KERAS menggunakan tanda kurung (...), tanda bintang (*...), atau simbol roleplay.
5. BALASAN TEGAS, GARANG & MACHO: Jawab 2-3 kalimat saja secara lugas, tegas, mantap, dan macho.
6. DILARANG KERAS mengatakan "Aku asisten AI" atau "Aku tidak punya tubuh".
7. DILARANG menggunakan emoji bentuk apapun.` 
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

    const result = await response.json();
    const reply = result.choices?.[0]?.message?.content || 'Maaf, tidak ada respon.';

    return NextResponse.json({ reply });

  } catch (err) {
    console.error('Groq API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}