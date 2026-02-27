'use client';

import { motion } from "framer-motion";
import { GraduationCap, Sparkles, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LandingPage() {
  const handleMockLogin = () => {
    toast.success("Mock Gmail Login Successful", {
      description: "Redirecting to your Dashboard...",
    });
    // In a real app we'd redirect via router.push after auth.
    // Here we'll just let the user click the guest button for now 
    // or simulate a redirect. We'll simulate it with a short timeout.
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1500);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-white">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 w-full max-w-4xl text-center space-y-8"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-50 rounded-2xl text-primary shadow-sm border border-blue-100">
            <GraduationCap size={48} />
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-[#0F172A] leading-tight tracking-tight">
          Welcome to the <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
            AI Classroom Simulator
          </span>
        </h1>

        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Master your teaching methods with intelligent, LLM-driven student avatars. Practice, adapt, and get real-time feedback in a safe, dynamic learning environment.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
        >
          <button
            onClick={handleMockLogin}
            className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-600 transition-all shadow-md hover:shadow-lg active:scale-95 w-full sm:w-auto justify-center"
          >
            <User size={20} />
            Sign in with Gmail
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-xl font-semibold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95 w-full sm:w-auto justify-center"
          >
            <Sparkles size={20} className="text-primary" />
            Continue as Guest
            <ArrowRight size={18} className="ml-1" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Mock visuals */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-16 w-full max-w-5xl relative z-10"
      >
        <div className="glass-panel p-2 overflow-hidden shadow-2xl border-white/40 ring-1 ring-slate-900/5">
          <div className="bg-slate-50 rounded-xl h-64 md:h-80 flex flex-col items-center justify-center text-slate-400 border border-slate-100 relative overflow-hidden">

            {/* Abstract UI representation */}
            <div className="absolute top-4 left-4 right-4 flex gap-4 opacity-50">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex-shrink-0"></div>
              <div className="h-12 flex-1 rounded-xl bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 absolute bottom-4 left-4 right-4 opacity-70">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white h-24 rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col gap-2">
                  <div className="h-6 w-1/3 bg-slate-200 rounded-md"></div>
                  <div className="h-4 w-2/3 bg-slate-100 rounded-md mt-auto"></div>
                </div>
              ))}
            </div>

            <p className="font-medium text-lg relative z-10 bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm border border-slate-100">Interactive Workspace Preview</p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
