import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.formData();
    const imageBlob = data.get('image');
    const prompt = data.get('prompt') || 'anime style, high quality';

    // Memanggil Hugging Face Inference API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
        },
        method: "POST",
        body: imageBlob,
      }
    );

    if (!response.ok) throw new Error('Gagal memproses gambar di Hugging Face');

    const resultBlob = await response.blob();
    return new NextResponse(resultBlob, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}