<script lang='ts'>
    import { onMount } from "svelte";
    import { create } from "json-aggregate"
    import { apiData, cleanedArray,fetchedArray, workingArray, keyInput } from '../stores.js';
    import * as web3 from '@solana/web3.js';
    import dayjs from 'dayjs'
    import localizedFormat from 'dayjs/plugin/localizedFormat'
    import relativeTime from 'dayjs/plugin/relativeTime'
    import Number from "../utils/Number.svelte";
    import { DateInput } from 'date-picker-svelte'


   
    let myDate = '2021-11-11';

    dayjs.extend(localizedFormat)
    dayjs.extend(relativeTime)
    import { Datatable } from 'svelte-simple-datatables'

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

    let date = new Date()
    
    
    //let deDaoKey = new web3.PublicKey('DeDaoX2A3oUFMddqkvMAU2bBujo3juVDnmowg4Tyuw2r')
  
    //const connection = new web3.Connection("https://ssc-dao.genesysgo.net");
    const connection = new web3.Connection("https://solitary-young-butterfly.solana-mainnet.quiknode.pro/73898ef123ae4439f244d362030abcda8b8aa1e9/");
    
    onMount(async () => {
       //await fetchAll()
        console.log("fetching sol pay 2")
        console.log(await connection.getParsedTransaction("4E38pTfTZJWWzNVcM8MVGdNUiDgf3gjygt4xihG3mRtq8HqqUxVKNXgLYTNfY9cwD5W8JyH5UpyHBu9zzfRS5CKv"))
    });

    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    async function fetchAll (keyIn) {
        
        //console.log("getTokenAccounts ", await connection.getAccountInfo(new web3.PublicKey("HDeC9hGSZzhY6VCdNaJ4nEk1GqH3RkHPLGHFd98eMcd2")))

        loading = true
        let account = await connection.getConfirmedSignaturesForAddress2(keyIn, {limit:fetchLimit});
        console.log(account.length)
        if (account.length == 0)
        {
            validKey = false
            console.log("account length  0")
        }  
        else
        {
           
            $apiData =[]
            $workingArray = []
            let lastsig = account[account.length - 1].signature
            console.log("last ", account[account.length - 1].signature)
            console.log(account)
            let lastday = dayjs.unix(account[account.length - 1].blockTime)
            console.log("last ", lastday, " start ", startday)
            let z = 0;
            $apiData.push(account)
            while (lastday > startday) {
            
                z++
                try {
                    let blue = await connection.getConfirmedSignaturesForAddress2(keyIn, {limit:fetchLimit,before:lastsig});
                    if (blue.length == 0) {
                        await sleep(500) //wait 0.5 seconds
                        continue
                    }
                    console.log("blue con ", z)
                    console.log(blue)
                    lastday = await dayjs.unix(blue[blue.length - 1].blockTime)
                    lastsig = await blue[blue.length - 1].signature
                    $apiData.push(blue)
                    
                    if (z==10) {
                        console.log("br aek")
                        break
                    }
                }
                catch (e) {
                    console.log("error ", e)
                    await sleep(500) //wait 0.5 seconds
                }
                    
            
            }
            $apiData = $apiData.flat()
            //fetch all transactions
            console.log("fetched account transactions: ", $apiData.length)
            //console.log($apiData)
            var results = $apiData.filter(transaction => dayjs.unix(transaction.blockTime) < endday && dayjs.unix(transaction.blockTime) > startday);

            console.log("results ", results)
            var reformattedArray = results.map((result) => result.signature);
           
                console.log("truy1 ")
                $fetchedArray = await connection.getParsedTransactions(reformattedArray)
                console.log("truy2 ")
                $fetchedArray.forEach(function (item:web3.ParsedTransactionWithMeta) {
                
                //new fee item
                //interpret each line and add transactions to the array;

                var new_line = 
                {
                    "signature": item.transaction.signatures[0],
                    "timestamp": item.blockTime, 
                    "slot": item.slot,
                    "success": item.meta? item.meta.err? false : true : null,
                    "fee": item.meta? item.meta.fee : null,
                    "account_keys": item.transaction.message.accountKeys,
                    "pre_balances": item.meta? item.meta.preBalances : null,
                    "post_balances": item.meta? item.meta.postBalances : null,
                    "pre_token_balances": item.meta? item.meta.preTokenBalances : null,
                    "post_token_balances": item.meta? item.meta.postTokenBalances : null,
                    "description": "Generic Transaction"
                }
                $workingArray.push(new_line)
                
            });
            //console.log("printing cleaned array")
            //console.log($cleanedArray)
            //console.log("printing working array")
            //.log($workingArray)
            $workingArray = $workingArray
           
            
            
        }
    
        loading = false 
            
        
    }

    function checkKey () {
        try {
            if (web3.PublicKey.isOnCurve($keyInput) == true)
                //deDaoKey instanceof web3.PublicKey ? fetchAll() : console.log("test")
                validKey = true
                fetchAll(new web3.PublicKey($keyInput))
                
                return true

        } catch(e) {
            console.log("failed key")
            validKey = false
            return false
        }
        return false
    }
