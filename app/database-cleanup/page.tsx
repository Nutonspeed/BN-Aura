'use client';

import { useState } from 'react';

export default function DatabaseCleanupPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const executeCleanup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/database-cleanup', {
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
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px' }}>
      <h1>🧹 Database Cleanup - Clean Slate Implementation</h1>
      <p><strong>⚠️ WARNING:</strong> This will delete ALL test data except super admin (nuttapong161@gmail.com)</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>What will be removed:</h3>
        <ul>
          <li>✅ All test clinic records (clinic.owner@bntest.com related)</li>
          <li>✅ All clinic_staff records</li>
          <li>✅ All test users except super admin</li>
          <li>✅ All appointments, customers, sales_staff data</li>
          <li>✅ All broken/duplicate records</li>
        </ul>
        
        <h3>What will be preserved:</h3>
        <ul>
          <li>🔒 Super admin: nuttapong161@gmail.com</li>
          <li>🔒 Database schema and migrations</li>
          <li>🔒 System configurations</li>
        </ul>
      </div>
      
      <button 
        onClick={executeCleanup}
        disabled={loading}
        style={{
          padding: '15px 30px',
          backgroundColor: loading ? '#ccc' : '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}
      >
        {loading ? '🧹 Cleaning Database...' : '🧹 Execute Database Cleanup'}
      </button>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Cleanup Results:</h3>
          
          {result.success && (
            <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '5px', marginBottom: '15px' }}>
              <h4>✅ Cleanup Successful!</h4>
              <p><strong>Super Admin Status:</strong> {result.superAdmin ? `✅ ${result.superAdmin.email} (${result.superAdmin.role})` : '❌ NOT FOUND!'}</p>
            </div>
          )}
          
          {result.error && (
            <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '5px', marginBottom: '15px' }}>
              <h4>❌ Cleanup Failed!</h4>
              <p><strong>Error:</strong> {result.error}</p>
            </div>
          )}
          
          {result.auditResults && (
            <div style={{ marginBottom: '20px' }}>
              <h4>📊 Record Counts</h4>
              <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ccc' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Table</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Before</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>After</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(result.auditResults.before).map(table => (
                    <tr key={table}>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{table}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{result.auditResults.before[table]}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{result.auditResults.after[table]}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {result.auditResults.after[table] === 0 ? '✅ Clean' : 
                         result.auditResults.after[table] === 1 && table === 'users' ? '✅ Super Admin Only' :
                         '⚠️ Has Data'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {result.deletionResults && (
            <div style={{ marginBottom: '20px' }}>
              <h4>🗑️ Deletion Results</h4>
              {Object.entries(result.deletionResults).map(([table, status]: [string, any]) => (
                <div key={table} style={{ marginBottom: '5px' }}>
                  <strong>{table}:</strong> {status === 'SUCCESS' ? '✅' : '❌'} {status}
                </div>
              ))}
            </div>
          )}
          
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
            <h4>Full Response:</h4>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}

      {result && result.success && (
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
          <h3>🎯 Next Steps:</h3>
          <ol>
            <li>✅ Database cleaned successfully</li>
            <li>🔄 Test super admin login: <a href="/th/login" target="_blank">Login Page</a></li>
            <li>🏗️ Create clean clinic owner account</li>
            <li>🔐 Test authentication flows</li>
            <li>🧪 Verify data isolation</li>
          </ol>
        </div>
      )}
    </div>
  );
}
