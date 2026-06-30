// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { rehypeWrapTables } from './src/plugins/rehype-wrap-tables.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://yooheesu97.github.io',
	base: '/',
	integrations: [mdx(), sitemap()],
	markdown: {
		rehypePlugins: [rehypeWrapTables],
		shikiConfig: {
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			},
			wrap: true,
		},
	},
});
