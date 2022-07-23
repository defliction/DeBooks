import { writable } from 'svelte/store';

export let apiData = writable([]);
export let cleanedArray = writable([]);
export let workingArray = writable([]);
export let keyInput = writable("");
