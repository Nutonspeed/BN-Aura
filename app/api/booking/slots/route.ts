import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch available time slots for a specific date and service
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const serviceId = searchParams.get('service_id');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const staffId = searchParams.get('staff_id');

    if (!clinicId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'clinic_id, service_id, and date are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch booking settings
    const { data: settings } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('clinic_id', clinicId)
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Booking settings not found' }, { status: 404 });
    }

    // Fetch service details
    const { data: service } = await supabase
      .from('bookable_services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get day of week
    const dateObj = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    const daySettings = settings.working_hours[dayOfWeek];

    if (!daySettings?.enabled) {
      return NextResponse.json({ slots: [], message: 'Clinic closed on this day' });
    }

    // Generate time slots
    const slots: { time: string; available: boolean; staffId?: string }[] = [];
    const [openHour, openMin] = daySettings.open.split(':').map(Number);
    const [closeHour, closeMin] = daySettings.close.split(':').map(Number);
    
    const slotDuration = settings.slot_duration_minutes;
    const serviceDuration = service.duration_minutes;
    const buffer = settings.buffer_between_slots;

    let currentTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    // Fetch existing appointments for this date
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('start_time, end_time, staff_id')
      .eq('clinic_id', clinicId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .neq('status', 'cancelled');

    // Fetch staff availability overrides
    const { data: unavailable } = await supabase
      .from('staff_availability')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('type', 'unavailable')
      .lte('start_datetime', endOfDay)
      .gte('end_datetime', startOfDay);

    while (currentTime + serviceDuration <= closeTime) {
      const hour = Math.floor(currentTime / 60);
      const min = currentTime % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      const slotStart = new Date(`${date}T${timeStr}:00`);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      // Check if slot conflicts with existing appointments
      let isAvailable = true;
      
      if (existingAppointments) {
        for (const apt of existingAppointments) {
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          
          // Check for overlap
          if (slotStart < aptEnd && slotEnd > aptStart) {
            if (!staffId || apt.staff_id === staffId) {
              isAvailable = false;
              break;
            }
          }
        }
      }

      // Check staff unavailability
      if (isAvailable && unavailable) {
        for (const block of unavailable) {
          const blockStart = new Date(block.start_datetime);
          const blockEnd = new Date(block.end_datetime);
          
          if (slotStart < blockEnd && slotEnd > blockStart) {
            if (!staffId || block.staff_id === staffId) {
              isAvailable = false;
              break;
            }
          }
        }
      }

      // Check minimum advance booking time
      const now = new Date();
      const minAdvanceMs = settings.min_advance_hours * 60 * 60 * 1000;
      if (slotStart.getTime() - now.getTime() < minAdvanceMs) {
        isAvailable = false;
      }

      slots.push({
        time: timeStr,
        available: isAvailable,
        staffId: staffId || undefined
      });

      currentTime += slotDuration + buffer;
    }

    return NextResponse.json({
      date,
      serviceId,
      serviceDuration,
      slots
    });
  } catch (error) {
    console.error('Slots API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
