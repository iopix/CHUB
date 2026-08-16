import { NextResponse } from 'next/server';

export const maxDuration = 10;

async function generateImage(prompt, seed, hfToken) {
  const fullPrompt = `${prompt}, high quality, 8k resolution`;

  // 1. Coba Hugging Face FLUX.1-schnell (Proses cepat ~2 detik)
  if (hfToken) {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        {
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: { seed: seed }
          }),
        }
      );

      if (response.ok) {
        const resBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(resBuffer).toString('base64');
        return `data:image/jpeg;base64,${base64Image}`;
      }
    } catch (e) {
      console.log("HF Error, beralih ke engine cadangan:", e.message);
    }
  }

  // 2. Engine AI Cadangan (Pollinations AI - Sangat Cepat & Bebas Timeout)
  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?seed=${seed}&width=512&height=512&nologo=true&model=flux`;
  const res = await fetch(pollUrl);
  if (!res.ok) throw new Error("Gagal memproses gambar");
  
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

export async function POST(req) {
  try {
    const data = await req.formData();
    const prompt = data.get('prompt') || 'pink and blue style';
    const hfToken = process.env.HF_TOKEN;

    const seed1 = Math.floor(Math.random() * 1000000);
    const seed2 = Math.floor(Math.random() * 1000000);

    // Jalankan 2 pemanggilan gambar secara cepat & paralel
    const [img1, img2] = await Promise.all([
      generateImage(prompt, seed1, hfToken),
      generateImage(prompt, seed2, hfToken)
    ]);

    return NextResponse.json({ images: [img1, img2] });
  } catch (err) {
    return NextResponse.json({ error: `Gagal membuat gambar: ${err.message}` }, { status: 500 });
  }
}