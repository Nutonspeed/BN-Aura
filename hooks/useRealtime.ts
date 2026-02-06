'use client';

import { useEffect, useState, useCallback } from 'react';
import { realtimeService, RealtimeEvent, RealtimePayload } from '@/lib/realtime/realtimeService';

// Hook to subscribe to clinic events
export function useClinicRealtime(clinicId: string | null) {
  useEffect(() => {
    if (!clinicId) return;
    realtimeService.subscribeToClinic(clinicId);
    return () => realtimeService.unsubscribe(clinicId);
  }, [clinicId]);
}

// Hook to listen for specific events
export function useRealtimeEvent<T = unknown>(
  event: RealtimeEvent,
  callback: (data: T) => void
) {
  useEffect(() => {
    const handler = (payload: RealtimePayload) => {
      callback(payload.data as T);
    };
    return realtimeService.on(event, handler);
  }, [event, callback]);
}

// Hook for live analysis updates
export function useLiveAnalysis(clinicId: string | null) {
  const [latestAnalysis, setLatestAnalysis] = useState<unknown>(null);
  const [analysisCount, setAnalysisCount] = useState(0);

  useRealtimeEvent('analysis_completed', useCallback((data: unknown) => {
    setLatestAnalysis(data);
    setAnalysisCount(c => c + 1);
  }, []));

  return { latestAnalysis, analysisCount };
}

// Hook for live bookings
export function useLiveBookings(clinicId: string | null) {
  const [latestBooking, setLatestBooking] = useState<unknown>(null);
  const [bookingCount, setBookingCount] = useState(0);

  useRealtimeEvent('booking_created', useCallback((data: unknown) => {
    setLatestBooking(data);
    setBookingCount(c => c + 1);
  }, []));

  return { latestBooking, bookingCount };
}

// Hook for quota updates
export function useQuotaUpdates(clinicId: string | null) {
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);

  useRealtimeEvent('quota_updated', useCallback((data: { used: number; limit: number }) => {
    setQuota(data);
  }, []));

  return quota;
}

// Hook for notifications
export function useLiveNotifications() {
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useRealtimeEvent('notification_received', useCallback((data: unknown) => {
    setNotifications(prev => [data, ...prev].slice(0, 20));
    setUnreadCount(c => c + 1);
  }, []));

  const markRead = useCallback(() => setUnreadCount(0), []);

  return { notifications, unreadCount, markRead };
}

export default {
  useClinicRealtime,
  useRealtimeEvent,
  useLiveAnalysis,
  useLiveBookings,
  useQuotaUpdates,
  useLiveNotifications,
};
