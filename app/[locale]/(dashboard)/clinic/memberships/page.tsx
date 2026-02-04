'use client';

import { useState, useEffect } from 'react';
import { Crown, Plus, Users, TrendUp, Star, Gear } from '@phosphor-icons/react';

interface Membership {
  id: string;
  name: { th: string; en: string };
  description?: { th: string; en: string };
  price: number;
  billing_period: string;
  discount_all_services: number;
  priority_booking: boolean;
  free_consultations: number;
  points_multiplier: number;
  welcome_points: number;
  badge_color: string;
  is_active: boolean;
}

interface CustomerMembership {
  id: string;
  status: string;
  start_date: string;
  end_date?: string;
  membership: Membership;
}

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [customerMemberships, setCustomerMemberships] = useState<CustomerMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'members'>('plans');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membershipsRes] = await Promise.all([
        fetch('/api/memberships?clinic_id=current')
      ]);
      
      const membershipsData = await membershipsRes.json();
      setMemberships(membershipsData.memberships || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getBillingLabel = (period: string) => {
    switch (period) {
      case 'monthly': return '/เดือน';
      case 'quarterly': return '/ไตรมาส';
      case 'yearly': return '/ปี';
      case 'one_time': return 'ครั้งเดียว';
      default: return '';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-7 h-7 text-yellow-500" />
            Memberships
          </h1>
          <p className="text-gray-600">จัดการแพ็คเกจสมาชิกและสิทธิพิเศษ</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          สร้างแพ็คเกจ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">แพ็คเกจทั้งหมด</p>
              <p className="text-xl font-bold">{memberships.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">สมาชิกทั้งหมด</p>
              <p className="text-xl font-bold">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">รายได้/เดือน</p>
              <p className="text-xl font-bold">฿0</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">อัตราต่ออายุ</p>
              <p className="text-xl font-bold">0%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 px-1 font-medium ${
            activeTab === 'plans'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          แพ็คเกจสมาชิก
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-1 font-medium ${
            activeTab === 'members'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          รายชื่อสมาชิก
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : activeTab === 'plans' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border">
              <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">ยังไม่มีแพ็คเกจสมาชิก</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-indigo-600 hover:underline"
              >
                สร้างแพ็คเกจแรก
              </button>
            </div>
          ) : (
            memberships.map((membership) => (
              <div
                key={membership.id}
                className="bg-white rounded-xl border overflow-hidden"
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: membership.badge_color }}
                />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {membership.name.th}
                      </h3>
                      {membership.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {membership.description.th}
                        </p>
                      )}
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Gear className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(membership.price)}
                    </span>
                    <span className="text-gray-500">
                      {getBillingLabel(membership.billing_period)}
                    </span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {membership.discount_all_services > 0 && (
                      <li className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                        ส่วนลดบริการ {membership.discount_all_services}%
                      </li>
                    )}
                    {membership.priority_booking && (
                      <li className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                        จองคิวก่อนใคร
                      </li>
                    )}
                    {membership.free_consultations > 0 && (
                      <li className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                        ปรึกษาฟรี {membership.free_consultations} ครั้ง
                      </li>
                    )}
                    {membership.points_multiplier > 1 && (
                      <li className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                        รับแต้ม {membership.points_multiplier}x
                      </li>
                    )}
                    {membership.welcome_points > 0 && (
                      <li className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                        Welcome Points {membership.welcome_points} แต้ม
                      </li>
                    )}
                  </ul>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">0 สมาชิก</span>
                    <span className={`px-2 py-1 rounded ${
                      membership.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {membership.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ยังไม่มีสมาชิก</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">สร้างแพ็คเกจสมาชิกใหม่</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const res = await fetch('/api/memberships', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: { th: formData.get('nameTh'), en: formData.get('nameEn') },
                    description: { th: formData.get('descTh'), en: formData.get('descEn') },
                    price: Number(formData.get('price')),
                    billingPeriod: formData.get('billingPeriod'),
                    discountAllServices: Number(formData.get('discount')) || 0,
                    priorityBooking: formData.get('priorityBooking') === 'on',
                    freeConsultations: Number(formData.get('freeConsultations')) || 0,
                    pointsMultiplier: Number(formData.get('pointsMultiplier')) || 1,
                    welcomePoints: Number(formData.get('welcomePoints')) || 0,
                    badgeColor: formData.get('badgeColor') || '#6366f1'
                  })
                });
                if (res.ok) {
                  setShowCreateModal(false);
                  fetchData();
                }
              }}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ชื่อ (ไทย)</label>
                    <input name="nameTh" required className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ชื่อ (English)</label>
                    <input name="nameEn" className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">คำอธิบาย (ไทย)</label>
                  <textarea name="descTh" rows={2} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ราคา (บาท)</label>
                    <input type="number" name="price" required className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">รอบการเรียกเก็บ</label>
                    <select name="billingPeriod" className="w-full border rounded-lg px-3 py-2">
                      <option value="monthly">รายเดือน</option>
                      <option value="quarterly">รายไตรมาส</option>
                      <option value="yearly">รายปี</option>
                      <option value="one_time">ครั้งเดียว</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ส่วนลดบริการ (%)</label>
                    <input type="number" name="discount" defaultValue={0} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ปรึกษาฟรี (ครั้ง)</label>
                    <input type="number" name="freeConsultations" defaultValue={0} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ตัวคูณแต้ม (x)</label>
                    <input type="number" name="pointsMultiplier" defaultValue={1} step="0.1" className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Welcome Points</label>
                    <input type="number" name="welcomePoints" defaultValue={0} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="priorityBooking" className="rounded" />
                    <span className="text-sm">จองคิวก่อนใคร</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">สี Badge:</label>
                    <input type="color" name="badgeColor" defaultValue="#6366f1" className="w-8 h-8 rounded" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  สร้างแพ็คเกจ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
