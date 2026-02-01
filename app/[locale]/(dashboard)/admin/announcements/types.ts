export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: {
    roles: string[];
    clinics: string[];
    plans: string[];
  };
  display_location: 'banner' | 'modal' | 'sidebar';
  priority: 'low' | 'normal' | 'high';
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  read_count?: number;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  target_audience: {
    roles: string[];
    clinics: string[];
    plans: string[];
  };
  display_location: 'banner' | 'modal' | 'sidebar';
  priority: 'low' | 'normal' | 'high';
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface AnnouncementContextType {
  announcements: Announcement[];
  clinics: any[];
  loading: boolean;
  saving: boolean;
  fetchAnnouncements: () => Promise<void>;
  fetchClinics: () => Promise<void>;
  createAnnouncement: (data: AnnouncementFormData) => Promise<void>;
  updateAnnouncement: (id: string, data: Partial<AnnouncementFormData>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
}
