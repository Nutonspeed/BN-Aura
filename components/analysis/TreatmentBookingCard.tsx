'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BookingIcon,
  TreatmentIcon,
  LaserIcon,
  InjectionIcon,
  SuccessIcon,
  StarIcon,
  TimerIcon,
  ChevronRightIcon,
} from '@/components/ui/icons';

interface Treatment {
  id: string;
  name: string;
  nameThai: string;
  category: 'laser' | 'injection' | 'facial' | 'skincare';
  price: string;
  duration: string;
  sessions: number;
  matchScore: number;
  description: string;
  benefits: string[];
}

interface TreatmentBookingCardProps {
  treatments: Treatment[];
  customerName?: string;
  analysisScore?: number;
  onBook?: (treatment: Treatment, date: string, time: string) => void;
}

export default function TreatmentBookingCard({
  treatments,
  customerName = 'ลูกค้า',
  analysisScore = 72,
  onBook,
}: TreatmentBookingCardProps) {
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [step, setStep] = useState<'list' | 'details' | 'booking' | 'confirmed'>('list');

  const getCategoryIcon = (category: Treatment['category']) => {
    switch (category) {
      case 'laser': return <LaserIcon size="md" />;
      case 'injection': return <InjectionIcon size="md" />;
      default: return <TreatmentIcon size="md" />;
    }
  };

  const getAvailableTimes = () => [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00',
  ];

  const getAvailableDates = () => {
    const dates = [];
    for (let i = 1; i <= 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      if (date.getDay() !== 0) { // Skip Sundays
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const handleBook = () => {
    if (selectedTreatment && selectedDate && selectedTime && onBook) {
      onBook(selectedTreatment, selectedDate, selectedTime);
    }
    setStep('confirmed');
  };

  // Sample treatments if none provided
  const displayTreatments = treatments.length > 0 ? treatments : [
    {
      id: '1',
      name: 'Pico Genesis Laser',
      nameThai: 'พิโค เจเนซิส เลเซอร์',
      category: 'laser' as const,
      price: '8,000 - 12,000',
      duration: '30 นาที',
      sessions: 3,
      matchScore: 95,
      description: 'เลเซอร์กำจัดฝ้า กระ จุดด่างดำ ปรับสีผิวให้สม่ำเสมอ',
      benefits: ['ลดฝ้า กระ', 'ผิวกระจ่างใส', 'กระตุ้นคอลลาเจน'],
    },
    {
      id: '2',
      name: 'HydraFacial',
      nameThai: 'ไฮดราเฟเชียล',
      category: 'facial' as const,
      price: '3,500 - 5,000',
      duration: '45 นาที',
      sessions: 1,
      matchScore: 88,
      description: 'ทำความสะอาดลึก เพิ่มความชุ่มชื้น กระชับรูขุมขน',
      benefits: ['ทำความสะอาดลึก', 'เพิ่มความชุ่มชื้น', 'กระชับรูขุมขน'],
    },
    {
      id: '3',
      name: 'Botox Forehead',
      nameThai: 'โบท็อกซ์หน้าผาก',
      category: 'injection' as const,
      price: '5,000 - 8,000',
      duration: '15 นาที',
      sessions: 1,
      matchScore: 82,
      description: 'ลดริ้วรอยบริเวณหน้าผาก ระหว่างคิ้ว',
      benefits: ['ลดริ้วรอยหน้าผาก', 'ป้องกันริ้วรอยใหม่', 'หน้าเรียบเนียน'],
    },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <BookingIcon size="lg" />
          <div>
            <h3 className="font-semibold">Treatment แนะนำ</h3>
            <p className="text-xs text-muted-foreground">
              จากผลวิเคราะห์ Score {analysisScore}/100
            </p>
          </div>
        </div>

        {/* Step: Treatment List */}
        {step === 'list' && (
          <div className="space-y-3">
            {displayTreatments.map((treatment) => (
              <div
                key={treatment.id}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-all hover:border-primary/50',
                  selectedTreatment?.id === treatment.id && 'border-primary bg-primary/5'
                )}
                onClick={() => {
                  setSelectedTreatment(treatment);
                  setStep('details');
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {getCategoryIcon(treatment.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{treatment.nameThai}</p>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        treatment.matchScore >= 90 ? 'bg-green-500/20 text-green-600' :
                        treatment.matchScore >= 70 ? 'bg-amber-500/20 text-amber-600' :
                        'bg-gray-500/20 text-gray-600'
                      )}>
                        {treatment.matchScore}% match
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{treatment.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>฿{treatment.price}</span>
                      <span>•</span>
                      <span>{treatment.duration}</span>
                    </div>
                  </div>
                  <ChevronRightIcon size="sm" className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step: Treatment Details */}
        {step === 'details' && selectedTreatment && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-background rounded-lg">
                {getCategoryIcon(selectedTreatment.category)}
              </div>
              <div>
                <p className="font-semibold">{selectedTreatment.nameThai}</p>
                <p className="text-xs text-muted-foreground">{selectedTreatment.name}</p>
              </div>
            </div>

            <p className="text-sm">{selectedTreatment.description}</p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-primary">฿{selectedTreatment.price}</p>
                <p className="text-xs text-muted-foreground">ราคา</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{selectedTreatment.duration}</p>
                <p className="text-xs text-muted-foreground">ระยะเวลา</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{selectedTreatment.sessions}</p>
                <p className="text-xs text-muted-foreground">ครั้ง</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">ประโยชน์:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTreatment.benefits.map((benefit, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded-full">
                    ✓ {benefit}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => setStep('booking')}>
                จองนัดหมาย
              </Button>
              <Button variant="outline" onClick={() => setStep('list')}>
                กลับ
              </Button>
            </div>
          </div>
        )}

        {/* Step: Booking */}
        {step === 'booking' && selectedTreatment && (
          <div className="space-y-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="font-medium">{selectedTreatment.nameThai}</p>
              <p className="text-xs text-muted-foreground">฿{selectedTreatment.price}</p>
            </div>

            {/* Date Selection */}
            <div>
              <p className="text-sm font-medium mb-2">เลือกวันที่:</p>
              <div className="grid grid-cols-4 gap-2">
                {getAvailableDates().slice(0, 8).map((date) => {
                  const d = new Date(date);
                  const dayName = d.toLocaleDateString('th-TH', { weekday: 'short' });
                  const dayNum = d.getDate();
                  return (
                    <button
                      key={date}
                      className={cn(
                        'p-2 border rounded-lg text-center transition-all',
                        selectedDate === date 
                          ? 'border-primary bg-primary/10' 
                          : 'hover:border-primary/50'
                      )}
                      onClick={() => setSelectedDate(date)}
                    >
                      <p className="text-xs text-muted-foreground">{dayName}</p>
                      <p className="font-bold">{dayNum}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <p className="text-sm font-medium mb-2">เลือกเวลา:</p>
                <div className="grid grid-cols-5 gap-2">
                  {getAvailableTimes().map((time) => (
                    <button
                      key={time}
                      className={cn(
                        'p-2 border rounded-lg text-sm transition-all',
                        selectedTime === time 
                          ? 'border-primary bg-primary/10' 
                          : 'hover:border-primary/50'
                      )}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                onClick={handleBook}
                disabled={!selectedDate || !selectedTime}
              >
                ยืนยันนัดหมาย
              </Button>
              <Button variant="outline" onClick={() => setStep('details')}>
                กลับ
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirmed */}
        {step === 'confirmed' && selectedTreatment && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <SuccessIcon size="xl" className="text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">จองสำเร็จ!</h3>
            <p className="text-muted-foreground mb-4">
              นัดหมาย {selectedTreatment.nameThai}
            </p>
            <div className="p-4 bg-muted/50 rounded-lg mb-4 text-left">
              <p><strong>วันที่:</strong> {new Date(selectedDate).toLocaleDateString('th-TH', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}</p>
              <p><strong>เวลา:</strong> {selectedTime} น.</p>
              <p><strong>ราคา:</strong> ฿{selectedTreatment.price}</p>
            </div>
            <Button onClick={() => {
              setStep('list');
              setSelectedTreatment(null);
              setSelectedDate('');
              setSelectedTime('');
            }}>
              เสร็จสิ้น
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
