import { useAuthContext } from '../context/AuthContext';

/**
 * Convenience hook — re-exports the auth context.
 * Use this in screens/components instead of importing the context directly.
 */
export const useAuth = () => useAuthContext();
