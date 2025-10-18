// Secure authentication helper
export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;

    try {
        const userData = sessionStorage.getItem('user');
        if (!userData) return null;

        const user = JSON.parse(userData);

        // Validate user data structure
        if (!user.id || !user.email || !user.role) {
            console.error('Invalid user data structure');
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

export const isAdmin = () => {
    const user = getCurrentUser();
    return user && user.role === 'admin';
};

export const requireAuth = () => {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
};

export const requireAdmin = () => {
    const user = requireAuth();
    if (user.role !== 'admin') {
        throw new Error('Admin access required');
    }
    return user;
};

// Secure API headers helper
export const getAuthHeaders = (): Record<string, string> => {
    const user = getCurrentUser();

    const headers: Record<string, string> = {};
    if (!user) return headers;

    headers['user-id'] = String(user.id);
    headers['user-role'] = String(user.role);
    if (user.email) headers['user-email'] = String(user.email);

    return headers;
};
