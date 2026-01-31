/**
 * PromptPay QR Code Generator Logic
 * Based on EMVCo Standard
 */

import { crc16ccitt } from 'crc';

export function generatePromptPayQR(id: string, amount?: number): string {
  // 1. Format ID (Phone or National ID)
  const targetId = id.replace(/[^0-9]/g, '');
  let formattedId = '';
  
  if (targetId.length === 10) {
    // Phone number: 00-66-xxxxxxxxx
    formattedId = `0066${targetId.substring(1)}`;
  } else if (targetId.length === 13) {
    // National ID/Tax ID
    formattedId = targetId;
  } else {
    throw new Error('Invalid PromptPay ID format. Use phone number (10 digits) or Tax ID (13 digits).');
  }

  // 2. Build Payload
  const payload = [
    '000201', // Payload Format Indicator
    '010211', // Point of Initiation Method (11: Static, 12: Dynamic)
    '2937',   // Merchant Account Information
    '0016A000000677010111', // AID
    `01${formattedId.length.toString().padStart(2, '0')}${formattedId}`, // PromptPay ID
    '5303764', // Transaction Currency (764: THB)
  ];

  if (amount !== undefined && amount > 0) {
    const amountStr = amount.toFixed(2);
    payload.push(`54${amountStr.length.toString().padStart(2, '0')}${amountStr}`);
  }

  payload.push('5802TH'); // Country Code (TH)
  payload.push('6304');   // CRC Placeholder

  const finalPayload = payload.join('');
  const crc = crc16ccitt(finalPayload).toString(16).toUpperCase().padStart(4, '0');
  
  return finalPayload + crc;
}
