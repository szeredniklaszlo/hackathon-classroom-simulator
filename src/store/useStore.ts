import { create } from 'zustand';
import { Student, VirtualClass } from '@/types/shared';

interface AppState {
    students: Student[];
    classes: VirtualClass[];
    addStudent: (student: Student) => void;
    updateStudent: (student: Student) => void;
    setStudents: (students: Student[]) => void;
    addClass: (newClass: VirtualClass) => void;
    setClasses: (classes: VirtualClass[]) => void;
}

export const useStore = create<AppState>((set) => ({
    students: [],
    classes: [],

    addStudent: (student) => set((state) => ({
        students: [...state.students, student]
    })),

    updateStudent: (student) => set((state) => ({
        students: state.students.map((s) => (s.id === student.id ? student : s))
    })),

    setStudents: (students) => set({ students }),

    addClass: (newClass) => set((state) => ({
        classes: [newClass, ...state.classes] // Add to beginning
    })),

    setClasses: (classes) => set({ classes }),
}));
