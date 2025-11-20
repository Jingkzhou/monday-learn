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
  termCount?: number;
  term_count?: number;
  terms: Term[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NavItem {
  label: string;
  icon: any;
  path: string;
}

export interface Folder {
  id: string;
  title: string;
  description?: string;
  setIds: string[]; // List of Set IDs contained in this folder
  author: string;
  createdAt: string;
}
