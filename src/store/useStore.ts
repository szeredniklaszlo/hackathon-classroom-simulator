import { create } from 'zustand';
import { Student, VirtualClass } from '@/types/shared';

interface AppState {
    students: Student[];
    classes: VirtualClass[];
    addStudent: (student: Student) => void;
    updateStudent: (student: Student) => void;
    removeStudent: (id: string) => void;
    setStudents: (students: Student[]) => void;
    addClass: (newClass: VirtualClass) => void;
    removeClass: (id: string) => void;
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

    removeStudent: (id) => set((state) => ({
        students: state.students.filter((s) => s.id !== id)
    })),

    setStudents: (students) => set({ students }),

    addClass: (newClass) => set((state) => ({
        classes: [newClass, ...state.classes]
    })),

    removeClass: (id) => set((state) => ({
        classes: state.classes.filter((c) => c.id !== id)
    })),

    setClasses: (classes) => set({ classes }),
}));

