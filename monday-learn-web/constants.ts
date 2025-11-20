import { StudySet, Folder } from './types';

export const MOCK_SET: StudySet = {
  id: '1105444813',
  title: '2025 年第46 周生字总结',
  description: 'Weekly vocabulary summary for grade 1.',
  author: 'Linh_30_12',
  authorAvatar: 'https://picsum.photos/seed/linh/50/50',
  termCount: 27,
  createdAt: '2025-11-15',
  terms: [
    { id: '1', term: '进', definition: 'jìn', status: 'learning' },
    { id: '2', term: '升', definition: 'shēng', status: 'mastered' },
    { id: '3', term: '声', definition: 'shēng', status: 'not_started' },
    { id: '4', term: '向', definition: 'xiàng', status: 'not_started' },
    { id: '5', term: '双', definition: 'shuāng', status: 'not_started' },
    { id: '6', term: '走', definition: 'zǒu', status: 'learning' },
    { id: '7', term: '北', definition: 'běi', status: 'mastered' },
    { id: '8', term: '南', definition: 'nán', status: 'not_started' },
    { id: '9', term: '广', definition: 'guǎng', status: 'not_started' },
    { id: '10', term: '门', definition: 'mén', status: 'learning' },
  ]
};

export const RECENT_SETS: StudySet[] = [
  MOCK_SET,
  {
    id: '2',
    title: 'fast-phonics Peak 2',
    author: 'Teacher_Wang',
    termCount: 23,
    terms: [],
    createdAt: '2025-11-10'
  },
  {
    id: '3',
    title: '一年级（上）必会生字卡集(13)',
    author: 'Student_A',
    termCount: 20,
    terms: [],
    createdAt: '2025-11-01'
  }
];

export const MOCK_FOLDERS: Folder[] = [
  {
    id: '1',
    title: '一年级语文',
    description: '2025第一学期重点复习',
    setIds: ['1105444813', '3'],
    author: 'Linh_30_12',
    createdAt: '2025-11-01'
  },
  {
    id: '2',
    title: '英语启蒙',
    description: 'Phonics and Sight Words',
    setIds: ['2'],
    author: 'Linh_30_12',
    createdAt: '2025-11-05'
  }
];