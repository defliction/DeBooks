<script lang='ts'>
    

    import { onMount, afterUpdate } from "svelte";
    import { fetchedTransactions, workingArray, displayArray, keyInput, showfees, currentPage, textFilter, reportingCurrency, showMetadata, smallScreenCondition} from '../stores.js';
    import * as web3 from '@solana/web3.js';
    import dayjs from 'dayjs'
    import localizedFormat from 'dayjs/plugin/localizedFormat'
    import relativeTime from 'dayjs/plugin/relativeTime'
    import { fetchImage } from "../utils/tools.js";
    import {paginate, PaginationNav  } from 'svelte-paginate-ts'
    import Popover from 'svelte-popover';
    import { csvGenerator } from "../utils/csvGenerator";   
    
    //let loadingText = ""
    //let loading = true
    //let currentPercentage = "0%"
    let storedCoinGeckoData: [] = []
    let pageIncrement = 20;
    //these two are reset on each fetchforaddress
    let showConversion = false
    let convertingToReporting = false

    export let startday : dayjs.Dayjs
    export let endday : dayjs.Dayjs
   
    dayjs.extend(localizedFormat)
    dayjs.extend(relativeTime)
    
    onMount(async () => {
        let response = await fetch("https://prices.debooks.xyz/wrapped-solana.json")
        let solanaData2 = await response.json()
        storedCoinGeckoData.push(solanaData2)
        storedCoinGeckoData = storedCoinGeckoData.flat()
    })

    function showFeesHandler() {
        $showfees = !$showfees
        if ($displayArray.length <1 && $showfees) {
            $currentPage = 1
        }
    }
    function downloadHandler() {
        let filename = "debooks_" + $keyInput + "_" + startday.format('YYYY-MM-DD') + "_" + endday.format('YYYY-MM-DD') + ".csv"
        if (showConversion) {
        //console.log("with USD")
            let result = $displayArray.map(o => Object.fromEntries(["success", "signature", "timestamp",  "description", "token_name", "type", "amount", "usd_amount"].map(key => [key.toLowerCase(), o[key.toLowerCase()]])));
            let tableKeys = Object.keys(result[0]); //extract key names from first Object
            csvGenerator(result, tableKeys, ["success", "signature", "timestamp",  "description", "token_name", "type", "amount", "usd_amount"], filename);
        }
        else {
            //console.log("withOUT USD")
            let result = $displayArray.map(o => Object.fromEntries(["success", "signature", "timestamp",  "description", "token_name", "type", "amount"].map(key => [key.toLowerCase(), o[key.toLowerCase()]])));
            let tableKeys = Object.keys(result[0]); //extract key names from first Object
            csvGenerator(result, tableKeys, ["success", "signature", "timestamp",  "description", "token_name", "type", "amount"], filename);
        }

    }
    async function conversionHandler() {

        showConversion = showConversion? false : true
        showConversion? convertingToReporting = true : convertingToReporting = false
        convertingToReporting? await convertWorkingArray () : null
        convertingToReporting = false
        //convertingToReporting = false
        //dayjs(item.timestamp).format("DD-MM-YYYY")
    }
    function getMillisToSleep (retryHeaderString) {
        let millisToSleep = Math.round(parseFloat(retryHeaderString) * 1000)
        if (isNaN(millisToSleep)) {
            millisToSleep = Math.max(0, new Date(retryHeaderString) - new Date())
        }
        return millisToSleep
    }
    async function fetchAndRetryIfNecessary (callAPIFn) {
        const response = await callAPIFn()
        //console.log(response)
        if (response.status == "429") {
            
            const retryAfter = response.headers.get('retry-after')
            const millisToSleep = getMillisToSleep(retryAfter)
            await sleep(10000)
            return fetchAndRetryIfNecessary(callAPIFn)
        }
        return response
    }
    const sleep = (milliseconds:number) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }
    async function convertWorkingArray () {
        let utl_api
        try{
            let response = await fetch("https://token-list-api.solana.cloud/v1/list");
            let data = await response.json()
            utl_api = data.content
        }
        catch (e) {
            //failed to load utl
         
            try {
               
                let fetched = await fetch("https://cdn.jsdelivr.net/gh/solflare-wallet/token-list/solana-tokenlist.json")
                let data = await fetched.json()
                utl_api = data.tokens

            }
            catch (e) {
                await sleep (450)
                console.log("Failed to load UTL", e)
                showConversion = false
                return
            }
            
        }
        
        
        let free = true // to expand when premium sub activated

        for await (const item of $workingArray) {
            let utlToken = utl_api.filter(ut => ut.address == item.mint)[0]
            
            if (utlToken && utlToken.extensions) {
                //https://api.coingecko.com/api/v3/coins/wrapped-solana/history?date=30-01-2022
                let filteredData = storedCoinGeckoData.filter(line => line.id == utlToken.extensions.coingeckoId && line.date == dayjs.unix(item.timestamp).format("DD-MM-YYYY") )

                if (storedCoinGeckoData.length == 0 || filteredData.length == 0) {
                    //console.log("CG request for ", utlToken.extensions.coingeckoId)
                    try {
                        //let req = "https://pro-api.coingecko.com/api/v3/coins/"+utlToken.extensions.coingeckoId+"/history?date="+dayjs.unix(item.timestamp).format("DD-MM-YYYY") + "&x_cg_pro_api_key=CG-F3PXm3JzJRLx48C6cvfMvvrk"
                        let req = "https://api.coingecko.com/api/v3/coins/"+utlToken.extensions.coingeckoId+"/history?date="+dayjs.unix(item.timestamp).format("DD-MM-YYYY")
                        let response = await fetchAndRetryIfNecessary(() => fetch(req)) ;
                   
                        let data = await response.json()                
                        
                        var stored_value = {
                            "id": utlToken.extensions.coingeckoId,
                            "date": dayjs.unix(item.timestamp).format("DD-MM-YYYY"),
                            "usd": data.market_data.current_price.usd
                        }
                        storedCoinGeckoData.push(stored_value)
                        item.usd_amount = (item.amount * data.market_data.current_price.usd)
                    }
                    catch (e) {
                        console.log("Exception ", e)
                        showConversion = false
                        return
                    }
                    
                }
                else {
                    //console.log("same day value is available ", filteredData[0])
                    item.usd_amount = (item.amount * filteredData[0].usd)
                }
                    
               
            }
            else {
                item.usd_amount = 0
            }
            
        }
        //$workingArray = $workingArray
        //$displayArray = $workingArray
        //sliceDisplayArray()


    }

