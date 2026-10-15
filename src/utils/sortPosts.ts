import type { CollectionEntry } from 'astro:content';

export function sortPostsNewestFirst(a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) {
	const aPublished = (a.data.publishedAt ?? a.data.pubDate).valueOf();
	const bPublished = (b.data.publishedAt ?? b.data.pubDate).valueOf();
	return bPublished - aPublished;
}
