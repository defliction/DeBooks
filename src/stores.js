import { writable, readable } from 'svelte/store';

export let apiData = writable([]);
export let cleanedArray = writable([]);
export let workingArray = writable([]);
export let displayArray = writable([]);
export let fetchedTransactions = writable([]);
export let keyInput = writable("");
export let loadedAddress = writable("");
export let showfees = writable(true);
export let showfailed = writable(false);
export let currentPage = writable(1)
export let textFilter = writable("")
export let reportingCurrency = writable("USD")
export let showMetadata = writable(true)
export let cnx = writable ()
export let smallScreenCondition = writable(false)
export let keyList = writable([]);

export const time = readable(new Date(), set => {
    const interval = setInterval(() => {
      set(new Date());
    }, 1000)
  
    return () => clearInterval(interval);
  });