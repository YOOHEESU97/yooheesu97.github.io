import type { CollectionEntry } from 'astro:content';

export function getRelatedPosts(
	post: CollectionEntry<'blog'>,
	allPosts: CollectionEntry<'blog'>[],
	limit = 3,
) {
	const tagSet = new Set(post.data.tags ?? []);

	return allPosts
		.filter((candidate) => candidate.id !== post.id)
		.map((candidate) => {
			let score = 0;
			if (post.data.category && candidate.data.category === post.data.category) score += 3;
			for (const tag of candidate.data.tags ?? []) {
				if (tagSet.has(tag)) score += 1;
			}
			return { candidate, score };
		})
		.filter(({ score }) => score > 0)
		.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			return b.candidate.data.pubDate.valueOf() - a.candidate.data.pubDate.valueOf();
		})
		.slice(0, limit)
		.map(({ candidate }) => candidate);
}
