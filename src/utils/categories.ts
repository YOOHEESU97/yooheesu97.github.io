export const CATEGORIES = [
	{
		slug: 'java',
		label: 'Java',
		description: 'Notes on Spring, JVM, and backend development.',
	},
	{
		slug: 'react',
		label: 'React',
		description: 'Component design, hooks, and frontend patterns.',
	},
	{
		slug: 'hermes-agent',
		label: 'Hermes Agent',
		description: 'Setup, integration pitfalls, and error fixes for Hermes Agent.',
	},
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_SLUGS = CATEGORIES.map((category) => category.slug);

export function getCategoryBySlug(slug: string) {
	return CATEGORIES.find((category) => category.slug === slug);
}

export function getCategoryLabel(slug: CategorySlug) {
	return getCategoryBySlug(slug)?.label ?? slug;
}
