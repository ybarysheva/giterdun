'use client';

import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';

export function LoginScreen() {
  const auth = useAuth();

  const handleSignIn = () => {
    signInWithPopup(auth, new GoogleAuthProvider());
  };

  return (
    <main className="flex min-h-screen items-center justify-center font-body">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold uppercase tracking-wider">giterdun</h1>
        <Button onClick={handleSignIn}>Sign in with Google</Button>
      </div>
    </main>
  );
}
