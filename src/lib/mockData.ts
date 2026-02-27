import { TranscriptEntry } from '@/types/shared';

// Mock Data

export const mockTranscript: TranscriptEntry[] = [
    { id: 't1', speaker: 'Teacher', text: "Alright class, today we're going to dive into the structure of a plant cell. Let's start with the cell wall. Can anyone tell me its primary function?", timestamp: '10:00 AM', emotion: 'engaged' },
    { id: 't2', speaker: 'Amara', text: "It provides structural support and protection to the cell.", timestamp: '10:01 AM', emotion: 'happy' },
    { id: 't3', speaker: 'Teacher', text: "Excellent, Amara! Exactly right. Now, what about the chloroplasts? What happens there?", timestamp: '10:01 AM', emotion: 'engaged' },
    { id: 't4', speaker: 'Carlos', text: "Is that... where the plant makes food? With the sun?", timestamp: '10:02 AM', emotion: 'neutral' },
    { id: 't5', speaker: 'Teacher', text: "Yes, Carlos, that's photosynthesis! Great job. Zoe, are you following along? Where can we find chloroplasts?", timestamp: '10:03 AM', emotion: 'engaged' },
    { id: 't6', speaker: 'Zoe', text: "Uh, in the leaves?", timestamp: '10:03 AM', emotion: 'confused' },
    { id: 't7', speaker: 'Teacher', text: "Mostly, yes! Let's look at this diagram on page 42 to make it clearer.", timestamp: '10:04 AM', emotion: 'neutral' }
];

export const mockAIFeedback = {
    wentWell: [
        "Successfully engaged Amara with a direct question.",
        "Provided positive reinforcement to Carlos, boosting his confidence.",
    ],
    toImprove: [
        "Zoe seemed distracted around 10:03 AM. Calling on her directly was good, but maybe a visual aid earlier would have kept her attention.",
        "Priya didn't participate. Try asking a more open-ended, lower-stakes question to encourage her."
    ],
    suggestions: [
        "Incorporate more visual diagrams before asking questions to help ESL students like Carlos.",
        "Implement a 'think-pair-share' activity to give anxious students like Priya a chance to discuss in a smaller group first."
    ]
};
