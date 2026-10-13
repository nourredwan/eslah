export type UserRole = 'user' | 'volunteer' | 'organization' | 'admin';
export type ReportStatus = 'new' | 'in_progress' | 'completed';
export type ReportPriority = 'urgent' | 'medium' | 'low';
export type ReportCategory = 'roads' | 'electricity' | 'water' | 'health' | 'humanitarian' | 'environment' | 'education' | 'other';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  points: number;
  badges: BadgeType[];
  joinedAt: string;
  reportsCount: number;
  resolvedCount: number;
  rating: number;
  bio: string;
  phone: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  priority: ReportPriority;
  status: ReportStatus;
  location: Location;
  images: string[];
  reportedBy: string;
  reportedByName?: string;
  adoptedBy?: string;
  adoptedByName?: string;
  createdAt: string;
  updatedAt: string;
  comments: CommentType[];
  upvotes: number;
  upvotedBy: string[];
}

export interface CommentType {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface BadgeType {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt?: string;
}

export interface NotificationType {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  roads: 'طرق و بنية تحتية',
  electricity: 'كهرباء',
  water: 'مياه و صرف صحي',
  health: 'صحة',
  humanitarian: 'حالات إنسانية',
  environment: 'بيئة و نظافة',
  education: 'تعليم',
  other: 'أخرى',
};

export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  roads: 'bg-orange-100 text-orange-700',
  electricity: 'bg-yellow-100 text-yellow-700',
  water: 'bg-blue-100 text-blue-700',
  health: 'bg-red-100 text-red-700',
  humanitarian: 'bg-pink-100 text-pink-700',
  environment: 'bg-green-100 text-green-700',
  education: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

export const CATEGORY_ICONS: Record<ReportCategory, string> = {
  roads: '🛣️',
  electricity: '⚡',
  water: '💧',
  health: '🏥',
  humanitarian: '❤️',
  environment: '🌿',
  education: '📚',
  other: '📋',
};

export const PRIORITY_LABELS: Record<ReportPriority, string> = {
  urgent: 'عاجل',
  medium: 'متوسط',
  low: 'منخفض',
};

export const PRIORITY_COLORS: Record<ReportPriority, string> = {
  urgent: 'bg-red-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-green-500 text-white',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  new: 'جديد',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};
