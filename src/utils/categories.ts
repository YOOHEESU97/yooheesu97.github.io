export const CATEGORIES = [
	{
		slug: 'java',
		label: 'Java',
		description: 'Notes on JVM, collections, and core Java patterns.',
	},
	{
		slug: 'spring',
		label: 'Spring',
		description: 'Spring Boot errors, configuration, and REST API troubleshooting.',
	},
	{
		slug: 'react',
		label: 'React',
		description: 'Component design, hooks, and frontend error fixes.',
	},
	{
		slug: 'typescript',
		label: 'TypeScript',
		description: 'Type errors, strict mode, and React + TS patterns.',
	},
	{
		slug: 'hermes-agent',
		label: 'Hermes Agent',
		description: 'Setup, integration pitfalls, and error fixes for Hermes Agent.',
	},
	{
		slug: 'devops',
		label: 'DevOps',
		description: 'Astro, GitHub Pages, CI/CD, and deployment notes.',
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
