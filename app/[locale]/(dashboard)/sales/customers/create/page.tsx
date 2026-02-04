'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EnvelopeSimple, Lock, User, Phone, Eye, EyeSlash, ArrowLeft, Users, Shield } from '@phosphor-icons/react';

export default function CreateCustomerPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/sales/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`สร้างลูกค้า ${formData.fullName} สำเร็จ!`);
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          phone: ''
        });
      } else {
        setError(data.error || 'Failed to create customer');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/th/sales/customers" 
            className="inline-flex items-center text-blue-300 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปหน้าลูกค้า
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">สร้างลูกค้าใหม่</h1>
              <p className="text-blue-200">สร้างบัญชีสำหรับลูกค้าของคุณ</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl">
          {/* Warning Card */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 font-semibold">ข้อมูลสำคัญ:</p>
                <p className="text-yellow-100 text-sm">
                  ลูกค้าที่สร้างจะอยู่ภายใต้การดูแลของคุณเท่านั้น พนักงานขายคนอื่นไม่สามารถเห็นข้อมูลลูกค้านี้ได้
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                  <p className="text-green-200 text-sm">{success}</p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  ชื่อ-นามสกุล *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="กรอกชื่อ-นามสกุลลูกค้า"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  อีเมล *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="customer@email.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="081-234-5678"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  รหัสผ่าน *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-12 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="รหัสผ่านอย่างน้อย 8 ตัวอักษร"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-blue-300 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  ยืนยันรหัสผ่าน *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                    minLength={8}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'กำลังสร้าง...' : 'สร้างบัญชีลูกค้า'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
