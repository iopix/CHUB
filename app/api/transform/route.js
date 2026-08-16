import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req) {
  try {
    const data = await req.formData();
    const prompt = data.get('prompt') || 'pink and blue style';
    const hfToken = process.env.HF_TOKEN;

    const seed1 = Math.floor(Math.random() * 900000) + 100000;
    const seed2 = Math.floor(Math.random() * 900000) + 100000;

    const fullPrompt = `${prompt}, vibrant color palette, highly detailed, 8k resolution`;
    const encodedPrompt = encodeURIComponent(fullPrompt);

    // URL Gambar Langsung ke Browser (Memakai IP Komputer Anda, Bebas Error 429)
    const directUrl1 = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed1}&width=512&height=512&nologo=true`;
    const directUrl2 = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed2}&width=512&height=512&nologo=true`;

    let images = [directUrl1, directUrl2];

    // Jika HuggingFace Token Aktif & Responsif, Coba Ambil via HF
    if (hfToken && hfToken.trim() !== '') {
      try {
        const fetchHF = async (seed) => {
          const res = await fetch(
            "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
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
          if (!res.ok) return null;
          const arrayBuffer = await res.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          return `data:image/jpeg;base64,${base64}`;
        };

        const [img1, img2] = await Promise.all([fetchHF(seed1), fetchHF(seed2)]);
        if (img1 && img2) {
          images = [img1, img2];
        }
      } catch (err) {
        console.log("Fallback ke Direct URLs karena HF bermasalah");
      }
    }

    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}