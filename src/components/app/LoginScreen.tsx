'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { Button } from '@/components/ui/button';

export function LoginScreen() {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle redirect result (fires after signInWithRedirect completes)
  useEffect(() => {
    setLoading(true);
    getRedirectResult(auth)
      .then((result) => {
        // If result is non-null, the auth state listener in FirebaseProvider handles the rest
        if (!result) setLoading(false);
      })
      .catch((err) => {
        setError(err.code);
        setLoading(false);
      });
  }, [auth]);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        // Popup was blocked — fall back to full-page redirect
        await signInWithRedirect(auth, new GoogleAuthProvider());
      } else if (err.code !== 'auth/popup-closed-by-user') {
        // popup-closed-by-user means they dismissed it deliberately — not worth surfacing
        setError(err.code);
      }
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center font-body">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold uppercase tracking-wider">giterdun</h1>
        <Button onClick={handleSignIn} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in with Google'}
        </Button>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    </main>
  );
}
