/** GitHub Pages 서브경로(/my-coding-notes)를 포함한 내부 링크 생성 */
export function withBase(path: string = ''): string {
	const base = import.meta.env.BASE_URL;
	const normalizedBase = base.endsWith('/') ? base : `${base}/`;

	if (!path || path === '/') return normalizedBase;

	const clean = path.startsWith('/') ? path.slice(1) : path;
	return `${normalizedBase}${clean}`;
}
