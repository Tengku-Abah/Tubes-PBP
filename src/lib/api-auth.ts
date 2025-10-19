import { NextRequest } from 'next/server';

// Secure API authentication helper
export const getApiUser = (request: NextRequest) => {
    try {
        // Get user data from headers (set by client)
        const userId = request.headers.get('user-id');
        const userRole = request.headers.get('user-role');
        const userEmail = request.headers.get('user-email');

        if (!userId || !userRole) {
            return null;
        }

        return {
            id: userId, // keep as string for Supabase UUID compatibility
            role: userRole,
            email: userEmail || undefined,
        };
    } catch (error) {
        console.error('Error parsing API user data:', error);
        return null;
    }
};

export const requireApiAuth = (request: NextRequest) => {
    const user = getApiUser(request);
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
};

export const requireApiAdmin = (request: NextRequest) => {
    const user = requireApiAuth(request);
    if (user.role !== 'admin') {
        throw new Error('Admin access required');
    }
    return user;
};

// Alternative: Get user from cookie (for server-side)
export const getCookieUser = (request: NextRequest) => {
    try {
        // Support three cookie variants to avoid mismatch across pages
        const generalToken = request.cookies.get('auth-token')?.value;
        const userToken = request.cookies.get('user-auth-token')?.value;
        const adminToken = request.cookies.get('admin-auth-token')?.value;

        const rawToken = generalToken || userToken || adminToken;
        if (!rawToken) return null;

        const parsed: any = JSON.parse(rawToken);

        const id = typeof parsed.id === 'string' ? parsed.id : parsed.id;
        const role = parsed.role;
        const email = parsed.email || parsed.user?.email || undefined;
        const name = parsed.name || parsed.user?.user_metadata?.name || parsed.user?.user_metadata?.full_name || parsed.user?.email?.split('@')[0] || undefined;

        // Minimal validation: id + role required (email optional)
        if (!id || !role) {
            return null;
        }

        return { id, role, email, name } as { id: string | number; role: string; email?: string; name?: string };
    } catch (error) {
        console.error('Error parsing cookie user data:', error);
        return null;
    }
};
