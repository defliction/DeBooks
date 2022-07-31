<script lang='ts'>

    import { onMount } from "svelte";
    import { create } from "json-aggregate"
    import { apiData, cleanedArray, fetchedTransactions, workingArray, displayArray, keyInput, showfailed, showfees, currentPage, textFilter, reportingCurrency } from '../stores.js';
    import * as web3 from '@solana/web3.js';
    import dayjs from 'dayjs'
    import localizedFormat from 'dayjs/plugin/localizedFormat'
    import relativeTime from 'dayjs/plugin/relativeTime'
    import Number from "../utils/Number.svelte";
    import Classifier from "../utils/Classifier.svelte";
    let classif;
    import { DateInput } from 'date-picker-svelte'
    import {paginate, PaginationNav  } from 'svelte-paginate-ts'
    import { Buffer } from 'buffer';
    //import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";    
    import { Metaplex } from "@metaplex-foundation/js";
   
    let myDate = '2021-11-11';

    dayjs.extend(localizedFormat)
    dayjs.extend(relativeTime)
  

    const settings = { columnFilter: true }
    let rows

    let allData = []
    let loopNumber = 0;
   
    let fetchLimit = 250
    let loading = false;

    //let start = new Date(2022,6,1)
    let start = "2022-07-17"
    $: startday = dayjs(start)
    //let end = new Date(2022,6,6)
    let end = "2022-07-30"
    $: endday = dayjs(end)
    let validKey = false
    let pageIncrement = 20;

    let date = new Date()
    let totalPages = 1
    let currentTransaction = 0;
    let currentPercentage = "";
    let reportingSelection = ['SOL', 'USDC']
    let signature = ""
    
    //let deDaoKey = new web3.PublicKey('DeDaoX2A3oUFMddqkvMAU2bBujo3juVDnmowg4Tyuw2r')
  
    //const connection = new web3.Connection("https://ssc-dao.genesysgo.net");
    const connection = new web3.Connection("https://solitary-young-butterfly.solana-mainnet.quiknode.pro/73898ef123ae4439f244d362030abcda8b8aa1e9/");
    const metaplex = new Metaplex(connection);

    onMount(async () => {
       //await fetchAll()
        console.log("START - starting logs")
        //var trans = await connection.getParsedTransaction("4E38pTfTZJWWzNVcM8MVGdNUiDgf3gjygt4xihG3mRtq8HqqUxVKNXgLYTNfY9cwD5W8JyH5UpyHBu9zzfRS5CKv")
        //var trans = await connection.getParsedTransaction("cqAiQymHPbD2r2JP252Lkzw29EKTnksPU1spsSFZMAzdScx5ccsQ6YCFyLrqDzyYwLyZ2xbvLcLWpnorikviuZb")
        //var trans = await connection.getParsedTransaction("3ofEvDuyUDGP867qNr9XkLtrmpK3doyvrQ9xjuvCrpQx7MfDxmfSn2hayzwRUtDm3HuUXUEmvCUCzKXWitA9BTZx")
        var trans = await connection.getParsedTransaction("4pdRR7gRnr72vcMGf4LvQPNrifZxZxv8ZNp9kC89yrbz1VVn48WynTja8DJfsCsqS2BV6cSU1cYFeynbQBQpyirM")
        console.log(trans)
   

        console.log("END - starting logs")
    });

    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    async function fetchForAddress () {
        $apiData =[]
        $workingArray = []
        $displayArray = []
        $fetchedTransactions = []
        currentTransaction = 0
        currentPercentage = ""
        loading = true
        $currentPage = 1
        
            
            
        if (signature != "")
        {
            $fetchedTransactions = await connection.getParsedTransaction(signature)
           
           //console.log("fetched ", $fetchedTransactions.flatMap(s => s.transaction.signatures))
           console.log("fetched ", $fetchedTransactions)
           let item = $fetchedTransactions
               let keyIn = new web3.PublicKey($keyInput)
               
               currentTransaction++
               let account_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
               let programIDs: string = []
               item.transaction.message.instructions.forEach(function (program) {
                   
                   programIDs.push(program.programId.toBase58())
               })
               

               //new fee item
               let feePayer = item.transaction.message.accountKeys[0].pubkey.toBase58()
               if (feePayer == keyIn) {
                   let failed_text = item.meta.err != null? ": Failed txn" : ""
                   
                   var fee_expense = 
                   {
                       "signature": item.transaction.signatures[0],
                       "timestamp": item.blockTime, 
                       "slot": item.slot,
                       "success": true,
                       "fee": item.meta? item.meta.fee/web3.LAMPORTS_PER_SOL : null,
                       "amount": item.meta? -item.meta.fee/web3.LAMPORTS_PER_SOL : null,
                       "account_keys": item.transaction.message.accountKeys,
                       "pre_balances": item.meta? item.meta.preBalances : null,
                       "post_balances": item.meta? item.meta.postBalances : null,
                       "pre_token_balances": item.meta? item.meta.preTokenBalances : null,
                       "post_token_balances": item.meta? item.meta.postTokenBalances : null,
                       "description": "Txn fees " + failed_text
                   }
                   $workingArray.push(fee_expense)
                   //console.log("fee paid by user", fee_expense)
               }
               if (item.meta.err == null) {
                   console.log("programIDs ", programIDs, item)
                   //only classify successful transactions!
                   //MAGIC EDEN TRANSACTIONS >>
                   classif.classifyTransaction (item, programIDs, metaplex, account_index, keyIn, feePayer)

               }
           


           
           //console.log("printing cleaned array")
           //console.log($cleanedArray)
           //console.log("printing working array")
           //.log($workingArray)
           totalPages = Math.ceil($workingArray.length/pageIncrement), console.log("total pages ", Math.ceil($workingArray.length/pageIncrement))
           $workingArray = $workingArray
           $displayArray = $workingArray
           
           
           
       
   
        loading = false
        
        }
        sliceDisplayArray() 
            
        
    }
    function sliceDisplayArray () {
        if ($showfees && $showfailed) {
            
            $displayArray = $workingArray.filter(transaction => transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.signature.toLowerCase().includes($textFilter.toLowerCase()))
            
            
            console.log("showfees && showfailed")
        }
        else if ($showfees && !$showfailed) {
            //default
            $displayArray = $workingArray.filter(transaction => transaction.success == true && transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.success == true && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            console.log("showfees && !showfailed")
        }
        else if (!$showfees && $showfailed) {
            $displayArray = $workingArray.filter(transaction => transaction.description.substring(0,3) != "Txn" && transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.description.substring(0,3) != "Txn" && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            console.log("!showfees && showfailed")
        }
        else if (!$showfees && !$showfailed) {
            $displayArray = $workingArray.filter(transaction => transaction.success == true && transaction.description.substring(0,3) != "Txn" && transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.success == true && transaction.description.substring(0,3) != "Txn" && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            console.log("!showfees && !showfailed")
        }
        $displayArray = $displayArray
        console.log("display array length: ", $displayArray.length)
    }

    function checkKey () {
        try {
            if (web3.PublicKey.isOnCurve($keyInput) == true)
                //deDaoKey instanceof web3.PublicKey ? fetchAll() : console.log("test")
                validKey = true
                fetchForAddress(new web3.PublicKey($keyInput))
                sliceDisplayArray()
                return true

        } catch(e) {
            console.log("failed key")
            validKey = false
            return false
        }
        return false
    }

$: $showfailed, sliceDisplayArray()
$: $showfees, sliceDisplayArray()
$: $displayArray
$: $textFilter, sliceDisplayArray()
$: currentTransaction != 0? currentPercentage = "" + Math.round(currentTransaction/$fetchedTransactions.length*100) + "%" : ""
$: signature, fetchForAddress()

//$: start, end && $keyInput != "" ? checkKey() ? new web3.PublicKey($keyInput) : loading = false : (validKey = false, loading = false)
//<DateInput on:close={fetchAll} bind:value={start} closeOnSelection={true} format="yyyy-MM-dd" placeholder="2022-01-01" />   
// /<DateInput on:close={fetchAll} bind:value={end} closeOnSelection={true} format="yyyy-MM-dd" placeholder="2022-01-01" />
</script>
<Classifier bind:this={classif} />
<div class="flex justify-center">
    <div class="pt-4 text-center ">
 
            
        <h1 class="pb-4 font-ros1 text-5xl font-bold text-center">Single Txn</h1>
        
        
   
            <input type="text" placeholder="enter account address e.g. DeDao..uw2r" bind:value={$keyInput} class="text-center font-serif input input-sm input-bordered input-primary w-96  " />

        <input type="text" placeholder="enter txid" bind:value={signature} class="text-center font-serif input input-sm input-bordered input-secondary w-96  " />
        <p class="pt-2 text-lg font-serif font-bold text-center">Transaction Statement</p>
        
       
        

       
        
    </div>
   
</div>



<div class="flex justify-center p-4 font-serif ">
    
    <div class="overflow-x-auto">
        {#if loading}
        <div class="flex flex-row justify-center ">
            <p class="py-2 justify-center">
                <span class="font-serif font-medium badge badge-lg ">
                    <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-bg-neutral-content" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>loading... {currentPercentage}</span> 
            </p>
        </div>
        {/if}
        
        <div class="flex flex-row justify-end form-control">
                <div class = "align-left py-2 pr-2 ">
                    
                    <input type="text" placeholder="Filter: e.g. Magic Eden..." bind:value={$textFilter} class="input input-xs min-w-[2rem] max-w-[20rem]  align-bottom" />
                </div>
                <div class = "align-bottom pt-1.5 pr-2 ">
                    <select bind:value={$reportingCurrency} class="select select-xs select-ghost min-w-[2rem] max-w-[6rem]  pt-0.5">
                        <option disabled>Reporting Currency</option>
                        {#each reportingSelection as currency, i}
                            <option >{currency}</option>
                        {/each}
                        
                      </select>
                </div>
                <div>
                    <label class="label">
                        <span class="label-text font-semibold pr-2 ">Show:</span> 
                        
                    </label>
                </div>
                
                <div>
                    <label class="label cursor-pointer text-right ">
                    <span class="label-text pr-2 ">Txn Fees</span> 
                    <input type="checkbox" class="checkbox  checkbox-sm" bind:checked={$showfees} />
                    </label>
                </div>
                <div>
                    <label class="label cursor-pointer text-right">
                    <span class="label-text pr-2 ">Failed txns</span> 
                    <input type="checkbox" class="checkbox  checkbox-sm" bind:checked={$showfailed} />
                    </label>
                </div>
            
            
        </div>
                
        <table class="table table-compact ">
            
          <!-- head -->
          <thead>
            <tr class="">
                <th class="min-w-[2rem]"></th>
                <th class="min-w-[2rem]">Date</th>
                <th class="min-w-[20rem]">Description</th>
                <th class="min-w-[4rem]">Sig</th>
                <th class="min-w-[2rem] text-right">Amount (Base)</th>
                <th class="min-w-[2rem] text-right">Amount ({$reportingCurrency})</th>
                <th class="min-w-[2rem]"></th>
            </tr>
          </thead>          
      
          <tbody>
            <!-- row 1 -->
            {#each $displayArray.slice(pageIncrement*($currentPage - 1), pageIncrement*($currentPage - 1) + pageIncrement) as transaction, i}
                <!-- show everything -->
                <tr class="">
                    {#if transaction.success}
                        <td class="min-w-[2rem]"/> 
                    {:else}
                        <td class="min-w-[2rem]">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                        </td>
                    {/if}
                    <td class="min-w-[2rem]">{dayjs.unix(transaction.timestamp).format('YYYY-MM-DD')}</td>
                    <td class="min-w-[20rem]">{transaction.description}</td>
                    <td class="min-w-[4rem]">{transaction.signature.substring(0,4)}...</td>
                    <td class="min-w-[2rem] text-right">{transaction.amount}</td>
                    <td class="min-w-[2rem] text-right">{transaction.amount}</td>
                    <td class="min-w-[2rem] text-right"><a href="https://solscan.io/tx/{transaction.signature}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg></a></td>
                </tr>
            {/each}
          </tbody>
        
        </table>
        {#if !loading && $displayArray.length > 0}
        <div class="custom-pagination-nav">
            <div>
                <PaginationNav
                    totalItems="{$displayArray.length}"
                    pageSize="{pageIncrement}"
                    currentPage="{$currentPage}"
                    limit="{1}"
                    showStepOptions="{true}"
                    on:setPage="{(e) => $currentPage = e.detail.page}"
                />
            </div>
        </div>
        {/if}
    </div>
    
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
  color: hsl(var(--p));
}
</style>