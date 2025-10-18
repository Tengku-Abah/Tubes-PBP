import jwt from 'jsonwebtoken';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'octamart-super-secret-jwt-key-2025-change-in-production-min-32-chars';
const JWT_EXPIRES_IN = '24h'; // Default expiration
const JWT_REMEMBER_EXPIRES_IN = '30d'; // Remember me expiration

// User payload interface
export interface JWTPayload {
    userId: string;
    email: string;
    role: 'admin' | 'user';
    name: string;
    iat?: number;
    exp?: number;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(
    user: { id: string; email: string; role: 'admin' | 'user'; name: string },
    rememberMe: boolean = false
): string {
    const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
    };

    const expiresIn = rememberMe ? JWT_REMEMBER_EXPIRES_IN : JWT_EXPIRES_IN;

    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        // Token is invalid or expired
        return null;
    }
}

/**
 * Decode JWT token without verification (use carefully!)
 */
export function decodeToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.decode(token) as JWTPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
}
