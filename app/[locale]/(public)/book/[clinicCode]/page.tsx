'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, User, Phone, Mail, CreditCard, Gift, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

interface Service {
  id: string;
  name: { th: string; en: string };
  description?: { th: string; en: string };
  duration_minutes: number;
  price: number;
  deposit_required: number;
  category?: string;
  image_url?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingSettings {
  minAdvanceHours: number;
  maxAdvanceDays: number;
  slotDuration: number;
  workingHours: Record<string, { open: string; close: string; enabled: boolean }>;
  requireDeposit: boolean;
  depositAmount: number;
  depositPercentage: number;
  cancellationHours: number;
  theme: { primaryColor: string; borderRadius: string };
}

export default function PublicBookingPage() {
  const params = useParams();
  const clinicCode = params.clinicCode as string;
  const locale = (params.locale as string) || 'th';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [clinic, setClinic] = useState<{ id: string; display_name: { th: string; en: string } } | null>(null);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardValid, setGiftCardValid] = useState<boolean | null>(null);
  const [giftCardDiscount, setGiftCardDiscount] = useState(0);

  // Fetch clinic data
  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/booking/public?clinic_code=${clinicCode}`);
        
        if (!res.ok) {
          throw new Error('Clinic not found or booking not available');
        }

        const data = await res.json();
        setClinic(data.clinic);
        setSettings(data.settings);
        setServices(data.services);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    if (clinicCode) {
      fetchClinicData();
    }
  }, [clinicCode]);

  // Fetch time slots when date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedService || !selectedDate || !clinic) return;

      try {
        setLoadingSlots(true);
        const dateStr = selectedDate.toISOString().split('T')[0];
        const res = await fetch(
          `/api/booking/slots?clinic_id=${clinic.id}&service_id=${selectedService.id}&date=${dateStr}`
        );

        if (res.ok) {
          const data = await res.json();
          setTimeSlots(data.slots);
        }
      } catch (err) {
        console.error('Failed to fetch slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedService, selectedDate, clinic]);

  // Validate gift card
  const validateGiftCard = async () => {
    if (!giftCardCode || !clinic) return;

    try {
      const res = await fetch('/api/gift-cards/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: giftCardCode, clinicId: clinic.id })
      });

      const data = await res.json();
      setGiftCardValid(data.valid);
      
      if (data.valid && selectedService) {
        if (data.giftCard.type === 'value') {
          setGiftCardDiscount(Math.min(data.giftCard.balance, selectedService.price));
        } else if (data.giftCard.type === 'percentage') {
          const discount = (selectedService.price * data.giftCard.discountPercentage) / 100;
          setGiftCardDiscount(Math.min(discount, data.giftCard.maxDiscount || discount));
        }
      }
    } catch (err) {
      setGiftCardValid(false);
    }
  };

  // Submit booking
  const handleSubmit = async () => {
    if (!clinic || !selectedService || !selectedDate || !selectedTime) return;

    try {
      setSubmitting(true);
      const dateStr = selectedDate.toISOString().split('T')[0];

      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic.id,
          serviceId: selectedService.id,
          date: dateStr,
          time: selectedTime,
          customerInfo,
          notes: customerInfo.notes,
          giftCardCode: giftCardValid ? giftCardCode : undefined
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Booking failed');
      }
    } catch (err) {
      setError('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate calendar dates
  const generateDates = () => {
    if (!settings) return [];

    const dates: Date[] = [];
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + settings.maxAdvanceDays);

    const current = new Date(today);
    current.setHours(0, 0, 0, 0);

    while (current <= maxDate) {
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][current.getDay()];
      if (settings.workingHours[dayName]?.enabled) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {locale === 'th' ? 'ไม่พบคลินิก' : 'Clinic Not Found'}
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {locale === 'th' ? 'จองสำเร็จ!' : 'Booking Confirmed!'}
          </h1>
          <p className="text-gray-600 mb-4">
            {locale === 'th' 
              ? 'เราจะส่งข้อความยืนยันไปยังหมายเลขโทรศัพท์ของคุณ'
              : 'A confirmation will be sent to your phone number'}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="font-medium">{selectedService?.name[locale as 'th' | 'en']}</p>
            <p className="text-sm text-gray-600">
              {selectedDate && formatDate(selectedDate)} • {selectedTime}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const availableDates = generateDates();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {clinic?.display_name[locale as 'th' | 'en']}
          </h1>
          <p className="text-gray-600">
            {locale === 'th' ? 'จองนัดหมายออนไลน์' : 'Book an Appointment'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 ${
                    step > s ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {locale === 'th' ? 'เลือกบริการ' : 'Select Service'}
              </h2>
              <div className="space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedService?.id === service.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {service.name[locale as 'th' | 'en']}
                        </p>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {service.description[locale as 'th' | 'en']}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration_minutes} {locale === 'th' ? 'นาที' : 'min'}
                          </span>
                        </div>
                      </div>
                      <p className="font-semibold text-indigo-600">
                        {formatPrice(service.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && selectedService && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {locale === 'th' ? 'เลือกวันและเวลา' : 'Select Date & Time'}
              </h2>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {locale === 'th' ? 'วันที่' : 'Date'}
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableDates.slice(0, 14).map((date, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                      }}
                      className={`flex-shrink-0 px-4 py-3 rounded-lg text-center ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <p className="text-xs font-medium">
                        {date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-lg font-bold">{date.getDate()}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {locale === 'th' ? 'เวลา' : 'Time'}
                  </label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`py-2 px-3 rounded-lg text-sm font-medium ${
                            selectedTime === slot.time
                              ? 'bg-indigo-600 text-white'
                              : slot.available
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {locale === 'th' ? 'ย้อนกลับ' : 'Back'}
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedTime}
                  className="flex items-center gap-1 bg-indigo-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {locale === 'th' ? 'ถัดไป' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Customer Info */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {locale === 'th' ? 'ข้อมูลผู้จอง' : 'Your Information'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    {locale === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    {locale === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number'} *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    {locale === 'th' ? 'อีเมล' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'th' ? 'หมายเหตุ' : 'Notes'}
                  </label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {locale === 'th' ? 'ย้อนกลับ' : 'Back'}
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!customerInfo.name || !customerInfo.phone}
                  className="flex items-center gap-1 bg-indigo-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {locale === 'th' ? 'ถัดไป' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && selectedService && selectedDate && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {locale === 'th' ? 'ยืนยันการจอง' : 'Confirm Booking'}
              </h2>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedService.name[locale as 'th' | 'en']}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(selectedDate)} • {selectedTime}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedService.duration_minutes} {locale === 'th' ? 'นาที' : 'minutes'}
                    </p>
                  </div>
                  <p className="font-semibold text-lg">
                    {formatPrice(selectedService.price)}
                  </p>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600">{customerInfo.name}</p>
                  <p className="text-sm text-gray-600">{customerInfo.phone}</p>
                </div>
              </div>

              {/* Gift Card */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Gift className="w-4 h-4 inline mr-1" />
                  {locale === 'th' ? 'รหัส Gift Card' : 'Gift Card Code'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={giftCardCode}
                    onChange={(e) => {
                      setGiftCardCode(e.target.value.toUpperCase());
                      setGiftCardValid(null);
                    }}
                    placeholder="GC-XXXXXXXX"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={validateGiftCard}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {locale === 'th' ? 'ใช้' : 'Apply'}
                  </button>
                </div>
                {giftCardValid === true && (
                  <p className="text-green-600 text-sm mt-1">
                    ✓ {locale === 'th' ? 'ส่วนลด' : 'Discount'}: {formatPrice(giftCardDiscount)}
                  </p>
                )}
                {giftCardValid === false && (
                  <p className="text-red-600 text-sm mt-1">
                    {locale === 'th' ? 'รหัสไม่ถูกต้อง' : 'Invalid code'}
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {locale === 'th' ? 'ยอดรวม' : 'Total'}
                  </span>
                  <span className="text-xl font-bold text-indigo-600">
                    {formatPrice(selectedService.price - giftCardDiscount)}
                  </span>
                </div>
                {settings?.requireDeposit && (
                  <p className="text-sm text-gray-600 mt-1">
                    {locale === 'th' ? 'ต้องชำระมัดจำ' : 'Deposit required'}: {formatPrice(settings.depositAmount || (selectedService.price * settings.depositPercentage / 100))}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {locale === 'th' ? 'ย้อนกลับ' : 'Back'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {locale === 'th' ? 'ยืนยันการจอง' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
