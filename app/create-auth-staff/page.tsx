'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Key, EnvelopeSimple, User, Buildings, SpinnerGap, CheckCircle, WarningCircle } from '@phosphor-icons/react';

export default function CreateAuthStaffPage() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'sales_staff',
    clinicId: '',
    temporaryPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/create-staff-with-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to create staff');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create Authenticated Staff</h1>
              <p className="text-gray-400">Create staff with Supabase Auth integration</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <EnvelopeSimple className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="staff@clinic.com"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Staff Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="sales_staff">Sales Staff</option>
                  <option value="clinic_staff">Clinic Staff</option>
                  <option value="clinic_admin">Clinic Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Buildings className="w-4 h-4 inline mr-2" />
                  Clinic ID
                </label>
                <input
                  type="text"
                  name="clinicId"
                  value={formData.clinicId}
                  onChange={handleInputChange}
                  placeholder="00000000-0000-0000-0000-000000000001"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Key className="w-4 h-4 inline mr-2" />
                Temporary Password (optional)
              </label>
              <input
                type="password"
                name="temporaryPassword"
                value={formData.temporaryPassword}
                onChange={handleInputChange}
                placeholder="Leave blank for default password"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <SpinnerGap className="w-5 h-5 animate-spin" />
                  Creating Staff...
                </div>
              ) : (
                'Create Authenticated Staff'
              )}
            </button>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <WarningCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-red-400 font-medium">Error</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-green-500/20 border border-green-500/50 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium text-lg">Staff Created Successfully!</p>
                  <p className="text-green-300 text-sm">Authentication and database records created</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-black/30 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">Login Credentials:</p>
                  <p className="text-white font-mono">
                    Email: {result.data.credentials.email}
                  </p>
                  <p className="text-white font-mono">
                    Password: {result.data.credentials.temporaryPassword}
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">Next Steps:</p>
                  <p className="text-white text-sm">
                    • Login at: {result.nextSteps.loginUrl}
                  </p>
                  <p className="text-white text-sm">
                    • Dashboard: {result.nextSteps.dashboardUrl}
                  </p>
                  <p className="text-white text-sm">
                    • Staff can now access their role-specific dashboard
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
