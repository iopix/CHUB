import { NextResponse } from 'next/server';

export async function POST(req: Request) {
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

    // ✅ PRIORITASKAN MODEL DENGAN RPD TERTINGGI (biar awet)
    const modelsToTry: string[] = [
      'llama-3.1-8b-instant',     // RPD: 14.400 (paling besar!)
      'meta-llama/llama-3.3-70b-versatile', // RPD: 1.000
      'qwen/qwen3.6-27b',          // RPD: 1.000
      'openai/gpt-oss-20b',        // RPD: 1.000
      'openai/gpt-oss-120b',       // RPD: 1.000
      'groq/compound',             // RPD: 250 (cadangan terakhir)
    ];

    let replyText: string | null = null;
    let lastError: string | null = null;

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

        // ✅ BACA HEADER RATELIMIT (biar tau sisa kuota)
        const remainingRequests = response.headers.get('x-ratelimit-remaining-requests');
        const remainingTokens = response.headers.get('x-ratelimit-remaining-tokens');
        console.log(`[${model}] Sisa Request: ${remainingRequests}, Sisa Token: ${remainingTokens}`);

        if (response.ok && data.choices?.[0]?.message?.content) {
          let rawContent: string = data.choices[0].message.content;
          
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
          // ❌ Jika kena limit (429), langsung skip ke model berikutnya
          if (response.status === 429) {
            console.warn(`[Rate Limit] Model ${model} kehabisan kuota, skip...`);
            continue;
          }
          
          console.warn(`[Groq Fail] Model ${model}:`, data.error?.message || data);
          lastError = data.error?.message || `Model ${model} gagal`;
          
          if (data.error?.message?.includes('decommissioned') || 
              data.error?.message?.includes('deprecated')) {
            continue;
          }
        }
      } catch (err) {
        lastError = (err as Error).message;
        console.warn(`[Groq Error] Model ${model}:`, (err as Error).message);
      }
    }

    if (!replyText) {
      // ✅ Fallback dengan pesan tanpa emoji (sesuai aturan)
      return NextResponse.json({
        reply: 'Maaf sayang, aku lagi error nih. Coba ketik ulang ya gantengku.'
      });
    }

    return NextResponse.json({ reply: replyText });

  } catch (error) {
    console.error('Error Chat API:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Gagal terhubung ke AI' },
      { status: 500 }
    );
  }
}