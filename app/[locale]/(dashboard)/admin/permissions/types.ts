export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

export interface UserRole {
  userId: string;
  userName: string;
  email: string;
  currentRole: string;
  clinicName?: string;
  customPermissions: string[];
}

export type TabType = 'roles' | 'users' | 'permissions';

export interface PermissionsContextType {
  roles: Role[];
  users: UserRole[];
  permissions: Permission[];
  loading: boolean;
  searchTerm: string;
  activeTab: TabType;
  setRoles: (roles: Role[]) => void;
  setUsers: (users: UserRole[]) => void;
  setPermissions: (permissions: Permission[]) => void;
  setSearchTerm: (term: string) => void;
  setActiveTab: (tab: TabType) => void;
}
