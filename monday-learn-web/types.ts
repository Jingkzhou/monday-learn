export interface Term {
  id: string;
  term: string;
  definition: string;
  imageUrl?: string;
  status: 'learning' | 'mastered' | 'not_started';
  starred?: boolean;
}

export interface StudySet {
  id: string;
  title: string;
  description?: string;
  author: string;
  authorAvatar?: string;
  termCount: number;
  terms: Term[];
  createdAt: string;
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