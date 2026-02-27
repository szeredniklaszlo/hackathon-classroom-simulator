import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TRANSCRIPTS_FILE = path.join(process.cwd(), '.transcripts.json');

// Get all or a specific transcript
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    try {
        if (!fs.existsSync(TRANSCRIPTS_FILE)) {
            return NextResponse.json({ transcripts: classId ? [] : {} });
        }

        const data = fs.readFileSync(TRANSCRIPTS_FILE, 'utf-8');
        const transcripts = JSON.parse(data);

        if (classId) {
            return NextResponse.json({ transcript: transcripts[classId] || [] });
        }

        return NextResponse.json({ transcripts });
    } catch (error) {
        console.error('Error reading transcripts:', error);
        return NextResponse.json({ error: 'Failed to read transcripts' }, { status: 500 });
    }
}

// Save a new transcript for a class
export async function POST(request: Request) {
    try {
        const { classId, transcript } = await request.json();

        if (!classId || !transcript) {
            return NextResponse.json({ error: 'classId and transcript are required' }, { status: 400 });
        }

        let allTranscripts: Record<string, any[]> = {};

        if (fs.existsSync(TRANSCRIPTS_FILE)) {
            const data = fs.readFileSync(TRANSCRIPTS_FILE, 'utf-8');
            try {
                allTranscripts = JSON.parse(data);
            } catch (e) {
                console.warn('Could not parse existing transcripts.json, starting fresh');
            }
        }

        allTranscripts[classId] = transcript;

        fs.writeFileSync(TRANSCRIPTS_FILE, JSON.stringify(allTranscripts, null, 2), 'utf-8');

        return NextResponse.json({ success: true, message: 'Transcript saved to local file' });
    } catch (error) {
        console.error('Error saving transcript:', error);
        return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
    }
}
