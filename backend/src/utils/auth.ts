import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// Generate unique ID
export function generateId(): string {
    return randomBytes(16).toString('hex');
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Generate session token
export function generateSessionToken(): string {
    return randomBytes(32).toString('hex');
}

// Calculate session expiry (7 days from now)
export function getSessionExpiry(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString();
}
