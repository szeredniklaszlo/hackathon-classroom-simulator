import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // Return to dashboard after successful login
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Server component limit handled by middleware 
                        }
                    },
                },
            }
        )

        // Exchange the google auth code for a jwt session
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error("Auth session exchange error:", error)
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message || 'auth_failed')}`)
        }
    } else {
        console.error("No code parameter found in the URL. Search parameters:", searchParams.toString())
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
