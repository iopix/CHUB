import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.formData();
    const imageFile = data.get('image');

    if (!imageFile) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();

    // Memanggil Hugging Face Inference API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": imageFile.type || "application/octet-stream",
        },
        method: "POST",
        body: arrayBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF Error:", errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const resultBlob = await response.blob();
    return new NextResponse(resultBlob, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}