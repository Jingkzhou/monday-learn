export type UserRole = 'student' | 'teacher' | 'admin';

export interface Term {
  id: string | number;
  term: string;
  definition: string;
  imageUrl?: string | null;
  status?: 'learning' | 'mastered' | 'not_started';
  order?: number;
  starred?: boolean;
}

export interface StudySet {
  id: string | number;
  title: string;
  description?: string | null;
  author?: string;
  authorAvatar?: string;
  authorId?: number;
  authorUsername?: string;
  isOwner?: boolean;
  termCount?: number;
  term_count?: number;
  viewCount?: number;
  view_count?: number;
  mastered_count?: number;
  last_reviewed?: string;
  isPublic?: boolean;
  terms: Term[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NavItem {
  label: string;
  icon: any;
  path: string;
  roles?: UserRole[];
}

export interface Folder {
  id: number;
  title: string;
  description?: string;
  author_id: number;
  author_username: string;
  created_at: string;
  updated_at: string;
  study_sets: {
    id: number;
    title: string;
    term_count: number;
    author_username: string;
  }[];
  set_count: number;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}
