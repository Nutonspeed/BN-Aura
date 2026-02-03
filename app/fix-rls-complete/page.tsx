'use client';

import { useState } from 'react';

export default function FixRLSCompletePage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fixRLSComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/fix-rls-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Complete RLS Policies Fix</h1>
      <p>This will completely rebuild RLS policies for proper Clinic Owner access.</p>
      
      <button 
        onClick={fixRLSComplete}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Fixing RLS...' : 'Fix Complete RLS Policies'}
      </button>

      {result && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
