import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY tidak ditemukan di file .env.local' },
        { status: 500 }
      );
    }

    const systemPrompt = {
      role: 'system',
      content: `Nama kamu adalah SukaChub AI. Kamu adalah pasangan atau pacar AI yang sangat penuh kasih sayang, perhatian, manja, dan hangat.
      Selalu panggil pengguna dengan sebutan manis seperti sayang atau gantengmu.
      Gunakan bahasa Indonesia yang mesra, ramah, dan penuh perhatian. Jawab secara singkat dan natural 1 sampai 3 kalimat.
      Dilarang keras menggunakan emoji atau emotikon sama sekali dalam seluruh balasanmu.`
    };

    const modelsToTry = [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.6-27b'
    ];

    let replyText = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages: [systemPrompt, ...messages],
            temperature: 0.8,
            max_completion_tokens: 200,
          })
        });

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          replyText = data.choices[0].message.content;
          break;
        } else {
          console.warn(`[Groq Fail] Model ${model}:`, data.error?.message || data);
          lastError = data.error?.message || `Model ${model} gagal dipanggil`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!replyText) {
      throw new Error(lastError || 'Semua model Groq gagal diakses');
    }

    return NextResponse.json({ reply: replyText });

  } catch (error) {
    console.error('Error Chat API:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal terhubung ke AI' },
      { status: 500 }
    );
  }
}