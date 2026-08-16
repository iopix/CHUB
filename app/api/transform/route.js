import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req) {
  try {
    const data = await req.formData();
    const prompt = data.get('prompt') || 'a transformed image';
    const imageFile = data.get('image');
    const hfToken = process.env.HF_TOKEN;

    const seed = Math.floor(Math.random() * 900000) + 100000;

    // 1. Jika pengguna upload gambar acuan (Image-to-Image)
    if (imageFile && imageFile.size > 0 && hfToken && hfToken.trim() !== '') {
      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        const base64InputImage = Buffer.from(arrayBuffer).toString('base64');

        const response = await fetch(
          "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
          {
            headers: {
              Authorization: `Bearer ${hfToken}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
              inputs: base64InputImage,
              parameters: {
                prompt: `${prompt}, high quality, 8k resolution`,
                strength: 0.7,
                seed: seed
              }
            }),
          }
        );

        if (response.ok) {
          const resBuffer = await response.arrayBuffer();
          const base64Result = Buffer.from(resBuffer).toString('base64');
          return NextResponse.json({ image: `data:image/jpeg;base64,${base64Result}` });
        }
      } catch (e) {
        console.log("HF Img2Img Error:", e.message);
      }
    }

    // 2. Fast Generator Fallback (Text-to-Image)
    const fullPrompt = `${prompt}, highly detailed, 8k resolution`;
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=512&height=512&nologo=true`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Gagal memproses gambar (${response.status})` },
        { status: response.status }
      );
    }

    const resArrayBuffer = await response.arrayBuffer();
    const base64Output = Buffer.from(resArrayBuffer).toString('base64');
    return NextResponse.json({ image: `data:image/jpeg;base64,${base64Output}` });

  } catch (err) {
    return NextResponse.json({ error: `Server Error: ${err.message}` }, { status: 500 });
  }
}