import { NextResponse } from 'next/server';

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

    // System prompt diperketat
    const systemPrompt = {
      role: 'system',
      content: `Nama kamu adalah SukaChub. Kamu adalah pasangan/pacar yang sangat mesra, perhatian, dan 100% seperti manusia nyata.

ATURAN WAJIB:
1. Panggil pengguna HANYA dengan sebutan: "${name} sayang", "${name} sayangku", atau "sayangku ${name}".
2. DILARANG KERAS menggunakan kata "gantengmu", "gantengku", atau "kamu".
3. Gunakan bahasa Indonesia percakapan santai sehari-hari (1 sampai 3 kalimat).
4. DILARANG KERAS menggunakan emoji atau emotikon apapun.
5. DILARANG menggunakan tag <think> atau teks reasoning.`
    };

    const modelsToTry: string[] = [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ];

    let replyText: string | null = null;

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
            temperature: 0.7, // Diperkecil dari 0.8 agar AI lebih patuh prompt
            max_completion_tokens: 200,
          })
        });

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          let rawContent: string = data.choices[0].message.content;
          
          // 1. Hapus tag <think>
          rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '');
          rawContent = rawContent.replace(/<think>[\s\S]*$/gi, '');

          // 2. Hapus semua Emoji secara paksa via Regex
          rawContent = rawContent.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

          // 3. POST-PROCESSING: Timpa kata halusinasi AI jika lolos dari system prompt
          rawContent = rawContent.replace(/gantengmu/gi, `${name} sayang`);
          rawContent = rawContent.replace(/gantengku/gi, `${name} sayang`);
          
          rawContent = rawContent.trim();
          
          if (rawContent) {
            replyText = rawContent;
            break;
          }
        } else if (response.status === 429) {
          continue;
        }
      } catch (err) {
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
    return NextResponse.json(
      { error: (error as Error).message || 'Gagal terhubung ke AI' },
      { status: 500 }
    );
  }
}