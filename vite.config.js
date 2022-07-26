import { sveltekit } from '@sveltejs/kit/vite';
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import nodePolyfills from "rollup-plugin-node-polyfills";

/** @type {import('vite').UserConfig} */
const config = {
	
	plugins: [sveltekit()],
	resolve: {
		alias: {
		  stream: "rollup-plugin-node-polyfills/polyfills/stream",
		  events: "rollup-plugin-node-polyfills/polyfills/events",
		  assert: "assert",
		  crypto: "crypto-browserify",
		  util: "util",
		},
	  },
	  define: {
		"process.env": process.env ?? {},
	  },
	  build: {
		target: "esnext",
		rollupOptions: {
		  plugins: [nodePolyfills({ crypto: true })],
		},
	  },
	  optimizeDeps: {
		esbuildOptions: {
		  plugins: [NodeGlobalsPolyfillPlugin({ buffer: true })],
		},
	  },
};

export default config;
