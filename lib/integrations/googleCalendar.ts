/**
 * BN-Aura Google Calendar Integration
 */

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
  reminders?: { useDefault: boolean; overrides?: { method: string; minutes: number }[] };
}

export interface BookingDetails {
  customerName: string;
  customerEmail: string;
  treatmentName: string;
  clinicName: string;
  clinicAddress: string;
  startTime: Date;
  durationMinutes: number;
  notes?: string;
}

// Create calendar event from booking
export function createCalendarEvent(booking: BookingDetails): CalendarEvent {
  const endTime = new Date(booking.startTime.getTime() + booking.durationMinutes * 60000);
  
  return {
    summary: `${booking.treatmentName} - ${booking.clinicName}`,
    description: `
การนัดหมาย: ${booking.treatmentName}
ลูกค้า: ${booking.customerName}
คลินิก: ${booking.clinicName}
${booking.notes ? `หมายเหตุ: ${booking.notes}` : ''}

จัดการโดย BN-Aura
    `.trim(),
    location: booking.clinicAddress,
    start: {
      dateTime: booking.startTime.toISOString(),
      timeZone: 'Asia/Bangkok',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Asia/Bangkok',
    },
    attendees: [{ email: booking.customerEmail }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 60 },   // 1 hour before
      ],
    },
  };
}

// Add event to Google Calendar
export async function addToGoogleCalendar(
  accessToken: string,
  event: CalendarEvent,
  calendarId: string = 'primary'
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    const data = await response.json();
    return { success: true, eventId: data.id };
  } catch (error) {
    console.error('[Calendar] Error:', error);
    return { success: false, error: 'Failed to create event' };
  }
}

// Generate Google Calendar URL for manual add
export function generateCalendarUrl(booking: BookingDetails): string {
  const endTime = new Date(booking.startTime.getTime() + booking.durationMinutes * 60000);
  
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${booking.treatmentName} - ${booking.clinicName}`,
    dates: `${formatDate(booking.startTime)}/${formatDate(endTime)}`,
    details: `การนัดหมาย: ${booking.treatmentName}\nคลินิก: ${booking.clinicName}`,
    location: booking.clinicAddress,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate ICS file content
export function generateICS(booking: BookingDetails): string {
  const endTime = new Date(booking.startTime.getTime() + booking.durationMinutes * 60000);
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BN-Aura//Booking//TH
BEGIN:VEVENT
UID:${Date.now()}@bn-aura.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(booking.startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:${booking.treatmentName} - ${booking.clinicName}
DESCRIPTION:การนัดหมาย: ${booking.treatmentName}\\nคลินิก: ${booking.clinicName}
LOCATION:${booking.clinicAddress}
END:VEVENT
END:VCALENDAR`;
}

export default {
  createCalendarEvent,
  addToGoogleCalendar,
  generateCalendarUrl,
  generateICS,
};
