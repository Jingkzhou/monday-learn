import { StudySet } from '../types';

/**
 * Normalize study set payloads from the API (snake_case) into the shape the UI expects.
 * Keeps original fields on the object so existing usages like `term_count` continue to work.
 */
export const normalizeStudySet = (item: any): StudySet => {
    const termCount = item.termCount ?? item.term_count ?? item.terms?.length ?? 0;
    const viewCount = item.viewCount ?? item.view_count ?? 0;

    return {
        ...item,
        author: item.author ?? item.authorUsername ?? item.author_username,
        authorUsername: item.authorUsername ?? item.author_username ?? item.author,
        authorId: item.authorId ?? item.author_id,
        authorAvatar: item.authorAvatar ?? item.author_avatar,
        termCount,
        term_count: item.term_count ?? termCount,
        viewCount,
        view_count: item.view_count ?? viewCount,
        isPublic: item.isPublic ?? item.is_public ?? true,
        isOwner: item.isOwner ?? item.is_owner ?? false,
        createdAt: item.createdAt ?? item.created_at,
        updatedAt: item.updatedAt ?? item.updated_at,
        last_reviewed: item.last_reviewed ?? item.lastReviewed,
        terms: item.terms ?? [],
    };
};
