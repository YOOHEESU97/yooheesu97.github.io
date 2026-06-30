import type { CollectionEntry } from 'astro:content';
import { CATEGORIES } from './categories';

export function getCategoriesWithPosts(posts: CollectionEntry<'blog'>[]) {
	return CATEGORIES.map((category) => ({
		...category,
		count: posts.filter((post) => post.data.category === category.slug).length,
	})).filter((category) => category.count > 0);
}
