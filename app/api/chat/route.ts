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
        { reply: `Maaf ${name} sayang, GROQ_API_KEY belum terpasang di Vercel.` },
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

    // Model resmi aktif dari Groq (hapus model deprecated)
    const modelsToTry: string[] = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
    ];

    let replyText: string | null = null;
    let lastError: string | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY.trim()}`
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
          let rawContent: string = data.choices[0].message.content;
          
          rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '');
          rawContent = rawContent.replace(/<think>[\s\S]*$/gi, '');
          rawContent = rawContent.trim();
          
          if (rawContent) {
            replyText = rawContent;
            break;
          }
        } else {
          lastError = `[${model}] ${data.error?.message || response.statusText}`;
          console.warn(`[Groq Fail]`, lastError);
        }
      } catch (err) {
        lastError = `[${model}] ${(err as Error).message}`;
      }
    }

    if (!replyText) {
      // Menampilkan detail error asli di chat agar langsung ketahuan di produksi
      return NextResponse.json({
        reply: `Maaf ${name} sayang, aku lagi error nih. Detail: ${lastError}`
      });
    }

    return NextResponse.json({ reply: replyText });

  } catch (error) {
    console.error('Error Chat API:', error);
    return NextResponse.json(
      { reply: `Sistem crash: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}