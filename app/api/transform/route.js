import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req) {
  try {
    const data = await req.formData();
    const prompt = data.get('prompt') || 'high quality detailed image';
    const seed = Math.floor(Math.random() * 999999);

    // Encode prompt agar aman dimasukkan ke URL
    const encodedPrompt = encodeURIComponent(prompt.trim());
    
    // URL API Pollinations FLUX (Bebas Queue & Tanpa Rate Limit)
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&model=flux&nologo=true`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "image/*"
      }
    });

    if (!response.ok) {
      throw new Error(`Server Pollinations sibuk (${response.status})`);
    }

    // Ubah hasil gambar ke format Base64 untuk dikirim balik ke frontend
    const arrayBuffer = await response.arrayBuffer();
    const base64Output = Buffer.from(arrayBuffer).toString('base64');
    
    return NextResponse.json({ 
      image: `data:image/jpeg;base64,${base64Output}` 
    });

  } catch (err) {
    console.error("Pollinations Error:", err);
    return NextResponse.json(
      { error: `Gagal memproses gambar: ${err.message}` }, 
      { status: 500 }
    );
  }
}