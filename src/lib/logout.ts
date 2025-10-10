// Logout utility function
export const logout = () => {
    // Set logout flag to prevent auto-redirect
    sessionStorage.setItem('logout', 'true');

    // Clear sessionStorage
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('loginTime');

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('loginTime');

    // Clear all auth cookies (general and role-specific)
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'admin-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Redirect to login page
    if (typeof window !== 'undefined') {
        window.location.href = '/Login';
    }
};

// Check if user is remembered
export const isRemembered = () => {
    if (typeof window === 'undefined') return false;

    const rememberedUser = localStorage.getItem('user');
    const rememberMe = localStorage.getItem('rememberMe');

    if (rememberedUser && rememberMe === 'true') {
        try {
            const loginTime = localStorage.getItem('loginTime');
            const now = Date.now();

            // Check if login is still valid (within 30 days)
            return loginTime && (now - parseInt(loginTime)) < 2592000000;
        } catch (error) {
            return false;
        }
    }

    return false;
};
