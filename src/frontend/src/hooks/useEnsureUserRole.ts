import { useEffect, useRef } from 'react';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { UserRole } from '../backend';

/**
 * Hook that ensures the authenticated user has the #user role assigned.
 * This is called after successful Internet Identity login to prevent authorization traps.
 */
export function useEnsureUserRole() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const ensureRole = async () => {
      if (!actor || !identity || hasInitialized.current) {
        return;
      }

      try {
        hasInitialized.current = true;
        const principal = identity.getPrincipal();
        // Assign user role (idempotent operation)
        await actor.assignCallerUserRole(principal, UserRole.user);
      } catch (error) {
        console.error('Failed to ensure user role:', error);
        // Reset flag to retry on next render if needed
        hasInitialized.current = false;
      }
    };

    ensureRole();
  }, [actor, identity]);
}
