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

    // Hubungkan ke Space Hugging Face
    const client = await Client.connect("shootstuff/flux-img2img-uncensored");

    // Daftar nama endpoint yang mungkin digunakan oleh Space tersebut
    const validEndpoints = ["/process", "/js_fn", "/lambda", "/js_fn_1"];
    let result = null;
    let lastError = null;

    // Otomatis mencoba endpoint yang tersedia sampai berhasil
    for (const endpoint of validEndpoints) {
      try {
        result = await client.predict(endpoint, {
          image: imageBlob,
          prompt: prompt,
        });
        if (result) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!result) {
      throw lastError || new Error("Gagal terhubung ke endpoint Space.");
    }

    // Ekstrak URL gambar hasil pemrosesan
    let outputUrl = null;
    if (Array.isArray(result.data)) {
      const item = result.data[0];
      outputUrl = typeof item === 'object' ? (item?.url || item?.path) : item;
    } else if (result.data) {
      outputUrl = typeof result.data === 'object' ? (result.data?.url || result.data?.path) : result.data;
    }

    if (!outputUrl) {
      throw new Error("Format respon gambar dari Space tidak sesuai.");
    }

    return NextResponse.json({ image: outputUrl });

  } catch (err) {
    console.error("Gradio API Error:", err);
    return NextResponse.json({ error: `Gagal memproses gambar: ${err.message}` }, { status: 500 });
  }
}