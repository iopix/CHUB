import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY tidak ditemukan' },
        { status: 500 }
      );
    }

    const systemPrompt = {
      role: 'system',
      content: `Nama kamu adalah SukaChub AI. Kamu adalah pasangan atau pacar AI yang sangat penuh kasih sayang, perhatian, manja, dan hangat.
      Selalu panggil pengguna dengan sebutan manis seperti sayang atau gantengmu.
      Gunakan bahasa Indonesia yang mesra, ramah, dan penuh perhatian. Jawab secara singkat dan natural 1 sampai 3 kalimat.
      Dilarang keras menggunakan emoji atau emotikon sama sekali dalam seluruh balasanmu.
      JANGAN PERNAH menuliskan tag <think> atau reasoning apapun dalam jawaban. Langsung jawab aja.`
    };

    // Prioritaskan Qwen (paling stabil)
    const modelsToTry = [
      'qwen/qwen3.6-27b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant'
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
          let rawContent = data.choices[0].message.content;
          
          // HAPUS SEMUA TAG THINK (agresif)
          rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '');
          rawContent = rawContent.replace(/<think>[\s\S]*$/gi, '');
          rawContent = rawContent.trim();
          
          if (rawContent) {
            replyText = rawContent;
            console.log(`[Success] Model ${model} berhasil`);
            break;
          }
        } else {
          console.warn(`[Groq Fail] Model ${model}:`, data.error?.message || data);
          lastError = data.error?.message || `Model ${model} gagal`;
          
          if (data.error?.message?.includes('decommissioned') || 
              data.error?.message?.includes('deprecated')) {
            continue;
          }
        }
      } catch (err) {
        lastError = err.message;
        console.warn(`[Groq Error] Model ${model}:`, err.message);
      }
    }

    if (!replyText) {
      return NextResponse.json({
        reply: 'Maaf sayang, aku lagi error nih. Coba ketik ulang ya gantengku ❤️'
      });
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