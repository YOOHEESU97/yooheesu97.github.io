// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const base = process.env.BASE_PATH || '/my-coding-notes';

// https://astro.build/config
export default defineConfig({
	site: 'https://yooheusu97.github.io',
	base,
	integrations: [mdx(), sitemap()],
});
