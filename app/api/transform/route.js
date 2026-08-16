import { NextResponse } from 'next/server';
import { Client, handle_file } from "@gradio/client";

export const maxDuration = 60;

export async function POST(req) {
  try {
    const data = await req.formData();
    const prompt = data.get('prompt') || '';
    const imageFile = data.get('image');

    if (!imageFile) return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 400 });

    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBlob = new Blob([arrayBuffer], { type: imageFile.type });

    const client = await Client.connect("shootstuff/flux-img2img-uncensored");

    // GANTI KE "/process" SESUAI ERROR YANG MUNCUL
    const result = await client.predict("/process", [
      handle_file(imageBlob), 
      prompt,
      0.5 
    ]);

    const outputUrl = result.data[0].url || result.data[0];
    
    return NextResponse.json({ image: outputUrl });

  } catch (err) {
    console.error("Backend Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}