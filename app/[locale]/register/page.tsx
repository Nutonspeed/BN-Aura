'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EnvelopeSimple, Lock, User, Eye, EyeSlash, Shield, Sparkle } from '@phosphor-icons/react';

export default function RegisterPage() {
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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
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
        router.push('/th/login?message=Registration successful. Please login.');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <Sparkle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BN-Aura</h1>
          <p className="text-blue-200">สมัครสมาชิกเพื่อเริ่มต้นการดูแลความงาม</p>
        </div>

        {/* Register Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                ชื่อ-นามสกุล
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                อีเมล
              </label>
              <div className="relative">
                <EnvelopeSimple className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                เบอร์โทรศัพท์ (ไม่จำเป็น)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="081-234-5678"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-12 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="รหัสผ่านอย่างน้อย 8 ตัวอักษร"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-blue-300 hover:text-white"
                >
                  {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  minLength={8}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 text-purple-500 bg-white/5 border-white/20 rounded focus:ring-purple-500"
              />
              <p className="text-sm text-blue-200">
                ฉันยอมรับ{' '}
                <Link href="/th/terms" className="text-purple-300 hover:text-purple-200 underline">
                  เงื่อนไขการให้บริการ
                </Link>{' '}
                และ{' '}
                <Link href="/th/privacy" className="text-purple-300 hover:text-purple-200 underline">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-blue-200">
              มีบัญชีอยู่แล้ว?{' '}
              <Link href="/th/login" className="text-purple-300 hover:text-purple-200 font-semibold">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-blue-300 text-sm">
          <Shield className="w-4 h-4" />
          <span>ข้อมูลของคุณปลอดภัยและเข้ารหัส</span>
        </div>
      </div>
    </div>
  );
}
