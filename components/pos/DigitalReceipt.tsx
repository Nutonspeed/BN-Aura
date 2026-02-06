'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Printer, Download, ShareNetwork, CheckCircle, Buildings, MapPin, Phone, User } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface DigitalReceiptProps {
  transactionNumber: string;
  date: string;
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  clinicInfo: {
    name: string;
    address: string;
    phone: string;
    logo?: string;
  };
}

export default function DigitalReceipt({
  transactionNumber,
  date,
  customerName,
  items,
  subtotal,
  discount,
  tax,
  total,
  clinicInfo
}: DigitalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#0A0A0A',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${transactionNumber}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Failed to generate PDF. Please try printing instead.');
    }
  };

  return (
    <div className="space-y-8">
      <div 
        ref={receiptRef}
        className="flex flex-col gap-8 max-w-lg mx-auto bg-[#0A0A0A] p-10 rounded-[48px] border border-white/10 shadow-2xl print:bg-white print:text-black print:p-0 print:border-none print:shadow-none"
      >
        {/* Header - Clinic Info */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/20 rounded-[32px] flex items-center justify-center mx-auto mb-4 border border-primary/20 print:hidden">
            <Buildings className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white print:text-black">{clinicInfo.name}</h2>
          <div className="space-y-1 text-xs text-muted-foreground font-medium print:text-gray-600">
            <p className="flex items-center justify-center gap-2"><MapPin className="w-3 h-3" /> {clinicInfo.address}</p>
            <p className="flex items-center justify-center gap-2"><Phone className="w-3 h-3" /> {clinicInfo.phone}</p>
          </div>
        </div>

        <div className="h-px bg-white/5 w-full print:bg-gray-200" />

        {/* Transaction Details */}
        <div className="grid grid-cols-2 gap-6 text-[10px] font-black uppercase tracking-widest">
          <div className="space-y-1">
            <p className="text-muted-foreground print:text-gray-500">Transaction No.</p>
            <p className="text-white print:text-black font-mono">{transactionNumber}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-muted-foreground print:text-gray-500">Date & Time</p>
            <p className="text-white print:text-black">{new Date(date).toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground print:text-gray-500">Customer Node</p>
            <p className="text-white print:text-black flex items-center gap-2">
              <User className="w-3 h-3 text-primary print:hidden" />
              {customerName}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-muted-foreground print:text-gray-500">Status</p>
            <p className="text-emerald-400 font-bold">PAID & VALIDATED</p>
          </div>
        </div>

        <div className="h-px bg-white/5 w-full print:bg-gray-200" />

        {/* Items Table */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Protocol Payload</p>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div className="space-y-0.5 max-w-[70%]">
                  <p className="font-bold text-white print:text-black leading-tight uppercase">{item.item_name}</p>
                  <p className="text-[10px] text-muted-foreground print:text-gray-500 font-medium">
                    {item.quantity} x ฿{item.unit_price.toLocaleString()}
                  </p>
                </div>
                <p className="font-black text-white print:text-black tabular-nums">฿{item.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/5 w-full print:bg-gray-200" />

        {/* Totals */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground print:text-gray-500 uppercase tracking-widest">
            <span>Subtotal</span>
            <span className="tabular-nums">฿{subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <span>Discounts</span>
              <span className="tabular-nums">-฿{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground print:text-gray-500 uppercase tracking-widest">
            <span>Tax (0%)</span>
            <span className="tabular-nums">฿{tax.toLocaleString()}</span>
          </div>
          <div className="pt-4 border-t border-white/5 print:border-gray-200 flex justify-between items-center">
            <span className="text-sm font-black text-white print:text-black uppercase tracking-[0.2em]">Total Value</span>
            <span className="text-3xl font-black text-primary print:text-black tracking-tighter tabular-nums">
              ฿{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Footer / QR (Placeholder for digital validation) */}
        <div className="text-center space-y-4 pt-4">
          <p className="text-[9px] text-muted-foreground italic font-light print:text-gray-500 leading-relaxed">
            Thank you for choosing BN-Aura Aesthetic Cluster.
            <br />
            This is a system-generated digital node receipt.
          </p>
          <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase text-white/10 print:text-gray-300">
            <CheckCircle className="w-3 h-3" />
            Neural Receipt Node v1.0
          </div>
        </div>
      </div>

      {/* Actions - Hidden on Print */}
      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
        >
          <Printer className="w-4 h-4" />
          Print Node
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
    </div>
  );
}