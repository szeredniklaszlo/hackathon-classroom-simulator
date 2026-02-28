import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { ClassroomContext, OrchestratorResponse, PreProcessorResponse } from '@/types/shared';

// Helper function: checks if the teacher's text contains the student's name
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

        // --- 1. PREPROCESSOR (Unchanged, just matching types) ---
        // Assuming this remained the same as in your code...
        const preProcessorResult = await client.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `You are an AI assisting teachers. Analyze the incoming Speech-to-Text stream (Buffer).
Your task is to decide if the teacher's speech has reached a point where students should react (e.g., asked a question, called on someone, or finished a thought).
If YES (question, instruction, finished sentence), then isProcessed = true, extractedContext is the meaningful sentence, and remainingBuffer is the leftover text beyond the sentence (mostly "").
If NOT YET finished anything (e.g., just "Um, so..."), then isProcessed = false, extractedContext = null.
Important: The text may contain filler words (um, uh). If there is a question (e.g., "what do you think?"), it should always be processed (isProcessed: true)!
Output ONLY valid JSON: { "isProcessed": boolean, "extractedContext": string | null, "remainingBuffer": string }`
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

        // Token saving: Add the last few messages to the prompt
        const recentHistory = fullTranscript.slice(-8).map(entry => `[${entry.speaker}]: ${entry.text}`).join('\n');

        // --- 2. PROCESSOR (Multi-Agent logic, now with Streaming!) ---
        console.log(`[Orchestrator] Streaming responses for ${students.length} students in PARALLEL...`);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                // First, send the PreProcessor result
                controller.enqueue(encoder.encode(JSON.stringify({
                    type: 'preProc',
                    isProcessed: true,
                    extractedContext: preProc.extractedContext,
                    remainingBuffer: preProc.remainingBuffer
                }) + '\n'));

                const studentPromises = students.map(async (student: any) => {
                    try {
                        const isAddressed = isDirectlyAddressed(preProc.extractedContext!, student.name);
                        const basePersona = student.prompt
                            ? `YOUR DETAILED SYSTEM PERSONA:\n${student.prompt}\n\nCURRENT STATE:\nCurrent Engagement/Mood: ${student.moodScore}/100`
                            : `Name: ${student.name}\nAge: ${student.age}\nPersonality: ${student.personality || "Average student"}\nCurrent Engagement: ${student.moodScore}/100\nRole: ${student.type} (e.g. nerd, troublemaker, shy)`;

                        // --- CALL 1: GENERATE SPOKEN TEXT ONLY (Streaming) ---
                        const textStreamResponse = await client.chat.completions.create({
                            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
                            stream: true,
                            messages: [
                                {
                                    role: "system",
                                    content: `You are simulating a student in a classroom.
${basePersona}

YOUR BEHAVIORAL PROTOCOL (CRITICAL RULES):
1. DEFAULT STATE is SILENT. If no one asked you, or you don't care, you don't speak.
2. If the teacher explicitly said your name ("${student.name}"), you MUST respond.
3. If addressing the class generally, you should usually stay silent unless your specific personality type is highly eager, disruptive, or specifically asks you to blurt out answers.
4. Act like a real kid. Your answers can contain mistakes or "I don't know"-ish responses.

INPUT CONTEXT:

--- RECENT CLASSROOM HISTORY ---
${recentHistory || "(Classroom just started, no prior history)"}
--------------------------------

--- LATEST TEACHER INPUT (Just spoken now) ---
Teacher said: "${preProc.extractedContext}"
Directly addressed to you: ${isAddressed}
----------------------------------------------

TASK:
Decide if you will speak out loud right now.
- IF YES: Output EXACTLY AND ONLY the text you say out loud. No quotes, no actions, no metadata.
- IF NO: Output EXACTLY the word: [SILENCE]`
                                }
                            ]
                        });

                        let rawSpokenText = "";
                        let streamBuffer = "";
                        const silenceToken = "[SILENCE]";

                        for await (const chunk of textStreamResponse) {
                            const text = chunk.choices[0]?.delta?.content || "";
                            if (text) {
                                rawSpokenText += text;
                                streamBuffer += text;

                                // Check if the stream BUFFER is potentially building "[SILENCE]"
                                if (silenceToken.startsWith(streamBuffer)) {
                                    // It matches the start of [SILENCE]. Wait for more chunks.
                                    continue;
                                } else {
                                    // It deviated from [SILENCE]. Flush the buffer.
                                    controller.enqueue(encoder.encode(JSON.stringify({
                                        type: 'chunk',
                                        studentId: student.id,
                                        text: streamBuffer
                                    }) + '\n'));
                                    streamBuffer = ""; // Reset buffer after flushing
                                }
                            }
                        }

                        // Clean up spoken text for the second LLM call
                        const spokenText = rawSpokenText.trim().replace(/\[SILENCE\]/g, "").trim();

                        // --- CALL 2: GENERATE METADATA IN JSON (Non-streaming) ---
                        const metaResponse = await client.chat.completions.create({
                            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
                            response_format: { type: "json_object" },
                            messages: [
                                {
                                    role: "system",
                                    content: `You are analyzing the internal state of a student simulation.
${basePersona}

The teacher just said: "${preProc.extractedContext}"
The student decided to say this out loud in response: "${spokenText}"
(If the spoken text is empty, it means the student stayed silent).

Analyze the situation and return a valid JSON object:
{
  "action": "LISTEN" | "RAISE_HAND" | "ANSWER_DIRECTLY" | "WHISPER" | "INTERRUPT",
  "moodScore": number (1-100),
  "emotion": "bored" | "anxious" | "excited" | "happy" | "confused" | "neutral",
  "internalThought": "string (Why did the student do this?)"
}

Guidelines for "action":
- If the spoken text is empty and they are just listening, action MUST be "LISTEN".
- If the spoken text is empty but they want to answer silently, action MUST be "RAISE_HAND".
- If the spoken text is NOT empty and they were addressed, action MUST be "ANSWER_DIRECTLY".
- If the spoken text is NOT empty and they were NOT addressed, action MUST be "INTERRUPT" or "WHISPER".`
                                }
                            ]
                        });

                        const metaPart = metaResponse.choices[0]?.message?.content || "{}";
                        let metaObj = {};
                        try {
                            metaObj = JSON.parse(metaPart);
                        } catch (e) {
                            metaObj = { action: spokenText ? "ANSWER_DIRECTLY" : "LISTEN", moodScore: student.moodScore, emotion: "neutral" };
                        }

                        // Send done event with metadata merged into the payload
                        controller.enqueue(encoder.encode(JSON.stringify({
                            type: 'done',
                            studentId: student.id,
                            fullContent: spokenText,
                            meta: metaObj
                        }) + '\n'));

                    } catch (err) {
                        console.error(`Error with student ${student.name}`, err);
                        controller.enqueue(encoder.encode(JSON.stringify({
                            type: 'done',
                            studentId: student.id,
                            fullContent: "",
                            meta: { action: "LISTEN", moodScore: student.moodScore, emotion: "neutral", internalThought: "Error occurred" }
                        }) + '\n'));
                    }
                });

                await Promise.all(studentPromises);
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error("Orchestrator Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}