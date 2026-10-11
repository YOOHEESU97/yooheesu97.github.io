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
		slug: 'python',
		label: 'Python',
		description: 'FastAPI, virtualenv, and common Python runtime errors.',
	},
	{
		slug: 'nodejs',
		label: 'Node.js',
		description: 'npm, Express, and Node runtime error fixes.',
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
	{
		slug: 'sql',
		label: 'SQL',
		description: 'MariaDB 쿼리, 인덱스, 데이터 정합성에 관한 실무 노트.',
	},
	{
		slug: 'investing',
		label: '투자 공부',
		description: '직장인을 위한 ISA·연금·ETF 기초부터 미국 시장과 AI 산업을 읽는 기록까지.',
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
