import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLocalhost } from "@/utils/environment";

export async function updateSession(request:NextRequest) {
    
    let supabaseResponse = NextResponse.next({
        request,
    })

    console.log('🔵 [MIDDLEWARE] Processing request:', request.nextUrl.pathname)
    console.log('🔵 [MIDDLEWARE] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...')

    // Bypass authentication checks on localhost for development
    if (isLocalhost()) {
        console.log('🟡 [MIDDLEWARE] Localhost detected - bypassing authentication checks')
        return supabaseResponse
    }

    // Check if this is an OAuth callback with a code parameter on any path
    const code = request.nextUrl.searchParams.get('code')
    if (code && !request.nextUrl.pathname.startsWith('/auth/callback')) {
        console.log('🔵 [MIDDLEWARE] OAuth code detected, redirecting to callback route')
        const callbackUrl = new URL('/auth/callback', request.url)
        callbackUrl.searchParams.set('code', code)
        // Add all other search params to preserve state
        request.nextUrl.searchParams.forEach((value, key) => {
            if (key !== 'code') {
                callbackUrl.searchParams.set(key, value)
            }
        })
        return NextResponse.redirect(callbackUrl)
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({name, value, options}) => supabaseResponse.cookies.set(name, value, options))
                },
            },
        }
    )

    try {
        const {
            data: { user },   
        } = await supabase.auth.getUser()

        console.log('🔵 [MIDDLEWARE] User check result:', user ? 'authenticated' : 'not authenticated')

        if ( !user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth/callback') && !request.nextUrl.pathname.startsWith('/error')) {
            console.log('🔵 [MIDDLEWARE] Redirecting to login from:', request.nextUrl.pathname)
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        return supabaseResponse
    } catch (error) {
        console.error('❌ [MIDDLEWARE] Error during user check:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            cause: error instanceof Error ? error.cause : undefined,
            pathname: request.nextUrl.pathname
        })
        
        // In case of error, still allow access to login, auth callback, and error pages
        if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth/callback') || request.nextUrl.pathname.startsWith('/error')) {
            return supabaseResponse
        }
        
        // For other pages, redirect to login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }
}