/**
 * Environment utility functions
 */

/**
 * Checks if the application is running on localhost
 * @param hostname - The hostname to check (defaults to window.location.hostname in browser)
 * @returns true if running on localhost, false otherwise
 */
export function isLocalhost(hostname?: string): boolean {
    // For server-side (Next.js middleware and API routes)
    if (typeof window === 'undefined') {
        // Check NODE_ENV for development
        return process.env.NODE_ENV === 'development'
    }
    
    // For client-side
    const host = hostname || window.location.hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

/**
 * Gets the localhost bypass email for development
 */
export const LOCALHOST_BYPASS_EMAIL = 'vishnugrao@gmail.com'
