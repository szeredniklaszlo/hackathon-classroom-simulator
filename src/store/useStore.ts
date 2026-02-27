import { create } from 'zustand';
import { mockClasses } from '@/lib/mockData';
import { Student, VirtualClass } from '@/types/shared';

interface AppState {
    students: Student[];
    classes: VirtualClass[];
    addStudent: (student: Student) => void;
    setStudents: (students: Student[]) => void;
    addClass: (newClass: VirtualClass) => void;
}

export const useStore = create<AppState>((set) => ({
    students: [],
    classes: [...mockClasses],

    addStudent: (student) => set((state) => ({
        students: [...state.students, student]
    })),

    setStudents: (students) => set({ students }),

    addClass: (newClass) => set((state) => ({
        classes: [...state.classes, newClass]
    })),
}));
