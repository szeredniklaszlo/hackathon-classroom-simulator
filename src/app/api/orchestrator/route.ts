import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { ClassroomContext, OrchestratorResponse, PreProcessorResponse } from '@/types/shared';

export const maxDuration = 60; // Hasznos Vercelen, ha hosszú a hívás

export async function POST(req: Request) {
    try {
        const body = await req.json() as ClassroomContext;
        const { sessionId, students, teacherTranscriptChunk } = body;

        console.log(`[Orchestrator] Received chunk: "${teacherTranscriptChunk}"`);

        // A kliens inicializálása a legfrissebb standard szerint
        const client = new AzureOpenAI({
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
            deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        });

        // 1. PreProcessor - Megvizsgálja, van-e elég kontextus a bufferben
        const preProcessorResult = await client.chat.completions.create({
            model: "", // Mivel a deploymentet megadtuk, ez üresen maradhat
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `Te egy tapasztalt tanárokat megfigyelő asszisztens vagy.
A feladatod eldönteni egy élő beszéd bufferből, hogy az aktuális szöveg tartalmaz-e egy befejezett, önállóan értelmezhető gondolatot, amire a diákok tudnak reagálni.
Ha a szöveg még csonka vagy befejezetlen (pl. "A kísérleti fizika azért..."), akkor válaszolj úgy, hogy még ne dolgozzuk fel.
Ha viszont tartalmaz befejezett állítást vagy kérdést, akkor válaszd le azt a részt, és add vissza a maradék (még befejezetlen) "trailing" szöveget.

Válaszod KIZÁRÓLAG érvényes JSON formátumban add meg az alábbi sémák szerint:
{
  "isProcessed": boolean (igaz, ha találtál érdemi feldolgozható részt),
  "extractedContext": string (a befejezett gondolat, vagy null, ha isProcessed hamis),
  "remainingBuffer": string (a buffer maradéka az extractedContext után, lehet üres string is. Ha isProcessed hamis, a remainingBuffer legyen VÁLTOZATLANUL az eredeti szöveg!)
}`
                },
                { role: "user", content: `Aktuális buffer: "${teacherTranscriptChunk}"` }
            ]
        });

        const preProcContent = preProcessorResult.choices[0]?.message?.content;
        if (!preProcContent) throw new Error("PreProcessor nem adott vissza választ.");

        const preProc: PreProcessorResponse = JSON.parse(preProcContent);
        console.log(`[PreProcessor] Result:`, preProc);

        if (!preProc.isProcessed || !preProc.extractedContext) {
            // Nem volt elég infó
            const response: OrchestratorResponse = {
                responses: []
            };
            return NextResponse.json({ ...response, isProcessed: false, remainingBuffer: preProc.remainingBuffer });
        }

        // 2. Processor - Diákok generálása az extractedContext alapján
        const processorResult = await client.chat.completions.create({
            model: "",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `Te egy virtuális osztályterem szimulátor 'Processor' modulja vagy.
Kaptál egy befejezett gondolatot a tanártól.
A te feladatod meghatározni az alábbi diákok reakcióit.
Ne mindenki szólaljon meg (spoke: false), csak az, aki a személyisége alapján valószínűleg reagálna!
Figyelj oda az eddigi Engagement és hangulat változására!

Válaszod KIZÁRÓLAG érvényes JSON formátumban add meg, az alábbi tömböt tartalmazva a "responses" kulcs alatt:
{
  "responses": [
    {
      "studentId": "string",
      "spoke": boolean,
      "message": "string" (vagy null),
      "newEngagement": number (0-100),
      "mood": "attentive" | "distracted" | "confused" | "excited"
    }
  ]
}`
                },
                {
                    role: "user",
                    content: `Tanár mondta: "${preProc.extractedContext}"\nDiákok jelenlegi állapota:\n${JSON.stringify(students, null, 2)}`
                }
            ]
        });

        const procContent = processorResult.choices[0]?.message?.content;
        if (!procContent) throw new Error("Processor nem adott vissza választ.");

        const proc = JSON.parse(procContent) as OrchestratorResponse;
        console.log(`[Processor] Generated responses for ${proc.responses?.length || 0} students.`);

        return NextResponse.json({
            isProcessed: true,
            extractedContext: preProc.extractedContext,
            remainingBuffer: preProc.remainingBuffer,
            responses: proc.responses || []
        });

    } catch (error) {
        console.error("[Orchestrator] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
