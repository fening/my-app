"use client"

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AirtimeForm from "@/components/airtime-form";
import { Toaster } from "@/components/ui/toaster";

// Pre-computed SHA-256 hash of "survey2024"
const HASHED_TOKEN = '94f94c9c511f351a6db9d32546478a2a6b76a837664c3bc39570c717523673bd';

// Define interface for DebugInfo component props
interface DebugInfoProps {
  token: string | null;
  isValidAccess: boolean;
}

// Simple debug component to show the current validation state
const DebugInfo = ({ token, isValidAccess }: DebugInfoProps) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed top-0 left-0 bg-black/80 text-white p-2 text-xs z-50">
      <div>Token: {token || 'None'}</div>
      <div>Valid: {String(isValidAccess)}</div>
    </div>
  );
};

export default function TokenCheck() {
  const searchParams = useSearchParams();
  const [isValidAccess, setIsValidAccess] = useState(false);
  const token = searchParams?.get('token') || null;
  
  useEffect(() => {
    // In development mode, always grant access
    if (process.env.NODE_ENV === 'development') {
      console.log('[Page] Development mode - granting access');
      setIsValidAccess(true);
      return;
    }
    
    console.log('[Page] Checking token:', token);
    
    // This is a client-side verification, complementing the middleware check
    if (token === HASHED_TOKEN) {
      console.log('[Page] Valid token detected');
      setIsValidAccess(true);
      
      // Store the token in sessionStorage so users don't lose access
      // if they refresh the page after starting
      sessionStorage.setItem('survey_access', 'granted');
    } else {
      // If they previously had access in this session, keep it
      const storedAccess = sessionStorage.getItem('survey_access');
      console.log('[Page] Stored access:', storedAccess);
      
      if (storedAccess === 'granted') {
        setIsValidAccess(true);
      }
    }
  }, [token]);

  // Debug component only visible in development
  return (
    <>
      <DebugInfo token={token} isValidAccess={isValidAccess} />
      
      {!isValidAccess ? (
        <main className="min-h-screen bg-white p-4 md:p-8 text-base flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Required</h1>
            <p>Please access this page through the survey link.</p>
            <p className="mt-4 text-sm text-gray-500">
              Expected URL format: http://localhost:3000/?token=survey2024
            </p>
          </div>
        </main>
      ) : (
        <main className="min-h-screen bg-white p-4 md:p-8 text-base">
          <div className="mx-auto max-w-md relative z-10">
            <div className="mb-8 text-center">
            </div>
            <AirtimeForm />
          </div>
          <Toaster />
        </main>
      )}
    </>
  );
}
