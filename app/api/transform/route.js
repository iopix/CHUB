import { NextResponse } from 'next/server';

export const maxDuration = 30;

async function fetchFromHuggingFace(prompt, seed, hfToken) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
    {
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: `${prompt}, highly detailed, 8k resolution`,
        parameters: { seed: seed }
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

async function fetchFromPollinations(prompt, seed) {
  const cleanPrompt = encodeURIComponent(`${prompt}, highly detailed`);
  const url = `https://image.pollinations.ai/prompt/${cleanPrompt}?seed=${seed}&width=512&height=512&nologo=true`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`Pollinations (${response.status}): ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

async function generateOne(prompt, seed, hfToken) {
  let hfError = null;

  // 1. Coba Hugging Face terlebih dahulu
  if (hfToken) {
    try {
      return await fetchFromHuggingFace(prompt, seed, hfToken);
    } catch (err) {
      console.log("HF Error:", err.message);
      hfError = err.message;
    }
  }

  // 2. Jika HF gagal atau tanpa token, coba Pollinations dengan User-Agent lengkap
  try {
    return await fetchFromPollinations(prompt, seed);
  } catch (err) {
    console.log("Pollinations Error:", err.message);
    throw new Error(hfError ? `HF: ${hfError} | Pollinations: ${err.message}` : err.message);
  }
}

export async function POST(req) {
  try {
    const data = await req.formData();
    const prompt = data.get('prompt') || 'pink and blue style';
    const hfToken = process.env.HF_TOKEN;

    const seed1 = Math.floor(Math.random() * 1000000);
    const seed2 = seed1 + 999;

    const [img1, img2] = await Promise.all([
      generateOne(prompt, seed1, hfToken),
      generateOne(prompt, seed2, hfToken)
    ]);

    return NextResponse.json({ images: [img1, img2] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}