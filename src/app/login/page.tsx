import { login, signup } from './actions'
import GoogleLoginButton from '@/components/GoogleLoginButton'

export default async function LoginPage({
    searchParams
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const parsedParams = await searchParams;
    const error = parsedParams?.error;

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-background">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800/80 rounded-xl shadow-md border border-transparent dark:border-slate-700/50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">Welcome to PoC</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Sign in to access your dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-100 dark:border-red-500/20">
                        {error}
                    </div>
                )}

                <form className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-slate-200" htmlFor="full_name">Full Name (for registration only)</label>
                        <input
                            className="w-full px-3 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900/50 dark:text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-sky-500"
                            id="full_name"
                            name="full_name"
                            type="text"
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-slate-200" htmlFor="email">Email</label>
                        <input
                            className="w-full px-3 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900/50 dark:text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-sky-500"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="hello@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-slate-200" htmlFor="password">Password</label>
                        <input
                            className="w-full px-3 py-2 border dark:border-slate-700 bg-white dark:bg-slate-900/50 dark:text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-sky-500"
                            id="password"
                            name="password"
                            type="password"
                            required
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            formAction={login}
                            className="w-full bg-black dark:bg-sky-600 text-white font-medium py-2 rounded-md hover:bg-gray-800 dark:hover:bg-sky-500 transition"
                        >
                            Sign In
                        </button>
                        <button
                            formAction={signup}
                            className="w-full bg-white dark:bg-slate-800 text-black dark:text-white font-medium border dark:border-slate-600 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-800/80 px-2 text-gray-500 dark:text-slate-400">Or continue with</span>
                    </div>
                </div>

                <GoogleLoginButton />
            </div>
        </div>
    )
}
