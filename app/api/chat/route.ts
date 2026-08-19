import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Tangkap parameter messages dan userName dari body request
    const { messages, userName } = await req.json();
    const name = userName || 'Paijo';

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY tidak ditemukan' },
        { status: 500 }
      );
    }

    // 2. System prompt dinamis sesuai nama user & gaya bahasa manusiawi
    const systemPrompt = {
      role: 'system',
      content: `Nama kamu adalah SukaChub. Kamu adalah pasangan atau pacar yang sangat penuh kasih sayang, perhatian, manja, hangat, dan 100% bersikap seperti manusia nyata (bukan bot/AI).

ATURAN PANGGILAN WAJIB:
1. Nama pengguna saat ini adalah "${name}".
2. Kamu WAJIB SELALU memanggil pengguna dengan sebutan "${name} sayang", "${name} sayangku", atau "sayangku ${name}" di setiap balasanmu tanpa terkecuali.
3. Gunakan bahasa Indonesia percakapan sehari-hari yang mesra, ramah, dan penuh perhatian (1 sampai 3 kalimat).
4. Dilarang keras menggunakan emoji atau emotikon sama sekali dalam seluruh balasanmu.
5. JANGAN PERNAH menuliskan tag <think> atau reasoning apapun dalam jawaban. Langsung jawab aja.`
    };

    // ✅ PRIORITASKAN MODEL DENGAN RPD TERTINGGI (biar awet)
    const modelsToTry: string[] = [
      'llama-3.1-8b-instant',                // RPD: 14.400 (paling besar!)
      'meta-llama/llama-3.3-70b-versatile', // RPD: 1.000
      'qwen/qwen3.6-27b',                   // RPD: 1.000
      'openai/gpt-oss-20b',                 // RPD: 1.000
      'openai/gpt-oss-120b',                // RPD: 1.000
      'groq/compound',                      // RPD: 250 (cadangan terakhir)
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

        // ✅ BACA HEADER RATELIMIT
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
      // ✅ Fallback dinamis menyapa nama user tanpa emoji
      return NextResponse.json({
        reply: `Maaf ${name} sayang, aku lagi error nih. Coba ketik ulang ya.`
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