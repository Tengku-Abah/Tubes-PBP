// Logout utility function
export const logout = () => {
    const isBrowser = typeof window !== 'undefined';
    const isAdminRoute = isBrowser ? window.location.pathname.startsWith('/Admin') : false;

    // Prevent auto-redirect loops and signal explicit logout for this tab
    sessionStorage.setItem('logout', 'true');

    // Clear only this tab's session state
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('loginTime');

    // Do NOT clear cross-tab localStorage here to avoid nuking other role
    // (User "remember me" should be managed by user-facing logout flows)

    // Role-aware cookie clearing
    if (isAdminRoute) {
        document.cookie = 'admin-auth-token=; path=/Admin; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } else {
        document.cookie = 'user-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }

    // Do not clear generic root auth-token to avoid cross-role collisions

    // Redirect appropriately
    if (isBrowser) {
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
