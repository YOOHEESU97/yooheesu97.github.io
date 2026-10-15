import type { CollectionEntry } from 'astro:content';

/** Prefer publishedAt when present; otherwise fall back to pubDate. */
export function getPostSortDate(post: CollectionEntry<'blog'>): number {
	return (post.data.publishedAt ?? post.data.pubDate).valueOf();
}

export function comparePostsByDateDesc(
	a: CollectionEntry<'blog'>,
	b: CollectionEntry<'blog'>,
): number {
	return getPostSortDate(b) - getPostSortDate(a);
}
