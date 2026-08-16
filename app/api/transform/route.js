import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    if (!process.env.HF_TOKEN) {
      return NextResponse.json(
        { error: 'HF_TOKEN belum dipasang atau di-redeploy di Vercel' },
        { status: 500 }
      );
    }

    const data = await req.formData();
    const imageFile = data.get('image');

    if (!imageFile) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());

    const response = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        method: "POST",
        body: buffer,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      let message = errText;
      try {
        const errJson = JSON.parse(errText);
        message = errJson.error || errText;
      } catch (e) {}

      return NextResponse.json(
        { error: `Hugging Face (${response.status}): ${message}` },
        { status: response.status }
      );
    }

    const resBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(resBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json({ image: dataUrl });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}