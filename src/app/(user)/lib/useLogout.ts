'use client';

// Re-exported from the shared location so the marketing navbar can use the
// same logout logic without reaching into the (user) route group.
export { useLogout } from '@/lib/auth/useLogout';
