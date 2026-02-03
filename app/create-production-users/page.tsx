'use client';

import { useState } from 'react';

export default function CreateProductionUsersPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    clinicCount: 10,
    staffPerClinic: 5,
    customersPerSales: 30
  });

  const executeCreation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/create-production-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const estimatedUsers = config.clinicCount * (config.staffPerClinic + config.customersPerSales);
  const estimatedConcurrent = Math.floor(estimatedUsers * 0.15);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px' }}>
      <h1>🏭 Production Scale User Creation</h1>
      <p><strong>Phase 2A:</strong> Creating production-scale test data for multi-tenant testing</p>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
        <h3>🎯 Configuration</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Number of Clinics:
            </label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={config.clinicCount}
              onChange={(e) => setConfig({...config, clinicCount: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Staff per Clinic:
            </label>
            <input 
              type="number" 
              min="2" 
              max="20" 
              value={config.staffPerClinic}
              onChange={(e) => setConfig({...config, staffPerClinic: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Customers per Sales Staff:
            </label>
            <input 
              type="number" 
              min="10" 
              max="50" 
              value={config.customersPerSales}
              onChange={(e) => setConfig({...config, customersPerSales: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
          <h4>📊 Estimated Scale:</h4>
          <ul>
            <li><strong>Total Users:</strong> {estimatedUsers.toLocaleString()}</li>
            <li><strong>Staff Members:</strong> {(config.clinicCount * config.staffPerClinic).toLocaleString()}</li>
            <li><strong>Customers:</strong> {(config.clinicCount * config.customersPerSales).toLocaleString()}</li>
            <li><strong>Estimated Concurrent Users:</strong> {estimatedConcurrent.toLocaleString()} (15% peak usage)</li>
          </ul>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>🏗️ What will be created:</h3>
        <ul>
          <li>✅ <strong>{config.clinicCount} Test Clinics</strong> (Premium, Standard, Basic tiers)</li>
          <li>✅ <strong>1 Clinic Owner</strong> per clinic</li>
          <li>✅ <strong>1 Sales Staff</strong> per clinic (isolated customer base)</li>
          <li>✅ <strong>{config.staffPerClinic - 1} Additional Staff</strong> per clinic (admins, beauticians)</li>
          <li>✅ <strong>{config.customersPerSales} Customers</strong> per sales staff (data isolation testing)</li>
          <li>✅ <strong>Multi-region distribution</strong> (Bangkok, Chiang Mai, Phuket)</li>
        </ul>
      </div>
      
      <button 
        onClick={executeCreation}
        disabled={loading}
        style={{
          padding: '15px 30px',
          backgroundColor: loading ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}
      >
        {loading ? '🏭 Creating Production Users...' : '🚀 Create Production Scale Users'}
      </button>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Creation Results:</h3>
          
          {result.success && (
            <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '5px', marginBottom: '15px' }}>
              <h4>✅ Production Users Created Successfully!</h4>
              
              {result.summary && (
                <div style={{ marginTop: '15px' }}>
                  <h5>📊 Creation Summary:</h5>
                  <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ccc' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Type</th>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Count</th>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>Test Clinics</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>{result.summary.clinics}</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>✅ Created</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>Staff Members</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>{result.summary.staff}</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>✅ Created</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>Customers</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>{result.summary.customers}</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>✅ Created</td>
                      </tr>
                      <tr style={{ backgroundColor: '#e7f3ff' }}>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}><strong>Total Users</strong></td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}><strong>{result.summary.totalUsers}</strong></td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}><strong>🎯 Ready for Testing</strong></td>
                      </tr>
                      <tr style={{ backgroundColor: '#fff3cd' }}>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}><strong>Estimated Concurrent</strong></td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}><strong>{result.summary.estimatedConcurrentUsers}</strong></td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}><strong>📈 Peak Load Target</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {result.error && (
            <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '5px', marginBottom: '15px' }}>
              <h4>❌ Creation Failed!</h4>
              <p><strong>Error:</strong> {result.error}</p>
              {result.details && <pre style={{ fontSize: '12px', overflow: 'auto' }}>{result.details}</pre>}
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
          <h3>🚀 Next Testing Steps:</h3>
          <ol>
            <li>✅ Production scale users created</li>
            <li>🔄 Test sales staff data isolation</li>
            <li>🧪 Run concurrent load testing ({estimatedConcurrent}+ users)</li>
            <li>🔒 Verify commission security between sales staff</li>
            <li>📊 Performance testing under production load</li>
          </ol>
        </div>
      )}
    </div>
  );
}