</script>

<div class=" ">
    {#if $fetchedTransactions.length > 0 }
        <div class="grid grid-flow-col place-items-center md:pt-8 pt-4 pb-1 ">
             
                    <div class="col-start-auto">
                        
                        <input type="text" placeholder="Search: e.g. Magic Eden..." bind:value={$textFilter} class="input input-xs lg:min-w-[20rem] md:min-w-[16rem] min-w-[12rem]" />
                    </div>
                    <div class="col-end-auto grid grid-flow-col">
                        <div class="grid grid-flow-col">

                    
                            <div class="md:tooltip " data-tip="Toggle Txn fees on/off" >
                                <button on:click={() => {showFeesHandler()}} class="btn btn-xs btn-ghost normal-case ">
                                    {#if $showfees}
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-transparent fill-primary-focus" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                                        </svg>
                                    {:else}
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-current fill-transparent" viewBox="0 0 24 24"  stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    {/if}
                                    
                                </button>
                                
                            </div>
                   
                            <div class="md:tooltip " data-tip="Convert transactions to USD (daily close)">
                                
                                    {#if !showConversion}
                                    <button on:click={conversionHandler} class="btn btn-xs btn-ghost normal-case">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-current fill-transparent" viewBox="0 0 24 24"  stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                    </button>
                                    {:else}
                                    <button on:click={conversionHandler} class="btn btn-xs btn-ghost normal-case" >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-transparent fill-primary-focus " viewBox="0 0 20 20" >
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                    {/if}
                                
                            </div>
                            <div class="md:tooltip " data-tip="Export to .csv">
                        
                                <button on:click={downloadHandler} class="btn btn-xs btn-ghost normal-case" >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-current fill-transparent" viewBox="0 0 24 24" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                </button>
                            
                            
                            
                            </div>
                        </div>
                    </div>
                    
            
                    
                    
                    
        </div>
        
        {#if $displayArray.length > 0}
            <table class="table table-compact normal-case ">
                
            <!-- head -->
            <thead>
                <tr class=" ">
                
                    <th class="min-w-[1rem] text-left normal-case">Date</th>
                    <th class="lg:min-w-[32rem] max-w-[32rem] min-w-[11rem]  text-left normal-case">Description</th>
                    {#if !$smallScreenCondition}
                        <th class="min-w-[4rem] text-left normal-case">Ref</th>
                    {/if}
                    {#if !showConversion && !$smallScreenCondition}
                        <th class="min-w-[4rem] max-w-[8rem] text-right normal-case">Base Ccy</th>
                    {:else if showConversion && !$smallScreenCondition}
                        <th class="min-w-[4rem] max-w-[8rem] text-right normal-case">Base Ccy</th>
                        <th class="min-w-[4rem] max-w-[6rem] text-right normal-case">${$reportingCurrency}</th>
                    {:else if showConversion && $smallScreenCondition}
                        <th class="min-w-[4rem] max-w-[6rem] text-right normal-case">${$reportingCurrency}</th>
                    {:else}
                        <th class="min-w-[4rem] max-w-[8rem] text-right normal-case">Base Ccy</th>
                    {/if}
                    {#if $smallScreenCondition}
                    <th class="min-w-[2rem]"></th>
                    {/if}
                </tr>
            </thead>          
        
            <tbody>
                <!-- row 1 -->
                {#each $displayArray.slice(pageIncrement*($currentPage - 1), pageIncrement*($currentPage - 1) + pageIncrement) as transaction, i}
                    <!-- show everything -->
                    <tr class="">
                        {#if !$smallScreenCondition}
                            <td class=" min-w-[1rem] text-left">{dayjs.unix(transaction.timestamp).format('YYYY-MM-DD')}</td>
                        {:else}
                            <td class="min-w-[1rem] text-left">{dayjs.unix(transaction.timestamp).format('YY-M-D')}</td>
                        {/if}
                        {#if transaction.uri != "" && $showMetadata}
                        <td class="whitespace-normal lg:min-w-[32rem] max-w-[32rem] min-w-[11rem] text-left">
                            
                            <Popover action="hover" arrow={false} overlayColor=rgba(0,0,0,0) >    
                                <div slot="target" class="flex justify-center align-middle flex-row ">
                                   <span class='pr-2'> {transaction.description}</span>
                                  
                                  
                                </div>
                                
                              
                                <div slot=content>
                                    {#await fetchImage(transaction.uri)}
                                        <span class="font-serif font-medium badge badge-lg ">
                                            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-bg-neutral-content" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    
                                            </svg>
                                            loading image
                                        </span>    
                                    {:then value}
                                        {#if value != null}
                                            <!-- svelte-ignore a11y-missing-attribute -->
                                            <img class='shadow-xl border-8 border-neutral rounded-[3rem] scale-50 -translate-y-[1rem] lg:-translate-y-[4rem]' src={value} /> 
                                        {/if}
                                    {:catch}
                                        <span class="font-serif font-medium badge badge-lg ">
                                            ! failed to load image
                                        </span>    
                                    {/await}
                                </div>                            
                               
                            </Popover>
                        </td>
                        {:else}
                            <td class="whitespace-normal lg:min-w-[32rem] max-w-[32rem] min-w-[11rem] text-left">{transaction.description}</td>
                        {/if}
                       
                        {#if !$smallScreenCondition}
                        <td class="min-w-[4rem] text-left">
                            <a class="hover:underline hover:decoration-primary" href="https://solscan.io/tx/{transaction.signature}" target="_blank">{transaction.signature.substring(0,4)}...</a>
                        </td>
                            
                        {/if}
                        {#if !showConversion && !$smallScreenCondition}
                        <td class="min-w-[2rem] max-w-[8rem] text-right">{transaction.amount?.toLocaleString('en-US', { maximumFractionDigits: 10 })}</td>
                        {:else if showConversion && !$smallScreenCondition}
                        <td class="min-w-[2rem] max-w-[8rem] text-right">{transaction.amount?.toLocaleString('en-US', { maximumFractionDigits: 10 })}</td>
                            {#if convertingToReporting} 
                                <td class="min-w-[4rem] max-w-[6rem] text-right"><progress class="progress w-[2rem]"></progress></td>
                            {:else}
                                <td class="min-w-[4rem] max-w-[6rem]  text-right">{transaction.usd_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                            {/if}
                        {:else if showConversion && $smallScreenCondition}
                            {#if convertingToReporting} 
                                <td class="min-w-[4rem] max-w-[6rem] text-right"><progress class="progress w-[2rem]"></progress></td>
                            {:else}
                                <td class="min-w-[4rem] max-w-[6rem]  text-right">{transaction.usd_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                            {/if}
                        {:else}
                        <td class="min-w-[2rem] max-w-[8rem] text-right">{transaction.amount?.toLocaleString('en-US', { maximumFractionDigits: 10 })}</td>
                        {/if}
                        {#if $smallScreenCondition}
                        <td class="min-w-[2rem] text-right" ><a href="https://solscan.io/tx/{transaction.signature}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg></a></td>
                        {/if}
                    </tr>
                {/each}
            </tbody>
            
            </table>
        {:else}
            <div class="flex justify-center flex-row ">
                <div class="pt-10 min-w-[28rem]">
                    <div class="alert shadow-lg font-serif place-items-center">
                        <div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-error flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>No records for this period.</span>
                        </div>
                    </div>
                
                </div>
        
            </div>
        {/if}
        
    {/if}
   
        {#if $displayArray.length > 0}
            <div class="flex justify-end custom-pagination-nav ">
                
                    <PaginationNav
                        totalItems="{$displayArray.length}"
                        pageSize="{pageIncrement}"
                        currentPage="{$currentPage}"
                        limit="{1}"
                        showStepOptions="{true}"
                        on:setPage="{(e) => $currentPage = e.detail.page}"
                    />
            
            </div>
        {/if}
 
</div>

<style>
    .custom-pagination-nav :global(.pagination-nav) {
      display: flex;
      justify-content: flex-end;
      border-radius: 3px;
      box-shadow: 0 1px 2px hsl(var(--b1));
    }
    .custom-pagination-nav :global(.option) {
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      transition: 0.2s all ease-out;
      user-select: none;
      color: hsl(var(--n));
    }
    
    .custom-pagination-navv :global(.option.number),
    .custom-pagination-nav :global(.option.ellipsis) {
      padding: 5px 7px;
    }
    .custom-pagination-nav :global(.option:hover) {
      background: hsl(var(--b2));
      cursor: pointer;
    }
    .custom-pagination-nav :global(.option.active) {
      color: hsl(var(--pf));
    }
</style>


