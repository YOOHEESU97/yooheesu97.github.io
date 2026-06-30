export const CATEGORIES = [
	{
		slug: 'java',
		label: 'Java',
		description: 'Spring, JVM, 백엔드 개발에서 정리한 노트입니다.',
	},
	{
		slug: 'react',
		label: 'React',
		description: '컴포넌트 설계, 훅, 프론트엔드 패턴을 다룹니다.',
	},
	{
		slug: 'hermes-agent',
		label: 'Hermes Agent',
		description: 'AI 에이전트, Cursor API, 자동화 워크플로를 정리합니다.',
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
