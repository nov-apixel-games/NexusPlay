export interface AppItem {
  id: string;
  name: string;
  developer: string;
  developerId?: string;
  rating: number;
  downloads: string;
  category: string;
  icon: string;
  price: string;
  accentColor?: string;
  status?: 'published' | 'pending' | 'rejected';
  isHighlighted?: boolean;
  description?: string;
  size?: string;
  version?: string;
  screenshots?: string[];
  downloadUrl?: string;
  featured?: boolean;
  date?: string;
  iconPublicId?: string;
  screenshotsPublicIds?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface UserItem {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'developer' | 'admin';
  status: 'active' | 'suspended';
  joinedAt: string;
}

export interface DevRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  company: string;
  experience: string;
  appTypes: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
}

export interface AIConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  endpoint: string;
}
