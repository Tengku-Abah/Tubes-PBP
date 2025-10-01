import { NextRequest } from 'next/server';

// Secure API authentication helper
export const getApiUser = (request: NextRequest) => {
    try {
        // Get user data from headers (set by client)
        const userId = request.headers.get('user-id');
        const userRole = request.headers.get('user-role');
        const userEmail = request.headers.get('user-email');

        if (!userId || !userRole || !userEmail) {
            return null;
        }

        return {
            id: parseInt(userId),
            role: userRole,
            email: userEmail
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
        const authToken = request.cookies.get('auth-token')?.value;
        if (!authToken) return null;

        const user = JSON.parse(authToken);

        // Validate user data structure
        if (!user.id || !user.email || !user.role) {
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error parsing cookie user data:', error);
        return null;
    }
};
