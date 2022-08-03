<script lang='ts'>

    import { onMount } from "svelte";
    import { create } from "json-aggregate"
    import { apiData, cleanedArray, fetchedTransactions, workingArray, displayArray, keyInput, showfailed, showfees, currentPage, textFilter, reportingCurrency, showMetadata, exportTable } from '../stores.js';
    import * as web3 from '@solana/web3.js';
    import dayjs from 'dayjs'
    import localizedFormat from 'dayjs/plugin/localizedFormat'
    import relativeTime from 'dayjs/plugin/relativeTime'
    import Number from "../utils/Number.svelte";
    import { DateInput } from 'date-picker-svelte'
    import {paginate, PaginationNav  } from 'svelte-paginate-ts'
    import { Buffer } from 'buffer';
    //import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";    
    import { isNft, Metaplex } from "@metaplex-foundation/js";
    import { Client, UtlConfig} from '@solflare-wallet/utl-sdk';
    import type { Token } from '@solflare-wallet/utl-sdk';
    import Classifier from "../utils/Classifier.svelte";
    let classif;
    import { getDomainKey, NameRegistryState } from "@bonfida/spl-name-service";
    import { csvGenerator } from "../utils/csvGenerator";


    dayjs.extend(localizedFormat)
    dayjs.extend(relativeTime)
  
    const settings = { columnFilter: true }
    let rows

    let allData = []
    let loopNumber = 0;
   
    let fetchLimit = 250
    let loading = false;

    //let start = new Date(2022,6,1)
    let start = dayjs().subtract(7, 'days').format("YYYY-MM-DD")
    $: startday = dayjs(start).startOf('day')
    //let end = new Date(2022,6,6)
    let end = dayjs().format("YYYY-MM-DD")
    $: endday = dayjs(end).endOf('day')
    let validKey = false
    let pageIncrement = 20;

    let date = new Date()
    let totalPages = 1
    let currentTransaction = 0;
    let currentPercentage = "";
    let innerWidth = 0
	let innerHeight = 0
    $showMetadata = true
    let tableHeader = ["success", "signature", "timestamp",  "description", "amount"]
    let showConversion = false
    let convertingToReporting = false
    let storedCoinGeckoData = []
    let loadingText = "initializing..."
    let rpcConnection = false
    //let deDaoKey = new web3.PublicKey('DeDaoX2A3oUFMddqkvMAU2bBujo3juVDnmowg4Tyuw2r')
  
    //const connection = new web3.Connection("https://ssc-dao.genesysgo.net");
    const connection = new web3.Connection("https://solitary-young-butterfly.solana-mainnet.quiknode.pro/73898ef123ae4439f244d362030abcda8b8aa1e9/");
    const metaplex = new Metaplex(connection);
    const config = new UtlConfig({
            /**
             * 101 - mainnet, 102 - testnet, 103 - devnet
             */
            chainId: 101,
            /**
             * number of miliseconds to wait until falling back to CDN
             */
            timeout: 2000,
            /**
             * Solana web3 Connection
             */
            connection: connection,
            /**
             * Backend API url which is used to query tokens
             */
            apiUrl: "https://token-list-api.solana.cloud",
            /**
             * CDN hosted static token list json which is used in case backend is down
             */
            cdnUrl: "https://cdn.jsdelivr.net/gh/solflare-wallet/token-list/solana-tokenlist.json"
        });
    const utl = new Client(config);


    onMount(async () => {
       //await fetchAll()
        console.log("START - starting logs")
        //var trans = await connection.getParsedTransaction("4E38pTfTZJWWzNVcM8MVGdNUiDgf3gjygt4xihG3mRtq8HqqUxVKNXgLYTNfY9cwD5W8JyH5UpyHBu9zzfRS5CKv")
        //var trans = await connection.getParsedTransaction("cqAiQymHPbD2r2JP252Lkzw29EKTnksPU1spsSFZMAzdScx5ccsQ6YCFyLrqDzyYwLyZ2xbvLcLWpnorikviuZb")
        //var trans = await connection.getParsedTransaction("3ofEvDuyUDGP867qNr9XkLtrmpK3doyvrQ9xjuvCrpQx7MfDxmfSn2hayzwRUtDm3HuUXUEmvCUCzKXWitA9BTZx")
        //var trans = await connection.getAccountInfoAndContext(new web3.PublicKey("mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68"))
        //console.log(trans)
        
        //let response = await fetch("https://token-list-api.solana.cloud/v1/list");
        //let utl_api = await response.json()
        //let utlToken = utl_api.content.filter(item => item.address == "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
        //console.log(utlToken)
        //let req = "https://api.coingecko.com/api/v3/coins/wrapped-solana/history?date=31-01-2022"
        //let response = await fetch(req);
        //let data = await response.json()                
        //console.log("Output1 ", data)
        //console.log("Output2 ", data.market_data.current_price.usd)
        //let latestBlockhash =  await connection.getLatestBlockhashAndContext()
        //let topSlot = latestBlockhash.context.slot
        //let sigs = await connection.getBlockSignatures(topSlot-1000)
        //console.log("BLOCK ", sigs.signatures[0])
        console.log("days ", endday.diff(startday, 'days'))
        try {
           

            console.log("test RPC ", await connection.getLatestBlockhashAndContext())
            rpcConnection = true
        }
        catch (e) {
            rpcConnection = false
        }
        
        console.log(rpcConnection)
        //await interpolateBlockSignatures()
        console.log("END - starting logs")
    });

    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }
    async function conversionHandler() {

        showConversion = showConversion? false : true
        showConversion? convertingToReporting = true : convertingToReporting = false
        convertingToReporting? await convertWorkingArray () : null
        convertingToReporting = false
        //convertingToReporting = false
        //dayjs(item.timestamp).format("DD-MM-YYYY")
    }
    async function interpolateBlockSignatures() {
        
        let latestBlockhash =  await connection.getLatestBlockhashAndContext()
        console.log(latestBlockhash.context.slot)

        let slotIncrements = 500000
        let topSlot = latestBlockhash.context.slot
        let endBlockTime;
        try {
            endBlockTime =  await connection.getBlockTime(topSlot)
        }
        catch (e) {
            endBlockTime =  await connection.getBlockTime(topSlot)
            console.log("failed to get block time")
        }
        let endSignature;
        let startSignature;
        
        
        //starting with the right starting point; then increment downwards
        let biggerIncrements = 100000
       
        let smallerIncrements = 25000
        //topSlot -= firstIncrement
        loadingText = "optimizing retrieval..."
        end_loop:
        while ((dayjs.unix(endBlockTime).diff(endday, 'hours')) >= 6) {
            console.log("a0 ", dayjs.unix(endBlockTime).format("DD-MM-YYYY"), endday.format("DD-MM-YYYY"), (dayjs.unix(endBlockTime).diff(endday, 'hours')))
            try {
                if ((dayjs.unix(endBlockTime).diff(endday, 'hours')) > 24){
                    
                    topSlot -= Math.floor(biggerIncrements  * (dayjs.unix(endBlockTime).diff(endday, 'hours'))/24) 
                }
                else {
                    topSlot -= smallerIncrements
                }
                topSlot = Math.max(topSlot, 1)
                endBlockTime = await connection.getBlockTime(topSlot)
                console.log("a1 ", dayjs.unix(endBlockTime).format("DD-MM-YYYY"), endday.format("DD-MM-YYYY"), (dayjs.unix(endBlockTime).diff(endday, 'hours')))
                
                //need to catch if endBlock is less than endday then top op till over
                if ((dayjs.unix(endBlockTime).diff(endday, 'hours')) < 0) {
                    while ((dayjs.unix(endBlockTime).diff(endday, 'hours')) <= 0) {
                        try {
                            if ((dayjs.unix(endBlockTime).diff(endday, 'hours')) < -24){
                    
                                topSlot += Math.floor(biggerIncrements  * -(dayjs.unix(endBlockTime).diff(endday, 'hours'))/24 )
                            }
                            else {
                                topSlot += smallerIncrements
                            }
                            topSlot = Math.max(topSlot, 1)
                            endBlockTime = await connection.getBlockTime(topSlot)
                            console.log("a2 ", dayjs.unix(endBlockTime).format("DD-MM-YYYY"), endday.format("DD-MM-YYYY"), (dayjs.unix(endBlockTime).diff(endday, 'hours')), (dayjs.unix(endBlockTime).diff(endday, 'hours')) > 0)
                        }
                        catch (e) {
                            console.log("error in interpolate 1b", e)
                        }
                    }
                    let sigs = await connection.getBlockSignatures(topSlot)
                    endSignature = sigs.signatures[0]
                    console.log("END BLOCK SIG1 ", sigs.signatures[0], dayjs.unix(endBlockTime))
                    break end_loop
                    
                }
                else if ((dayjs.unix(endBlockTime).diff(endday, 'hours')) < 6 && (dayjs.unix(endBlockTime).diff(endday, 'hours')) > 0) {
                    let sigs = await connection.getBlockSignatures(topSlot)
                    endSignature = sigs.signatures[0]
                    console.log("END BLOCK SIG1 ", sigs.signatures[0], dayjs.unix(endBlockTime))
                    break end_loop
                }
              

            }
            catch (e) {
                console.log("error in interpolate 1a",e )
            }
            
        }

        //interpolate to find start day sig
        let startBlocktime = endBlockTime
        let startSlot = topSlot
        
       
        start_loop:
        while ((dayjs.unix(startBlocktime).diff(startday, 'hours')) >= 0) {
          
            try {
                if ((dayjs.unix(startBlocktime).diff(startday, 'hours')) > 24){
                    
                    startSlot -= Math.floor(biggerIncrements * 2 * (dayjs.unix(startBlocktime).diff(startday, 'hours'))/24 )
                }
                else {
                    startSlot -=  Math.floor(smallerIncrements)
                }
                startSlot = Math.max(startSlot, 0)
                startBlocktime = await connection.getBlockTime(startSlot)
                console.log("b1 ", dayjs.unix(startBlocktime).format("DD-MM-YYYY"), startday.format("DD-MM-YYYY"), (dayjs.unix(startBlocktime).diff(startday, 'hours')))
                
                if (dayjs.unix(startBlocktime).diff(startday, 'hours') < 0) {
                    while ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < -24) {
                        if ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < -48) {
                            startSlot += Math.floor(biggerIncrements  * -(dayjs.unix(startBlocktime).diff(startday, 'hours'))/24 )
                        }
                        else {
                            startSlot += smallerIncrements
                        }
                        
                        startBlocktime = await connection.getBlockTime(startSlot)
                        console.log("b2 ", dayjs.unix(startBlocktime).format("DD-MM-YYYY"), startday.format("DD-MM-YYYY"), (dayjs.unix(startBlocktime).diff(startday, 'hours')))
                    }
                    let sigs = await connection.getBlockSignatures(startSlot)
                    startSignature = sigs.signatures[0]
                    console.log("START BLOCK SIG1 ", sigs.signatures[0], dayjs.unix(startBlocktime))
                    break start_loop

                }
                else if ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < 0 && (dayjs.unix(startBlocktime).diff(startday, 'hours')) > -24) {
                    let sigs = await connection.getBlockSignatures(startSlot)
                    startSignature = sigs.signatures[0]
                    console.log("START BLOCK SIG2 ", sigs.signatures[0], dayjs.unix(startBlocktime))
                    break start_loop
                }
                

           

            }
            catch (e) {
                console.log("error in interpolate 2a",  e)
            }

        }    
        
        console.log("finished ",  dayjs.unix(startBlocktime).format("DD-MM-YYYY"), dayjs.unix(endBlockTime).format("DD-MM-YYYY"))
        return [startSignature, endSignature] as const;


    }

    async function convertWorkingArray () {
        let response = await fetch("https://token-list-api.solana.cloud/v1/list");
        let utl_api = await response.json()
        
        let free = true // to expand when premium sub activated

        
        for await (const item of $workingArray) {
            let utlToken = utl_api.content.filter(ut => ut.address == item.mint)[0]
            
            if (utlToken && utlToken.extensions) {
                //https://api.coingecko.com/api/v3/coins/wrapped-solana/history?date=30-01-2022
                let filteredData = storedCoinGeckoData.filter(line => line.id == utlToken.extensions.coingeckoId && line.date == dayjs.unix(item.timestamp).format("DD-MM-YYYY") )

                if (storedCoinGeckoData.length == 0 || filteredData.length == 0) {
                    let req = "https://api.coingecko.com/api/v3/coins/"+utlToken.extensions.coingeckoId+"/history?date="+dayjs.unix(item.timestamp).format("DD-MM-YYYY")
                    let response = await fetch(req);
                    let data = await response.json()                
                    
                    var stored_value = {
                        "id": utlToken.extensions.coingeckoId,
                        "date": dayjs.unix(item.timestamp).format("DD-MM-YYYY"),
                        "usd": data.market_data.current_price.usd
                    }
                    storedCoinGeckoData.push(stored_value)
                    
                    item.usd_amount = parseFloat((item.amount * data.market_data.current_price.usd).toFixed(4))
                }
                else {
                    //console.log("same day value is available ", filteredData[0])
                    item.usd_amount = parseFloat((item.amount * filteredData[0].usd).toFixed(4))
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

    function downloadHandler() {

        let filename = "debooks_" + $keyInput + "_" + startday.format('YYYY-MM-DD') + "_" + endday.format('YYYY-MM-DD') + ".csv"
        if (showConversion) {
           console.log("with USD")
            let result = $displayArray.map(o => Object.fromEntries(["success", "signature", "timestamp",  "description", "amount", "usd_amount"].map(key => [key.toLowerCase(), o[key.toLowerCase()]])));
            let tableKeys = Object.keys(result[0]); //extract key names from first Object
            csvGenerator(result, tableKeys, ["success", "signature", "timestamp",  "description", "amount", "usd_amount"], filename);
        }
        else {
            console.log("withOUT USD")
            let result = $displayArray.map(o => Object.fromEntries(["success", "signature", "timestamp",  "description", "amount"].map(key => [key.toLowerCase(), o[key.toLowerCase()]])));
            let tableKeys = Object.keys(result[0]); //extract key names from first Object
            csvGenerator(result, tableKeys, ["success", "signature", "timestamp",  "description", "amount"], filename);
        }
        
    }

    async function fetchForAddress (keyIn) {
        showConversion = false
        convertingToReporting = false
        $currentPage = 1
        $apiData =[]
        $workingArray = []
        $displayArray = []
        $fetchedTransactions = []
        currentTransaction = 0
        currentPercentage = ""
        loading = true
        

        let signatureBracket = await interpolateBlockSignatures()
        let signatures = await connection.getSignaturesForAddress(keyIn, {limit:fetchLimit,before:signatureBracket[1], until:signatureBracket[0]});
        //console.log(signatures)
        if (signatures.length == 0)
        {
            validKey = false
            console.log("initial signatures length 0")
        }  
        else
        {
            
            //set initial lastday and last sig
            let lastsig = signatures[signatures.length - 1].signature
            let lastday = dayjs.unix(signatures[signatures.length - 1].blockTime)
            let z = 0;
            $apiData.push(signatures)
            while (lastday > startday) {
            
                z++
                try {
                    let loopsigs = await connection.getSignaturesForAddress(keyIn, {limit:fetchLimit,before:lastsig, until:signatureBracket[0]});
                    if (loopsigs.length == 0) {
                     //   await sleep(500) //wait 0.5 seconds
                        break
                    }
                    //updated lastday and last sig
                    lastday = await dayjs.unix(loopsigs[loopsigs.length - 1].blockTime)
                    lastsig = await loopsigs[loopsigs.length - 1].signature
                    $apiData.push(loopsigs)
                    
                
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

            //console.log("date filtered results ", results.length)
            var reformattedArray = results.map((result) => result.signature);

            let y = 0
            let yIncrement = 250
            while (y < reformattedArray.length) {

                loadingText =  y>0? "fetching data... " +  Math.round(y/reformattedArray.length*100) +"%" : "fetching data..."
                let array = await connection.getParsedTransactions(reformattedArray.slice(y,Math.min(y+yIncrement, reformattedArray.length)))
                $fetchedTransactions.push(array)
                console.log("incrementally fetching parsed ", y, reformattedArray.length)
                y += yIncrement
                

            }
            $fetchedTransactions = $fetchedTransactions.flat()
            //$fetchedTransactions = await connection.getParsedTransactions(reformattedArray)
            let response = await fetch("https://token-list-api.solana.cloud/v1/list");
            let utl_api = await response.json()
            
            //console.log("fetched ", $fetchedTransactions.flatMap(s => s.transaction.signatures))
            //console.log("fetched ", $fetchedTransactions)
            loadingText = $showMetadata? "analyzing with metadata..." : "analyzing..."
            for await (const item of $fetchedTransactions) {
              
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
                        "usd_amount": null,
                        "mint": "So11111111111111111111111111111111111111112",
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
                    //console.log("programIDs ", programIDs, item)
                    //only classify successful transactions!
                    //MAGIC EDEN TRANSACTIONS >>
                    if (item != null || item != undefined) {
                        await classif.classifyTransaction (item, programIDs, metaplex, account_index, keyIn, feePayer, utl_api.content)
                    }
                    
                }
            }


            
            //console.log("printing cleaned array")
            //console.log($cleanedArray)
            //console.log("printing working array")
            //.log($workingArray)
            
            $workingArray = $workingArray
            sortArray($workingArray)
            $displayArray = $workingArray
            totalPages = Math.ceil($displayArray.length/pageIncrement)
            sliceDisplayArray()
            
            
        }
        
        loading = false 
            
        
    }
    function sortArray(arrayIn) {
        arrayIn = arrayIn.sort(function sortDates(a, b) { // non-anonymous as you ordered...
            return b.timestamp > a.timestamp ?  1 // if b should come earlier, push a to end
                : b.timestamp < a.timestamp ? -1 // if b should come later, push a to begin
                : 0;                   // a and b are equal
            });
        arrayIn = arrayIn
    }
    function sliceDisplayArray () {
        if ($showfees && $showfailed) {
            
            $displayArray = $workingArray.filter(transaction => transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.signature.toLowerCase().includes($textFilter.toLowerCase()))
            
            
            //console.log("showfees && showfailed")
        }
        else if ($showfees && !$showfailed) {
            //default
            $displayArray = $workingArray.filter(transaction => transaction.success == true && transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.success == true && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            //console.log("showfees && !showfailed")
        }
        else if (!$showfees && $showfailed) {
            $displayArray = $workingArray.filter(transaction => transaction.description.substring(0,3) != "Txn" && transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.description.substring(0,3) != "Txn" && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            //console.log("!showfees && showfailed")
        }
        else if (!$showfees && !$showfailed) {
            $displayArray = $workingArray.filter(transaction => transaction.success == true && transaction.description.substring(0,3) != "Txn" && transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.success == true && transaction.description.substring(0,3) != "Txn" && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            //console.log("!showfees && !showfailed")
        }
        $displayArray = $displayArray.sort(function sortDates(a, b) { // non-anonymous as you ordered...
            return b.timestamp > a.timestamp ?  1 // if b should come earlier, push a to end
                : b.timestamp < a.timestamp ? -1 // if b should come later, push a to begin
                : 0;                   // a and b are equal
            });
        $displayArray = $displayArray
        totalPages = Math.ceil($displayArray.length/pageIncrement)
        //console.log("display array length: ", $displayArray.length)
    }

    function checkKey () {
        try {
            
            if (web3.PublicKey.isOnCurve($keyInput) == true) {
                //deDaoKey instanceof web3.PublicKey ? fetchAll() : console.log("test")
                validKey = true
                $currentPage = 1
                loadingText = "initializing..."
                fetchForAddress(new web3.PublicKey($keyInput))
                sliceDisplayArray()
                return true
            } else {
                console.log("Key not on curve: ", $keyInput, )
                
                /*
                const domainName = $keyInput; // With or without the .sol at the end

                // Step 1
                const { pubkey } = await getDomainKey(domainName);

                // Step 2
                // The registry object contains all the info about the domain name
                // The NFT owner is of type PublicKey | undefined
                const { registry, nftOwner } = await NameRegistryState.retrieve(
                connection,
                domainKey
                );*/
            }

        } catch(e) {
            console.log("failed key")
            validKey = false
            return false
        }
        return false
    }
$: $keyInput != "" ? checkKey() ? new web3.PublicKey($keyInput) : loading = false : (validKey = false, loading = false)
$: $showfailed, sliceDisplayArray()
$: $showfees, sliceDisplayArray(), !$showfees? $currentPage > totalPages? $currentPage = totalPages : "" : ""
$: $displayArray, sortArray($displayArray)
$: $textFilter, sliceDisplayArray(), $currentPage = 1
$: currentTransaction != 0? currentPercentage = "" + Math.round(currentTransaction/$fetchedTransactions.length*100) + "%" : ""
$: condition = innerWidth < 640
$: start,$currentPage = 1
$: end, $currentPage = 1 
//$: (async() => $keyInput = await checkKey ())();

//$: start, end && $keyInput != "" ? checkKey() ? new web3.PublicKey($keyInput) : loading = false : (validKey = false, loading = false)
//<DateInput on:close={fetchAll} bind:value={start} closeOnSelection={true} format="yyyy-MM-dd" placeholder="2022-01-01" />   
// /<DateInput on:close={fetchAll} bind:value={end} closeOnSelection={true} format="yyyy-MM-dd" placeholder="2022-01-01" />
</script>
<Classifier bind:this={classif} />
<svelte:window bind:innerWidth bind:innerHeight />


<div class="flex justify-center">
    
    <div class="pt-4 text-center ">
 
            
        <h1 class="pb-2 font-rosu1 text-5xl text-center">DeBooks</h1>
        
        <div class="indicator">
            <span class="indicator-item indicator-top badge badge-primary font-ros1">alpha</span>
        {#if loading == false}
        
            <input type="text" placeholder="enter account address e.g. DeDao..uw2r" bind:value={$keyInput} class="text-center font-serif input input-sm input-bordered input-primary w-96  " />
        {:else}
            <input type="text" placeholder="enter account address e.g. DeDao..uw2r" bind:value={$keyInput} disabled class="text-center font-serif input input-sm input-bordered input-primary w-96  " />
        {/if}
        </div>
        <p class="pt-2 text-lg font-serif font-bold text-center">Transaction Statement</p>
        
        <div class="flex flex-row text-sm font-serif ">
            <span class="flex items-center pr-2">
                For the period
            </span>
            {#if loading == false}
                <input type="date" on:input={checkKey} bind:value={start} max={end} class="text-center bg-base-100 border border-primary rounded-md"/>
            {:else}
                <input type="date" disabled bind:value={start} max={end} class="text-center bg-base-100"/>
            {/if}
            
            
            <span class="flex items-center px-2 ">
                to
            </span>
            {#if loading == false}
                <input type="date" on:input={checkKey} bind:value={end} min={start} max={new Date().toJSON().slice(0,10)} class="text-center bg-base-100 border border-primary rounded-md"/>
            {:else}
                <input type="date" disabled={true} bind:value={end} min={start} max={new Date().toJSON().slice(0,10)} class="text-center bg-base-100"/>
            {/if}
            
        </div>
        

       
        
    </div>
   
</div>

{#if validKey == true }

<div class="flex justify-center font-serif ">
    
    <div class="overflow-x-auto">
        {#if loading}
        <div class="flex flex-row justify-center ">
            <p class="pt-4 justify-center">
                <span class="font-serif font-medium badge badge-lg ">
                    <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-bg-neutral-content" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>{loadingText} {currentPercentage}</span> 
            </p>
        </div>
        {/if}
        {#if $fetchedTransactions.length > 0 && !loading}
        <div class="grid grid-flow-col place-items-center pt-1 ">
            {#if !loading } 
                    <div class="col-start-auto">
                        
                        <input type="text" placeholder="Search: e.g. Magic Eden..." bind:value={$textFilter} class="input input-xs sm:min-w-[28rem] sm:max-w-[28rem] " />
                    </div>
               
                    <div class="col-end-auto">
                        <label class="label">
                            <span class="label-text font-semibold pr-2 ">Show:</span> 
                            <span class="label-text pr-1 ">Txn Fees</span> 
                            <input type="checkbox" class="checkbox checkbox-sm" bind:checked={$showfees} />
                            
                        </label>
                        
                    </div>

                    
                    <div class="col-end-auto ">
                        
                        <span class="cursor-pointer"><svg on:click={downloadHandler} xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg></span>
                    </div>
                    <div class="col-end-auto ">
                        
                            {#if !showConversion}
                            <button on:click={conversionHandler} class="btn btn-xs  btn-ghost">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pr-1 " fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            USD</button>
                            {:else}
                            <button on:click={conversionHandler} class="btn btn-xs btn-ghost">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            USD</button>
                            {/if}
                          
                    </div>
                    
                    {/if}
                    
                    
                    
        </div>
                
        <table class="table table-compact normal-case min-w-[50%] max-w-[50%] ">
            
          <!-- head -->
          <thead>
            <tr class=" ">
                <th class="min-w-[2rem]"></th>
                <th class="min-w-[2rem] text-left normal-case">Date</th>
                <th class="sm:min-w-[28rem] sm:max-w-[28rem] min-w-[12rem] max-w-[12rem] text-left normal-case">Description</th>
                {#if !condition}
                    <th class="min-w-[4rem] text-left normal-case">Sig</th>
                {/if}
                
                <th class="min-w-[4rem] max-w-[4rem] text-right normal-case">Base</th>
                {#if showConversion}
                <th class="min-w-[4rem] max-w-[4rem] text-right normal-case">{$reportingCurrency}</th>
                {/if}
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
                    <td class="min-w-[2rem] text-left">{dayjs.unix(transaction.timestamp).format('YYYY-MM-DD')}</td>
                    <td class="whitespace-normal sm:min-w-[28rem] sm:max-w-[28rem] min-w-[12rem] max-w-[12rem] text-left">{transaction.description}</td>
                    {#if !condition}
                        <td class="min-w-[4rem] text-left">{transaction.signature.substring(0,4)}...</td>
                    {/if}
                    <td class="min-w-[2rem] text-right">{transaction.amount}</td>
                    {#if showConversion}
                        {#if convertingToReporting}
                            <td class="min-w-[2rem] text-right"><progress class="progress w-[2rem]"></progress></td>
                        {:else}
                            <td class="min-w-[2rem] text-right">{transaction.usd_amount}</td>
                        {/if}
                        
                    {/if}
                    <td class="min-w-[2rem] text-right" ><a href="https://solscan.io/tx/{transaction.signature}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg></a></td>
                </tr>
            {/each}
          </tbody>
          
        </table>
        
        {/if}
        
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

        {#if showConversion}
        <div class="flex flex-row justify-end ">
            <p class="text-[0.7rem] pt-2 pr-4 italic text-base-content">powered by CoinGecko</p>
            
        </div>
       
          
          {/if}
    </div>

</div>
{:else}

<div class="flex justify-center flex-row">
    <div class="pt-10">
        <div class="alert shadow-lg font-serif">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {#if rpcConnection}
                    <span>Enter a valid <span class="font-bold">wallet</span> address to display records.</span>
                {:else }
                    <span>Unable to estalbish connection to RPC provider.</span>
                {/if}
            </div>
        </div>
    
    </div>

</div>

{/if}
{#if validKey == true && !loading && $fetchedTransactions.length == 0}
    <div class="flex justify-center flex-row">
        <div class="pt-10">
            <div class="alert shadow-lg font-serif">
                <div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>No records for this period.</span>
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