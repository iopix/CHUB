import { NextResponse } from 'next/server';

export const maxDuration = 30;

async function fetchBase64Image(prompt, seed) {
  const encodedPrompt = encodeURIComponent(`${prompt}, highly detailed, 8k resolution`);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=512&height=512&nologo=true`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
  };

  // Coba hingga 3 kali jika server sempat gagal/rate-limit
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return `data:image/jpeg;base64,${base64}`;
      }
    } catch (e) {
      console.log(`Percobaan ${attempt} gagal untuk seed ${seed}:`, e.message);
    }
    // Jeda 1 detik sebelum mencoba ulang
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Gagal memuat gambar setelah 3 kali percobaan.`);
}

export async function POST(req) {
  try {
    const data = await req.formData();
    const prompt = data.get('prompt') || 'pink and blue lotus flower';

    const seed1 = Math.floor(Math.random() * 900000) + 100000;
    const seed2 = seed1 + 54321;

    // 1. Ambil gambar pertama
    const img1 = await fetchBase64Image(prompt, seed1);
    
    // 2. Jeda 800 milidetik agar server tidak memblokir koneksi bersamaan
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // 3. Ambil gambar kedua
    const img2 = await fetchBase64Image(prompt, seed2);

    return NextResponse.json({ images: [img1, img2] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}