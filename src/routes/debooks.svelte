<script lang='ts'>

    import { onMount } from "svelte";
    import { create } from "json-aggregate"
    import { apiData, cleanedArray, fetchedTransactions, workingArray, displayArray, keyInput, showfailed, showfees, currentPage } from '../stores.js';
    import * as web3 from '@solana/web3.js';
    import dayjs from 'dayjs'
    import localizedFormat from 'dayjs/plugin/localizedFormat'
    import relativeTime from 'dayjs/plugin/relativeTime'
    import Number from "../utils/Number.svelte";
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
    let start = "2022-06-17"
    $: startday = dayjs(start)
    //let end = new Date(2022,6,6)
    let end = "2022-06-18"
    $: endday = dayjs(end)
    let validKey = false
    let pageIncrement = 20;

    let date = new Date()
    let totalPages = 1
    
    
    
    //let deDaoKey = new web3.PublicKey('DeDaoX2A3oUFMddqkvMAU2bBujo3juVDnmowg4Tyuw2r')
  
    //const connection = new web3.Connection("https://ssc-dao.genesysgo.net");
    const connection = new web3.Connection("https://solitary-young-butterfly.solana-mainnet.quiknode.pro/73898ef123ae4439f244d362030abcda8b8aa1e9/");
    const metaplex = new Metaplex(connection);

    onMount(async () => {
       //await fetchAll()
        console.log("fetching sol pay 2")
        //var trans = await connection.getParsedTransaction("4E38pTfTZJWWzNVcM8MVGdNUiDgf3gjygt4xihG3mRtq8HqqUxVKNXgLYTNfY9cwD5W8JyH5UpyHBu9zzfRS5CKv")
        //var trans = await connection.getParsedTransaction("cqAiQymHPbD2r2JP252Lkzw29EKTnksPU1spsSFZMAzdScx5ccsQ6YCFyLrqDzyYwLyZ2xbvLcLWpnorikviuZb")
        var trans = await connection.getParsedTransaction("3ofEvDuyUDGP867qNr9XkLtrmpK3doyvrQ9xjuvCrpQx7MfDxmfSn2hayzwRUtDm3HuUXUEmvCUCzKXWitA9BTZx")
        console.log(trans?.transaction.message.accountKeys[0])
        let key: web3.PublicKey = trans?.transaction.message.accountKeys[0].pubkey.toBase58()
        console.log(key)
        let mintAddress = new web3.PublicKey("Gk8Zh3JbKTV8bXQB7pv8poJvcRaPokv55fJRG1NxHqzF")
        let test2 = await connection.getParsedAccountInfo(mintAddress)
        //console.log(test2.owner.)
        //console.log(Buffer.from((test.value?.data as Uint8Array)))
        
        const nft = await metaplex.nfts().findByMint(mintAddress).run();
        
        console.log(nft)
        
    });
    
    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    async function fetchForAddress (keyIn) {
        
        loading = true
        $currentPage = 1
        let signatures = await connection.getConfirmedSignaturesForAddress2(keyIn, {limit:fetchLimit});
        console.log(signatures.length)
        if (signatures.length == 0)
        {
            validKey = false
            console.log("initial signatures length 0")
        }  
        else
        {
            $apiData =[]
            $workingArray = []
            $displayArray = []
            //set initial lastday and last sig
            let lastsig = signatures[signatures.length - 1].signature
            let lastday = dayjs.unix(signatures[signatures.length - 1].blockTime)
            let z = 0;
            $apiData.push(signatures)
            while (lastday > startday) {
            
                z++
                try {
                    let loopsigs = await connection.getConfirmedSignaturesForAddress2(keyIn, {limit:fetchLimit,before:lastsig});
                    if (loopsigs.length == 0) {
                        await sleep(500) //wait 0.5 seconds
                        continue
                    }
                    //updated lastday and last sig
                    lastday = await dayjs.unix(loopsigs[loopsigs.length - 1].blockTime)
                    lastsig = await loopsigs[loopsigs.length - 1].signature
                    $apiData.push(loopsigs)
                    
                
                    if (z==10) {
                        console.log("debug mode break after 10 sig loops - remove for release")
                        break
                    }
                }
                catch (e) {
                    console.log("Error in loopsigs", e)
                    await sleep(500) //wait 0.5 seconds
                }
                    
            
            }
            $apiData = $apiData.flat()
            //fetch all transactions
            console.log("fetched account transactions: ", $apiData.length)
            //console.log($apiData)
            var results = $apiData.filter(transaction => dayjs.unix(transaction.blockTime) < endday && dayjs.unix(transaction.blockTime) > startday);

            console.log("date filtered results ", results.length)
            var reformattedArray = results.map((result) => result.signature);
            
            
            

            $fetchedTransactions = await connection.getParsedTransactions(reformattedArray)
            console.log("fetched ", $fetchedTransactions)
            for await (const item of $fetchedTransactions) {
                let programIDs: string = []
                item.transaction.message.instructions.forEach(function (program) {
                    programIDs.push(program.programId.toBase58())
                })
                console.log("programIDs ", programIDs)

                //new fee item
                let feePayer = item.transaction.message.accountKeys[0].pubkey.toBase58()
                if (feePayer == keyIn) {
                    var fee_expense = 
                    {
                        "signature": item.transaction.signatures[0],
                        "timestamp": item.blockTime, 
                        "slot": item.slot,
                        "success": true,
                        "fee": item.meta? item.meta.fee : null,
                        "amount": item.meta? -item.meta.fee : null,
                        "account_keys": item.transaction.message.accountKeys,
                        "pre_balances": item.meta? item.meta.preBalances : null,
                        "post_balances": item.meta? item.meta.postBalances : null,
                        "pre_token_balances": item.meta? item.meta.preTokenBalances : null,
                        "post_token_balances": item.meta? item.meta.postTokenBalances : null,
                        "description": "Transaction fees"
                    }
                    $workingArray.push(fee_expense)
                    //console.log("fee paid by user", fee_expense)
                }
                //interpret each line and add transactions to the array;
                if (programIDs.includes("M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K")) {
                    //get NFTs
                    let nftIDs: web3.PublicKey[] = []
                    item.meta? item.meta.postTokenBalances?.forEach(function (token) {
                        if (token.owner == keyIn) {
                            nftIDs.push(new web3.PublicKey(token.mint))
                        }
                    }) : null
                    console.log(nftIDs)
                    
                    let nftnames = await metaplex.nfts().findAllByMintList(nftIDs).run();
                    console.log("nft nameas ", nftnames.flatMap(s => s.name))
                    var new_line = 
                    {
                        "signature": item.transaction.signatures[0],
                        "timestamp": item.blockTime, 
                        "slot": item.slot,
                        "success": item.meta?.err == null? true : false,
                        "fee": item.meta? item.meta.fee : null,
                        "amount": item.meta? item.meta.postBalances[0] - item.meta.preBalances[0] + item.meta.fee : null,
                        "account_keys": item.transaction.message.accountKeys,
                        "pre_balances": item.meta? item.meta.preBalances : null,
                        "post_balances": item.meta? item.meta.postBalances : null,
                        "pre_token_balances": item.meta? item.meta.preTokenBalances : null,
                        "post_token_balances": item.meta? item.meta.postTokenBalances : null,
                        "description": "Magic Eden: " +  nftnames.flatMap(s => s.name)
                    }
                    $workingArray.push(new_line)
                    console.log(new_line)
                }  
                else {
                    //generic line
                    var new_line = 
                        {
                            "signature": item.transaction.signatures[0],
                            "timestamp": item.blockTime, 
                            "slot": item.slot,
                            "success": item.meta?.err == null? true : false,
                            "fee": item.meta? item.meta.fee : null,
                            "amount": item.meta? item.meta.postBalances[0] - item.meta.preBalances[0] + item.meta.fee : null,
                            "account_keys": item.transaction.message.accountKeys,
                            "pre_balances": item.meta? item.meta.preBalances : null,
                            "post_balances": item.meta? item.meta.postBalances : null,
                            "pre_token_balances": item.meta? item.meta.preTokenBalances : null,
                            "post_token_balances": item.meta? item.meta.postTokenBalances : null,
                            "description": "Generic Transaction"
                        }
                        $workingArray.push(new_line)
                        console.log(new_line)
                }
            
            }


            
            //console.log("printing cleaned array")
            //console.log($cleanedArray)
            //console.log("printing working array")
            //.log($workingArray)
            totalPages = Math.ceil($workingArray.length/pageIncrement), console.log("total pages ", Math.ceil($workingArray.length/pageIncrement))
            $workingArray = $workingArray
            $displayArray = $workingArray
            sliceDisplayArray()
            
            
        }
    
        loading = false 
            
        
    }
    function sliceDisplayArray () {
        if ($showfees && $showfailed) {
            $displayArray = $workingArray
            console.log("showfees && showfailed")
        }
        else if ($showfees && !$showfailed) {
            $displayArray = $workingArray.filter(transaction => transaction.success == true);
            console.log("showfees && !showfailed")
        }
        else if (!$showfees && $showfailed) {
            $displayArray = $workingArray.filter(transaction => transaction.description != "Transaction fees");
            console.log("!showfees && showfailed")
        }
        else if (!$showfees && !$showfailed) {
            $displayArray = $workingArray.filter(transaction => transaction.success == true && transaction.description != "Transaction fees");
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
$: $keyInput != "" ? checkKey() ? new web3.PublicKey($keyInput) : loading = false : (validKey = false, loading = false)
$: $showfailed, sliceDisplayArray()
$: $showfees, sliceDisplayArray()
$: $displayArray


//$: start, end && $keyInput != "" ? checkKey() ? new web3.PublicKey($keyInput) : loading = false : (validKey = false, loading = false)
//<DateInput on:close={fetchAll} bind:value={start} closeOnSelection={true} format="yyyy-MM-dd" placeholder="2022-01-01" />   
// /<DateInput on:close={fetchAll} bind:value={end} closeOnSelection={true} format="yyyy-MM-dd" placeholder="2022-01-01" />
</script>

<div class="flex justify-center">
    <div class="pt-4 text-center ">
        <h1 class="pb-4 font-bely text-5xl font-bold text-center">DeBooks</h1>
        {#if loading == false}
            <input type="text" placeholder="enter account address e.g. DeDao..uw2r" bind:value={$keyInput} class="text-center input input-sm input-bordered input-primary w-96  " />
        {:else}
            <input type="text" placeholder="enter account address e.g. DeDao..uw2r" bind:value={$keyInput} disabled class="text-center input input-sm input-bordered input-primary w-96  " />
        {/if}
        <p class="pt-2 text-lg font-serif font-bold text-center">Transaction Statement</p>
        
        <div class="flex flex-row text-sm font-serif ">
            <span class="flex items-center pr-2">
                For the period
            </span>
            {#if loading == false}
                <input type="date" on:input={checkKey} bind:value={start} max={end} class="text-center"/>
            {:else}
                <input type="date" disabled bind:value={start} max={end} class="text-center"/>
            {/if}
            
            
            <span class="flex items-center px-2 ">
                to
            </span>
            {#if loading == false}
                <input type="date" on:input={checkKey} bind:value={end} min={start} max={new Date().toJSON().slice(0,10)} class="text-center"/>
            {:else}
                <input type="date" disabled={true} bind:value={end} min={start} max={new Date().toJSON().slice(0,10)} class="text-center"/>
            {/if}
            
        </div>
        

       
        
    </div>
   
</div>

{#if validKey == true }

<div class="flex justify-center p-4 font-serif ">
    
    <div class="overflow-x-auto">
        {#if loading}
        <div class="flex flex-row justify-center ">
            <p class="py-2 justify-center">
                <span class="font-serif font-medium badge badge-lg ">
                    <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-bg-neutral-content" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>loading...</span> 
            </p>
        </div>
        {/if}

        <div class="flex flex-row justify-end form-control">
            <label class="label ">
                <span class="label-text font-semibold pr-2 ">Show:</span> 
                
            </label>
            <div>
                <label class="label cursor-pointer text-right ">
                <span class="label-text pr-2 ">Transaction Fees</span> 
                <input type="checkbox" class="checkbox  checkbox-sm" bind:checked={$showfees} />
                </label>
            </div>
            <div>
                <label class="label cursor-pointer text-right">
                <span class="label-text pr-2 ">Failed transactions</span> 
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
                <th class="min-w-[4rem]">Counterparty</th>
                <th class="min-w-[2rem] text-right">Amount (SOL)</th>
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
                    <td class="min-w-[4rem]">{new web3.PublicKey(transaction.account_keys[0].pubkey).toString()}</td>
                    <td class="min-w-[2rem] text-right">{transaction.amount/web3.LAMPORTS_PER_SOL}</td>
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
{:else}

<div class="flex justify-center flex-row">
    <div class="pt-10">
        <div class="alert shadow-lg">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Enter a valid wallet address to display records.</span>
            </div>
          </div>
    
</div>
</div>

{/if}
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