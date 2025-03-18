"use client"

import AirtimeForm from "@/components/airtime-form"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from 'react';
import TokenCheck from '@/components/token-check';

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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <TokenCheck />
    </Suspense>
  );
}

