'use client';

import { useState } from 'react';

export default function FixUserRolePage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fixUserRole = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/fix-user-role', {
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
      <h1>Fix User Role for Clinic Owner</h1>
      <p>This will fix the user role to match the clinic_staff record.</p>
      
      <button 
        onClick={fixUserRole}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Fixing Role...' : 'Fix User Role'}
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
