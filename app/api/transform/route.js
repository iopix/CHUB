import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

// Vercel/Local bakal otomatis baca HF_TOKEN dari .env.local atau Vercel Env Vars
const hf = new HfInference(process.env.HF_TOKEN);

export async function POST(req) {
  try {
    const data = await req.formData();
    const prompt = data.get('prompt') || 'a beautiful portrait';
    const imageFile = data.get('image');
    
    if (!imageFile) return NextResponse.json({ error: 'Upload gambar dulu!' }, { status: 400 });

    const arrayBuffer = await imageFile.arrayBuffer();

    // Pake model yang stabil dan enteng
    const response = await hf.imageToImage({
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
      inputs: Buffer.from(arrayBuffer),
      parameters: {
        prompt: prompt,
        strength: 0.6 
      }
    });

    const base64 = Buffer.from(await response.arrayBuffer()).toString('base64');
    return NextResponse.json({ image: `data:image/jpeg;base64,${base64}` });

  } catch (err) {
    console.error("HF API Error:", err);
    return NextResponse.json({ error: "Server AI sibuk: " + err.message }, { status: 500 });
  }
}