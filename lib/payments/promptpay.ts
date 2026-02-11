/**
 * PromptPay QR Code Generator
 * Generates EMVCo-compliant QR payload for Thai PromptPay
 * Supports: Phone number (13 digits) and Tax ID (13 digits)
 */

// CRC-16/CCITT-FALSE (ISO 13239)
function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function formatPhone(phone: string): string {
  // Remove leading 0, add country code 66
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '66' + cleaned.substring(1);
  }
  // Pad to 13 digits with leading zeros
  return cleaned.padStart(13, '0');
}

function formatTaxId(taxId: string): string {
  return taxId.replace(/[^0-9]/g, '').padStart(13, '0');
}

export interface PromptPayOptions {
  /** Phone number (e.g., "0812345678") or Tax ID (e.g., "1234567890123") */
  target: string;
  /** Amount in THB (optional — if omitted, payer enters amount) */
  amount?: number;
}

/**
 * Generate PromptPay QR payload string (EMVCo format)
 */
export function generatePromptPayPayload(options: PromptPayOptions): string {
  const { target, amount } = options;
  const cleaned = target.replace(/[^0-9]/g, '');

  // Determine if phone or tax ID
  let aid: string;
  let formattedTarget: string;

  if (cleaned.length <= 10) {
    // Phone number
    aid = 'A000000677010111'; // PromptPay phone AID
    formattedTarget = formatPhone(cleaned);
  } else {
    // Tax ID (13 digits)
    aid = 'A000000677010112'; // PromptPay tax ID AID
    formattedTarget = formatTaxId(cleaned);
  }

  // Build merchant account info (tag 29)
  const merchantAccountInfo =
    tlv('00', aid) +
    tlv('01', formattedTarget);

  // Build payload
  let payload = '';
  payload += tlv('00', '01');                          // Payload Format Indicator
  payload += tlv('01', amount ? '12' : '11');          // 11 = reusable, 12 = one-time
  payload += tlv('29', merchantAccountInfo);           // Merchant Account Info (PromptPay)
  payload += tlv('53', '764');                         // Transaction Currency (THB = 764)
  payload += tlv('58', 'TH');                          // Country Code

  if (amount && amount > 0) {
    const amountStr = amount.toFixed(2);
    payload += tlv('54', amountStr);                   // Transaction Amount
  }

  // Add CRC placeholder then calculate
  payload += '6304';
  const checksum = crc16(payload);
  payload += checksum;

  return payload;
}

/**
 * Validate PromptPay target (phone or tax ID)
 */
export function isValidPromptPayTarget(target: string): boolean {
  const cleaned = target.replace(/[^0-9]/g, '');
  // Thai phone: 9-10 digits, Tax ID: 13 digits
  return (cleaned.length >= 9 && cleaned.length <= 10) || cleaned.length === 13;
}
