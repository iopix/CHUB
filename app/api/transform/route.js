import { NextResponse } from 'next/server';
import { Client, handle_file } from "@gradio/client";

export const maxDuration = 60;

export async function POST(req) {
  try {
    const data = await req.formData();
    const prompt = data.get('prompt') || '';
    const imageFile = data.get('image');

    if (!imageFile) return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 400 });

    // Ubah file ke buffer, lalu ke blob
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBlob = new Blob([arrayBuffer], { type: imageFile.type });

    // Koneksi ke Space
    const client = await Client.connect("shootstuff/flux-img2img-uncensored");

    // Kirim gambar (pakai handle_file) dan prompt
    // Endpoint biasanya "/predict" atau "/process"
    const result = await client.predict("/predict", [
      handle_file(imageBlob), // Ini wajib ada biar gambar lo terkirim
      prompt,                 // Prompt lo
      0.5                     // Strength (bikin 0.3-0.6 biar gak berubah total)
    ]);

    // Ambil hasil
    const outputUrl = result.data[0].url || result.data[0];
    
    return NextResponse.json({ image: outputUrl });

  } catch (err) {
    console.error("Backend Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}