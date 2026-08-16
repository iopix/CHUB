import { NextResponse } from 'next/server';
import { Client } from "@gradio/client";

export const maxDuration = 60;

export async function POST(req) {
  try {
    const data = await req.formData();
    const prompt = data.get('prompt') || '';
    const imageFile = data.get('image');

    if (!imageFile) {
      return NextResponse.json({ error: 'File gambar wajib diunggah.' }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBlob = new Blob([arrayBuffer], { type: imageFile.type });

    // Menghubungkan langsung ke Hugging Face Space Gradio
    const client = await Client.connect("shootstuff/flux-img2img-uncensored");

    const result = await client.predict("/predict", {
      image: imageBlob,
      prompt: prompt,
      strength: 0.6,
    });

    // Mengambil URL hasil dari Gradio response
    const outputUrl = result.data?.[0]?.url || result.data?.[0];

    return NextResponse.json({ image: outputUrl });

  } catch (err) {
    console.error("Gradio Space Error:", err);
    return NextResponse.json({ error: `Gagal memproses ke Space: ${err.message}` }, { status: 500 });
  }
}