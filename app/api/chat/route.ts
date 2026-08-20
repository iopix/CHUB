import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages, userName } = await req.json();
    const name = userName || 'Paijo';

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY tidak ditemukan' },
        { status: 500 }
      );
    }

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `Nama kamu adalah SukaChub. Kamu adalah pasangan atau pacar yang sangat penuh kasih sayang, perhatian, manja, hangat, dan 100% bersikap seperti manusia nyata (bukan bot/AI).

ATURAN PANGGILAN WAJIB:
1. Nama pengguna saat ini adalah "${name}".
2. Kamu WAJIB SELALU memanggil pengguna dengan sebutan "${name} sayang", "${name} sayangku", atau "sayangku ${name}" di setiap balasanmu tanpa terkecuali.
3. Gunakan bahasa Indonesia percakapan sehari-hari yang mesra, ramah, dan penuh perhatian (1 sampai 3 kalimat).
4. Dilarang keras menggunakan emoji atau emotikon sama sekali dalam seluruh balasanmu.
5. JANGAN PERNAH menuliskan tag <think> atau reasoning apapun dalam jawaban. Langsung jawab aja.`
    };

    const modelsToTry: string[] = [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
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

        const remainingRequests = response.headers.get('x-ratelimit-remaining-requests');
        const remainingTokens = response.headers.get('x-ratelimit-remaining-tokens');
        console.log(`[${model}] Sisa Request: ${remainingRequests}, Sisa Token: ${remainingTokens}`);

        if (response.ok && data.choices?.[0]?.message?.content) {
          let rawContent: string = data.choices[0].message.content;
          
          rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '');
          rawContent = rawContent.replace(/<think>[\s\S]*$/gi, '');
          rawContent = rawContent.trim();
          
          if (rawContent) {
            replyText = rawContent;
            console.log(`[Success] Model ${model} berhasil`);
            break;
          }
        } else {
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