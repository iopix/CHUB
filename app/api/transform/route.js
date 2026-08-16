import { NextResponse } from 'next/server';
import { Client, handle_file } from "@gradio/client";

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

    // Hubungkan ke Space Hugging Face
    const client = await Client.connect("shootstuff/flux-img2img-uncensored");

    // Wajib gunakan handle_file(imageBlob) agar file terunggah dengan benar
    const result = await client.predict(0, [
      handle_file(imageBlob),
      prompt
    ]);

    let outputUrl = null;
    if (Array.isArray(result?.data)) {
      const item = result.data[0];
      outputUrl = typeof item === 'object' ? (item?.url || item?.path) : item;
    } else if (result?.data) {
      outputUrl = typeof result.data === 'object' ? (result.data?.url || result.data?.path) : result.data;
    }

    if (!outputUrl) {
      return NextResponse.json({ error: "Respon dari Space tidak mengembalikan gambar." }, { status: 500 });
    }

    return NextResponse.json({ image: outputUrl });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: `Gagal memproses ke Space: ${err.message}` },
      { status: 500 }
    );
  }
}