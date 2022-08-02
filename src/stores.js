import { writable } from 'svelte/store';

export let apiData = writable([]);
export let cleanedArray = writable([]);
export let workingArray = writable([]);
export let displayArray = writable([]);
export let exportTable = writable([]);
export let fetchedTransactions = writable([]);
export let keyInput = writable("");
export let showfees = writable(false);
export let showfailed = writable(false);
export let currentPage = writable(1)
export let textFilter = writable("")
export let reportingCurrency = writable("USD")
export let showMetadata = writable(true)
