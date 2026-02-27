import { create } from 'zustand';
import { mockStudents, mockClasses } from '@/lib/mockData';
import { Student, VirtualClass } from '@/types/shared';

interface AppState {
    students: Student[];
    classes: VirtualClass[];
    addStudent: (student: Student) => void;
    addClass: (newClass: VirtualClass) => void;
}

export const useStore = create<AppState>((set) => ({
    students: [...mockStudents],
    classes: [...mockClasses],

    addStudent: (student) => set((state) => ({
        students: [...state.students, student]
    })),

    addClass: (newClass) => set((state) => ({
        classes: [...state.classes, newClass]
    })),
}));
