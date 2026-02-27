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
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome to PoC</h1>
                    <p className="text-sm text-gray-500 mt-2">Sign in to access your dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="full_name">Teljes név (csak regisztrációhoz)</label>
                        <input
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                            id="full_name"
                            name="full_name"
                            type="text"
                            placeholder="Kovács János"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="email">Email</label>
                        <input
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="hello@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="password">Password</label>
                        <input
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                            id="password"
                            name="password"
                            type="password"
                            required
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            formAction={login}
                            className="w-full bg-black text-white font-medium py-2 rounded-md hover:bg-gray-800 transition"
                        >
                            Sign In
                        </button>
                        <button
                            formAction={signup}
                            className="w-full bg-white text-black font-medium border py-2 rounded-md hover:bg-gray-50 transition"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                </div>

                <GoogleLoginButton />
            </div>
        </div>
    )
}
