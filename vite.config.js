import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	
	plugins: [sveltekit()],
	build: {
		target: "es2021"
	},
};

export default config;
