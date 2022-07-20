import { writable } from 'svelte/store';

export let apiData = writable([]);
export let currentFetch = writable(0);
export let workingArray = writable([]);
