'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePromptPayPayload } from '@/lib/payments/promptpay';

interface PromptPayQRProps {
  amount: number;
  promptPayTarget: string;
  accountName?: string;
  paymentId?: string;
  onConfirm?: (paymentId: string) => void;
  onCancel?: () => void;
}

export default function PromptPayQR({
  amount,
  promptPayTarget,
  accountName = 'คลินิก',
  paymentId,
  onConfirm,
  onCancel,
}: PromptPayQRProps) {
  const [status, setStatus] = useState<'pending' | 'confirming' | 'completed' | 'cancelled'>('pending');
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes
  const [note, setNote] = useState('');

  const qrPayload = generatePromptPayPayload({ target: promptPayTarget, amount });

  // Countdown timer
  useEffect(() => {
    if (status !== 'pending') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  async function handleConfirm() {
    if (!paymentId) {
      onConfirm?.('');
      return;
    }
    setStatus('confirming');
    try {
      const res = await fetch('/api/payments/promptpay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action: 'confirm', note }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('completed');
        onConfirm?.(paymentId);
      } else {
        setStatus('pending');
        alert(data.error || 'ยืนยันไม่สำเร็จ');
      }
    } catch {
      setStatus('pending');
      alert('เกิดข้อผิดพลาด');
    }
  }

  async function handleCancel() {
    if (paymentId) {
      await fetch('/api/payments/promptpay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action: 'cancel' }),
      });
    }
    setStatus('cancelled');
    onCancel?.();
  }

  if (status === 'completed') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 dark:border-green-800">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-green-700 dark:text-green-300">ชำระเงินเรียบร้อย!</p>
        <p className="text-2xl font-bold text-green-800 dark:text-green-200">฿{amount.toLocaleString()}</p>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl">
        <p className="text-gray-500">รายการถูกยกเลิก</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">฿</span>
          </div>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">พร้อมเพย์ PromptPay</span>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">฿{amount.toLocaleString()}</p>
        <p className="text-sm text-gray-500 mt-1">{accountName}</p>
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl">
        <QRCodeSVG
          value={qrPayload}
          size={220}
          level="M"
          includeMargin={false}
        />
      </div>

      {/* Timer */}
      {countdown > 0 ? (
        <p className="text-sm text-gray-500">
          หมดอายุใน <span className="font-mono font-semibold text-orange-500">{minutes}:{seconds.toString().padStart(2, '0')}</span>
        </p>
      ) : (
        <p className="text-sm text-red-500 font-semibold">QR หมดอายุแล้ว กรุณาสร้างใหม่</p>
      )}

      {/* Instructions */}
      <div className="w-full bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
        <p className="font-medium mb-1">วิธีชำระ:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-xs">
          <li>เปิดแอปธนาคารบนมือถือ</li>
          <li>เลือก &quot;สแกน QR&quot; หรือ &quot;จ่ายเงิน&quot;</li>
          <li>สแกน QR Code ด้านบน</li>
          <li>ตรวจสอบยอดเงินแล้วกดยืนยัน</li>
        </ol>
      </div>

      {/* Note input */}
      <input
        type="text"
        placeholder="หมายเหตุ (ไม่บังคับ)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />

      {/* Action buttons */}
      <div className="flex gap-3 w-full">
        <button
          onClick={handleCancel}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleConfirm}
          disabled={status === 'confirming' || countdown === 0}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'confirming' ? 'กำลังยืนยัน...' : '✓ ยืนยันรับเงินแล้ว'}
        </button>
      </div>
    </div>
  );
}
