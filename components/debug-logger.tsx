"use client"

import { useState, useEffect } from 'react';

export default function DebugLogger() {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    // Store the original console.log
    const originalLog = console.log;
    
    // Override console.log to capture logs
    console.log = (...args) => {
      // Call original function
      originalLog(...args);
      
      // Add to our logs state
      const logString = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev, logString].slice(-50)); // Keep last 50 logs
    };
    
    // Restore original on cleanup
    return () => {
      console.log = originalLog;
    };
  }, []);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 max-h-64 overflow-auto bg-black/80 text-white text-xs p-2 z-50">
      <div className="flex justify-between mb-2">
        <h3>Debug Logs</h3>
        <button onClick={() => setLogs([])}>Clear</button>
      </div>
      {logs.map((log, i) => (
        <div key={i} className="font-mono border-t border-gray-700 py-1">{log}</div>
      ))}
    </div>
  );
}
