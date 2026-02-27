import { StudentType, Student, VirtualClass, TranscriptEntry } from '@/types/shared';

// Mock Data

export const mockStudents: Student[] = [
    { id: 's1', name: 'Amara', age: 14, type: 'Fast Learner', emoji: '🌟', moodScore: 85, raisedHand: false, learningStatus: 'Grasped the main concept quickly.', struggles: 'Needs more advanced challenges.' },
    { id: 's2', name: 'Carlos', age: 15, type: 'ESL Student', emoji: '🌍', moodScore: 70, raisedHand: true, learningStatus: 'Following along, but vocabulary is challenging.', struggles: 'Complex idioms.' },
    { id: 's3', name: 'Zoe', age: 14, type: 'Easily Distracted', emoji: '😴', moodScore: 45, raisedHand: false, learningStatus: 'Missed the last instruction.', struggles: 'Focusing during long lectures.' },
    { id: 's4', name: 'Jamal', age: 15, type: 'Deep Thinker', emoji: '🤔', moodScore: 75, raisedHand: false, learningStatus: 'Pondering the implications.', struggles: 'Overthinking simple concepts.' },
    { id: 's5', name: 'Priya', age: 14, type: 'Anxious Achiever', emoji: '😰', moodScore: 80, raisedHand: false, learningStatus: 'Understands but afraid to be wrong.', struggles: 'Speaking up in class.' },
    { id: 's6', name: 'Marcus', age: 15, type: 'Class Clown', emoji: '🎭', moodScore: 60, raisedHand: false, learningStatus: 'Entertained, somewhat engaged.', struggles: 'Taking the lesson seriously.' },
];

export const mockClasses: VirtualClass[] = [
    {
        id: 'c1',
        name: 'Block A - 9th Grade',
        subject: 'Biology: Cell Structure',
        emoji: '🧬',
        description: 'An introductory biology class with a mix of learning paces.',
        students: [...mockStudents]
    },
    {
        id: 'c2',
        name: 'Block B - 10th Grade',
        subject: 'World History: The Renaissance',
        emoji: '🏛️',
        description: 'A discussion-heavy class focusing on historical analysis.',
        students: [mockStudents[0], mockStudents[1], mockStudents[3], mockStudents[4]]
    },
    {
        id: 'c3',
        name: 'Block C - ELA',
        subject: 'English: Poetry Analysis',
        emoji: '📚',
        description: 'Creative writing and poetry interpretation.',
        students: [mockStudents[1], mockStudents[2], mockStudents[5]]
    }
];

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
