import { NextResponse } from 'next/server';

export const maxDuration = 60;

async function fetchSingleImage(prompt, seed) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: prompt,
        parameters: { seed: seed }
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF Error (${response.status}): ${errText}`);
  }

  const resBuffer = await response.arrayBuffer();
  const base64Image = Buffer.from(resBuffer).toString('base64');
  return `data:image/jpeg;base64,${base64Image}`;
}

export async function POST(req) {
  try {
    if (!process.env.HF_TOKEN) {
      return NextResponse.json({ error: 'HF_TOKEN belum terpasang di Vercel' }, { status: 500 });
    }

    const data = await req.formData();
    const prompt = data.get('prompt') || 'cyberpunk style, high quality, 4k';

    // Membuat 2 seed acak agar menghasilkan 2 gambar berbeda
    const seed1 = Math.floor(Math.random() * 1000000);
    const seed2 = Math.floor(Math.random() * 1000000);

    // Menjalankan 2 pemanggilan API secara paralel bersamaan
    const [img1, img2] = await Promise.all([
      fetchSingleImage(prompt, seed1),
      fetchSingleImage(prompt, seed2)
    ]);

    return NextResponse.json({ images: [img1, img2] });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}