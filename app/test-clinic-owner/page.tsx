'use client';

import { useState } from 'react';

export default function TestClinicOwnerPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createClinicOwner = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/create-clinic-owner', {
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
      <h1>Clinic Owner Creation Test</h1>
      
      <button 
        onClick={createClinicOwner}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Creating...' : 'Create Clinic Owner'}
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