//$: $keyInput != "" ? checkKey() ? new web3.PublicKey($keyInput) : loading = false : (validKey = false, loading = false)

$: start, end && $keyInput != "" ? checkKey() ? new web3.PublicKey($keyInput) : loading = false : (validKey = false, loading = false)
//<DateInput on:close={fetchAll} bind:value={start} closeOnSelection={true} format="yyyy-MM-dd" placeholder="2022-01-01" />   
// /<DateInput on:close={fetchAll} bind:value={end} closeOnSelection={true} format="yyyy-MM-dd" placeholder="2022-01-01" />
</script>

<div class="flex justify-center">
    <div class="pt-4 text-center ">
        <h1 class="pb-4 font-bely text-5xl font-bold text-center">DeBooks</h1>
        <input type="text" placeholder="enter account address e.g. DeDao..uw2r" bind:value={$keyInput} class="text-center input input-sm input-bordered input-primary w-96 max-w-xs " />
        <p class="pt-2 text-lg font-serif font-bold text-center">Transaction Statement</p>
        
        <div class="flex flex-row text-sm font-serif ">
            <span class="flex items-center pr-2">
                For the period
            </span>
            <input type="date" on:close={fetchAll} bind:value={start} max={end} class="text-center"/>
            
            <span class="flex items-center px-2 ">
                to
            </span>
            <input type="date" on:close={fetchAll} bind:value={end} max={new Date().toJSON().slice(0,10)} class="text-center"/>
            
        </div>
        

       <p class="pt-2 text-center">
        {#if loading}
            <span class="font-serif font-medium badge badge-lg">loading...</span> 
        {/if}
       </p>
        
    </div>
   
</div>

{#if validKey == true }
<div class="flex justify-center p-4 font-serif overflow-x-auto">
    <div class="overflow-x-auto">
        <table class="table table-compact ">
        
          <!-- head -->
          <thead>
            <tr class="">
              <th class="min-w-[2rem]">Date</th>
              <th class="min-w-[20rem]">Description</th>
              <th class="min-w-[4rem]">Counterparty</th>
              <th class="min-w-[2rem]">Amount</th>
              <th class="min-w-[2rem]"></th>
            </tr>
          </thead>
          <tbody>
            <!-- row 1 -->
            {#each $workingArray as transaction, i}
                <tr class="">
                <td class="min-w-[2rem]">{dayjs.unix(transaction.timestamp).format('YYYY-MM-DD')}</td>
                <td class="min-w-[20rem]">{transaction.description}</td>
                <td class="min-w-[4rem]">{new web3.PublicKey(transaction.account_keys[0].pubkey).toString()}</td>
                <td class="min-w-[2rem] text-right">{transaction.fee}</td>
                <td class="min-w-[2rem] text-right"><a href="https://solscan.io/tx/{transaction.signature}">ss</a></td>
                </tr>
            {/each}
          </tbody>
        
        </table>
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
    :root {
    --date-picker-background: hsl(var(--b1));
    --date-picker-foreground: hsl(var(--bc));
    --date-input-width: 90px;

}
</style>