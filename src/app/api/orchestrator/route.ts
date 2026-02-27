import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { ClassroomContext, OrchestratorResponse, PreProcessorResponse } from '@/types/shared';

// Segédfüggvény: megnézi, hogy a tanár szövege tartalmazza-e a diák nevét
function isDirectlyAddressed(teacherText: string, studentName: string): boolean {
    const cleanText = teacherText.toLowerCase();
    const cleanName = studentName.toLowerCase();
    return cleanText.includes(cleanName);
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as ClassroomContext;
        const { students, teacherTranscriptChunk } = body;

        const client = new AzureOpenAI({
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
            deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        });

        // --- 1. PREPROCESSOR (Változatlan, csak a típusokat illesztjük) ---
        // Feltételezzük, hogy ez ugyanaz maradt, mint a te kódodban...
        const preProcessorResult = await client.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `Te egy tanárokat segítő AI vagy. Elemezd a bejövő beszédfolyamot.
                    Keresd a befejezett mondatokat vagy logikai egységeket.
                    JSON válasz: { "isProcessed": boolean, "extractedContext": string | null, "remainingBuffer": string }`
                },
                { role: "user", content: `Buffer: "${teacherTranscriptChunk}"` }
            ]
        });

        const preProcContent = preProcessorResult.choices[0]?.message?.content;
        if (!preProcContent) throw new Error("PreProcessor error");
        const preProc: PreProcessorResponse = JSON.parse(preProcContent);

        if (!preProc.isProcessed || !preProc.extractedContext) {
            return NextResponse.json({ isProcessed: false, remainingBuffer: preProc.remainingBuffer, responses: [] });
        }

        // --- 2. PROCESSOR (A Multi-Agent logika) ---

        const studentPromises = students.map(async (student: any) => {
            try {
                // Ellenőrizzük, hogy a tanár közvetlenül ezt a diákot szólította-e meg
                const isAddressed = isDirectlyAddressed(preProc.extractedContext!, student.name);

                // Személyiség specifikus prompt építése
                const personalityPrompt = `
                Name: ${student.name}
                Personality: ${student.personality || "Average student"}
                Current Engagement: ${student.moodScore}/100
                Role: ${student.type} (e.g. nerd, troublemaker, shy)
                `;

                const result = await client.chat.completions.create({
                    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
                    response_format: { type: "json_object" },
                    messages: [
                        {
                            role: "system",
                            content: `You are simulating a student in a classroom.
                            
YOUR BEHAVIORAL PROTOCOL:
1. **DEFAULT STATE:** You should usually stay SILENT and LISTEN.
2. **DIRECT ADDRESS:** If the teacher explicitly said your name ("${student.name}"), you MUST respond (action: "ANSWER_DIRECTLY").
3. **GENERAL QUESTIONS:** If the teacher asks a general question to the class, DO NOT shout out. Instead, choose "RAISE_HAND" if you know the answer, or "LISTEN" if you don't.
4. **DISRUPTION:** Only if your personality is "distracted" or "troublemaker" AND your engagement is low, you might "WHISPER" to a neighbor or "INTERRUPT".
5. **SHY STUDENTS:** Even if you know the answer, a shy student might just "LISTEN" or hesitantly "RAISE_HAND".

INPUT CONTEXT:
Teacher said: "${preProc.extractedContext}"
Directly addressed to you: ${isAddressed}

Analyze the situation and return JSON:
{
  "studentId": "${student.id}",
  "internalThought": "string (Why did you choose this action?)",
  "action": "LISTEN" | "RAISE_HAND" | "ANSWER_DIRECTLY" | "WHISPER" | "INTERRUPT",
  "message": "string" (The content of speech/whisper. NULL if action is LISTEN or RAISE_HAND),
  "newEngagement": number (0-100),
  "emotion": "curious" | "bored" | "anxious" | "excited"
}`
                        }
                    ]
                });

                const content = result.choices[0]?.message?.content;
                return content ? JSON.parse(content) : null;
            } catch (err) {
                console.error(`Error with student ${student.name}`, err);
                return null;
            }
        });

        const rawResponses = (await Promise.all(studentPromises)).filter(Boolean);

        // --- 3. THE CONDUCTOR (Utófeldolgozás / Konfliktuskezelés) ---
        // Itt döntjük el, ki beszélhet valójában, hogy ne legyen káosz.

        const finalResponses = rawResponses.filter((r: any) => {
            // Mindig engedjük át, ha csendben van vagy csak kezet tesz fel (ez UI állapot)
            if (r.action === 'LISTEN' || r.action === 'RAISE_HAND') return true;

            // Ha közvetlenül kérdezték, mindig beszélhet
            if (r.action === 'ANSWER_DIRECTLY') return true;

            // Ha sutyorgás vagy bekiabálás (INTERRUPT), engedjük át, 
            // DE itt lehetne random filtert tenni (pl. csak max 1 ember kiabálhat be egyszerre)
            if (r.action === 'INTERRUPT' || r.action === 'WHISPER') return true;

            return false;
        });

        // UI egyszerűsítés: A frontendnek lehet, hogy csak egy "text" kell, 
        // de érdemes visszaküldeni az action típusát, hogy pl. megjelenjen egy kéz ikon ✋

        console.log(`[Processor] Processed ${finalResponses.length} valid reactions.`);

        return NextResponse.json({
            isProcessed: true,
            extractedContext: preProc.extractedContext,
            remainingBuffer: preProc.remainingBuffer,
            responses: finalResponses
        });

    } catch (error) {
        console.error("Orchestrator Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}