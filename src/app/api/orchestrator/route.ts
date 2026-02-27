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
        const { students, teacherTranscriptChunk, fullTranscript = [] } = body;

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
                    content: `Te egy tanárokat segítő AI vagy. Elemezd a bejövő Speech-to-Text beszédfolyamot (Buffer).
A feladatod, hogy eldöntsd, a tanár mondandója elérte-e azt a pontot, amire a diákoknak reagálniuk kellene (pl. feltett egy kérdést, felszólított valakit, vagy befejezett egy gondolatmenetet).
Ha IGEN (kérdés, utasítás, befejezett mondat), akkor isProcessed = true, az extractedContext az értelmes mondat, a remainingBuffer pedig a mondaton túli maradék szöveg (többnyire "").
Ha MÉG NEM fejezett be semmit (pl. csak "Um, so..."), akkor isProcessed = false, extractedContext = null.
Fontos: A szöveg tartalmazhat töltelékszavakat (um, uh). Ha a szövegben van egy kérdés (pl. "what do you think?"), az mindig feldolgozandó (isProcessed: true)!
Kimenet csak valid JSON: { "isProcessed": boolean, "extractedContext": string | null, "remainingBuffer": string }`
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

        // Token spórolás: Az utolsó pár üzenetet rakjuk a promptba
        const recentHistory = fullTranscript.slice(-8).map(entry => `[${entry.speaker}]: ${entry.text}`).join('\n');

        // --- 2. PROCESSOR (A Multi-Agent logika) ---

        console.log(`[Orchestrator] PÁRHUZAMOSAN (Parallel) elindítjuk ${students.length} tanuló AI generálását...`);

        // Tömböt hozunk létre a Promise-okból, melyek egyszerre fognak elindulni
        const studentPromises = students.map((student: any) => {
            return (async () => {
                try {
                    // Ellenőrizzük, hogy a tanár közvetlenül ezt a diákot szólította-e meg
                    const isAddressed = isDirectlyAddressed(preProc.extractedContext!, student.name);

                    const basePersona = student.prompt
                        ? `YOUR DETAILED SYSTEM PERSONA:\n${student.prompt}\n\nCURRENT STATE:\nCurrent Engagement/Mood: ${student.moodScore}/100`
                        : `Name: ${student.name}\nAge: ${student.age}\nPersonality: ${student.personality || "Average student"}\nCurrent Engagement: ${student.moodScore}/100\nRole: ${student.type} (e.g. nerd, troublemaker, shy)`;

                    const result = await client.chat.completions.create({
                        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
                        response_format: { type: "json_object" },
                        messages: [
                            {
                                role: "system",
                                content: `You are simulating a student in a classroom.
                                
${basePersona}

YOUR BEHAVIORAL PROTOCOL (CRITICAL RULES):
1. **DEFAULT STATE:** You should usually stay SILENT and LISTEN.
2. **DIRECT ADDRESS:** If the teacher explicitly said your name ("${student.name}"), you MUST respond (action: "ANSWER_DIRECTLY").
3. **GENERAL QUESTIONS:** If the teacher asks a general question to the class, DO NOT shout out. Instead, choose "RAISE_HAND" if you know the answer, or "LISTEN" if you don't.
4. **DISRUPTION:** Only if your personality (as described above) is distracted or a troublemaker AND your engagement is low, you might "WHISPER" to a neighbor or "INTERRUPT". Let your specific conditions dictate if you interrupt or whisper.
5. **SHY/ANXIOUS:** Even if you know the answer, if you are shy or anxious according to your persona, you might just "LISTEN" or hesitantly "RAISE_HAND".
6. **BE AN ACTUAL KID:** You are a student in a classroom, not a robot. You should act like a real kid, not a robot, so your answers can allow mistakes and "I don't know"-ish responses.

INPUT CONTEXT:

--- RECENT CLASSROOM HISTORY ---
${recentHistory || "(Classroom just started, no prior history)"}
--------------------------------

--- LATEST TEACHER INPUT (Just spoken now) ---
Teacher said: "${preProc.extractedContext}"
Directly addressed to you: ${isAddressed}
----------------------------------------------

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
            })();
        });

        // Promise.all segítségével PÁRHUZAMOSAN bevárjuk az összes tanuló válaszát
        const rawResponses = (await Promise.all(studentPromises)).filter(Boolean);
        console.log(`[Orchestrator] Minden tanuló válasza megérkezett párhuzamosan.`);

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