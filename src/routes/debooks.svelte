<script lang='ts'>

    import { onMount } from "svelte";
    import { create } from "json-aggregate"
    import { apiData, cleanedArray, fetchedTransactions, workingArray, displayArray, keyInput, showfailed, showfees, currentPage, textFilter, reportingCurrency, showMetadata, time } from '../stores.js';
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
    import solanaData from '../utils/wrapped-solana.json'


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
    $showMetadata = false
    let tableHeader = ["success", "signature", "timestamp",  "description", "amount"]
    let showConversion = false
    let convertingToReporting = false
    let storedCoinGeckoData = []
    let loadingText = "initializing..."
    let rpcConnection = false
    //let deDaoKey = new web3.PublicKey('DeDaoX2A3oUFMddqkvMAU2bBujo3juVDnmowg4Tyuw2r')
    let startTime;
    let showInfoTip = false
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
        //let req = "https://pro-api.coingecko.com/api/v3/coins/wrapped-solana/history?date=31-01-2022&x_cg_pro_api_key=CG-F3PXm3JzJRLx48C6cvfMvvrk"
        
        //let data = await response.json()                
        //console.log("Output1 ", data)
        //console.log("Output2 ", data.market_data.current_price.usd)
        
        //let topSlot = latestBlockhash.context.slot
        //let sigs = await connection.getBlockSignatures(topSlot-1000)
        //console.log("BLOCK ", sigs.signatures[0])
        let latestBlockhash 
        while(latestBlockhash == null) {

            try {
                latestBlockhash = await connection.getLatestBlockhashAndContext()
                rpcConnection = true
            }
            catch (e) {
                rpcConnection = false
                console.log("unable to establish connection to RPC nodes")
            }
            sleep(750)
            
        }
        console.log("connection ", rpcConnection)
        
       
        storedCoinGeckoData.push(solanaData)
        storedCoinGeckoData = storedCoinGeckoData.flat()
 
        //fetch historics manually
        if (false) 
        {
            //let startdate = dayjs().subtract(1, 'days')
            
            var startdate = dayjs('2020-07-11')
            let preFetched = []
            for (let i = 0; i < 499; i++) {
                try {
                    let req = "https://pro-api.coingecko.com/api/v3/coins/solana/history?date="+startdate.format("DD-MM-YYYY") + "&x_cg_pro_api_key=CG-F3PXm3JzJRLx48C6cvfMvvrk"
                    //let req = "https://api.coingecko.com/api/v3/coins/"+utlToken.extensions.coingeckoId+"/history?date="+dayjs.unix(item.timestamp).format("DD-MM-YYYY")
                    let response = await fetch(req);
                    let data = await response.json()                
                    //console.log(data)
                    var stored_value = {
                        "id": "wrapped-solana",
                        "date": startdate.format("DD-MM-YYYY"),
                        "usd": data.market_data.current_price.usd
                    }
                    preFetched.push(stored_value)
                    startdate = startdate.subtract(1, 'days')
                }
                catch (e) {
                    console.log(e)
                    break
                }
                
            }
            console.log ("fetched pricing")
            console.log(preFetched)
            
            let filename = "wrapped-solana" + ".csv"
            console.log("withOUT USD")
            let result = preFetched.map(o => Object.fromEntries(["id", "date", "usd"].map(key => [key.toLowerCase(), o[key.toLowerCase()]])));
            let tableKeys = Object.keys(result[0]); //extract key names from first Object
            csvGenerator(result, tableKeys, ["id", "date", "usd"], filename);
            
           
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
           
            try {
                if ((dayjs.unix(endBlockTime).diff(endday, 'hours')) > 24){
                    
                    topSlot -= Math.floor(biggerIncrements  * (dayjs.unix(endBlockTime).diff(endday, 'hours'))/24) 
                }
                else {
                    topSlot -= smallerIncrements
                }
                topSlot = Math.max(topSlot, 1)
                endBlockTime = await connection.getBlockTime(topSlot)
                //console.log("a1 ", dayjs.unix(endBlockTime).format("DD-MM-YYYY"), endday.format("DD-MM-YYYY"), (dayjs.unix(endBlockTime).diff(endday, 'hours')))
                
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
                            //console.log("a2 ", dayjs.unix(endBlockTime).format("DD-MM-YYYY"), endday.format("DD-MM-YYYY"), (dayjs.unix(endBlockTime).diff(endday, 'hours')), (dayjs.unix(endBlockTime).diff(endday, 'hours')) > 0)
                        }
                        catch (e) {
                            //console.log("error in interpolate 1b", e)
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
                //console.log("error in interpolate 1a",e )
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
                //console.log("b1 ", dayjs.unix(startBlocktime).format("DD-MM-YYYY"), startday.format("DD-MM-YYYY"), (dayjs.unix(startBlocktime).diff(startday, 'hours')))
                
                if (dayjs.unix(startBlocktime).diff(startday, 'hours') < 0) {
                    while ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < -24) {
                        if ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < -48) {
                            startSlot += Math.floor(biggerIncrements  * -(dayjs.unix(startBlocktime).diff(startday, 'hours'))/24 )
                        }
                        else {
                            startSlot += smallerIncrements
                        }
                        try {
                            startBlocktime = await connection.getBlockTime(startSlot)
                            //console.log("b2 ", dayjs.unix(startBlocktime).format("DD-MM-YYYY"), startday.format("DD-MM-YYYY"), (dayjs.unix(startBlocktime).diff(startday, 'hours')))
                        }
                        catch (e) {
                            //console.log("error in interpolate 2b",  e)
                        }
                       
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
                //console.log("error in interpolate 2a",  e)
            }

        }    
        
        
        return [startSignature, endSignature] as const;


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
                        let req = "https://pro-api.coingecko.com/api/v3/coins/"+utlToken.extensions.coingeckoId+"/history?date="+dayjs.unix(item.timestamp).format("DD-MM-YYYY") + "&x_cg_pro_api_key=CG-F3PXm3JzJRLx48C6cvfMvvrk"
                        //let req = "https://api.coingecko.com/api/v3/coins/"+utlToken.extensions.coingeckoId+"/history?date="+dayjs.unix(item.timestamp).format("DD-MM-YYYY")
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
            //validKey = false
            console.log("initial signatures length 0", $fetchedTransactions.length)
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
            $showMetadata? startTime = $time.getSeconds() : null

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
            startTime = null
            showInfoTip = false
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
    function showFeesHandler() {
        $showfees = !$showfees
        if ($displayArray.length <1 && $showfees) {
            $currentPage = 1
        }
    }

$: $keyInput != "" ? checkKey() ? new web3.PublicKey($keyInput) : loading = false : (validKey = false, loading = false, $currentPage=1)
$: $showfailed, sliceDisplayArray()
$: $showfees, sliceDisplayArray(), !$showfees? $currentPage > totalPages? $currentPage = totalPages : $currentPage=$currentPage : $currentPage=$currentPage
$: $displayArray, sortArray($displayArray)
$: $textFilter, sliceDisplayArray(), $currentPage = 1
$: currentTransaction != 0? currentPercentage = "" + Math.round(currentTransaction/$fetchedTransactions.length*100) + "%" : ""
$: condition = innerWidth < 755
$: start, $currentPage = 1
$: end, $currentPage = 1 
$: startTime? $time.getSeconds() - startTime > 15? showInfoTip = true : null : null
$: !validKey? $currentPage = 1 : $currentPage=$currentPage
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
        {#if loading == false && rpcConnection == true}
        
            <input type="text" placeholder="enter account address e.g. DeDao..uw2r" bind:value={$keyInput} class="text-center font-serif input input-sm input-bordered input-primary w-96  " />
        {:else if loading == true || rpcConnection == false}
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

<div class="flex justify-center font-serif place-content-center   ">
    
    <div class=" ">
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
        <div class="grid grid-flow-col place-items-center md:pt-8 pt-4 pb-1 ">
            {#if !loading } 
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

                    
                   
                            <div class="md:tooltip " data-tip="Convert transactions to USD">
                                
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
                    
            {/if}
                    
                    
                    
        </div>
        
        {#if $displayArray.length > 0}
            <table class="table table-compact normal-case ">
                
            <!-- head -->
            <thead>
                <tr class=" ">
                
                    <th class="min-w-[2rem] text-left normal-case">Date</th>
                    <th class="lg:min-w-[32rem] max-w-[32rem] min-w-[11rem]  text-left normal-case">Description</th>
                    {#if !condition}
                        <th class="min-w-[4rem] text-left normal-case">Sig</th>
                    {/if}
                    
                    <th class="min-w-[4rem] max-w-[8rem] text-right normal-case">Base</th>
                    {#if showConversion}
                    <th class="min-w-[4rem] max-w-[6rem] text-right normal-case">{$reportingCurrency}</th>
                    {/if}
                    <th class="min-w-[2rem]"></th>
                </tr>
            </thead>          
        
            <tbody>
                <!-- row 1 -->
                {#each $displayArray.slice(pageIncrement*($currentPage - 1), pageIncrement*($currentPage - 1) + pageIncrement) as transaction, i}
                    <!-- show everything -->
                    <tr class="">
                        
                        <td class="min-w-[2rem] text-left">{dayjs.unix(transaction.timestamp).format('YYYY-MM-DD')}</td>
                        <td class="whitespace-normal lg:min-w-[32rem] max-w-[32rem] min-w-[11rem] text-left">{transaction.description}</td>
                        {#if !condition}
                            <td class="min-w-[4rem] text-left">{transaction.signature.substring(0,4)}...</td>
                        {/if}
                        <td class="min-w-[2rem] max-w-[8rem] text-right">{transaction.amount?.toLocaleString('en-US', { maximumFractionDigits: 10 })}</td>
                        {#if showConversion}
                            {#if convertingToReporting} 
                                <td class="min-w-[4rem] max-w-[6rem] text-right"><progress class="progress w-[2rem]"></progress></td>
                            {:else}
                                <td class="min-w-[4rem] max-w-[6rem]  text-right">{transaction.usd_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, trailingZeroDisplay :true, maximumFractionDigits: 4 })}</td>
                            {/if}
                            
                        {/if}
                        <td class="min-w-[2rem] text-right" ><a href="https://solscan.io/tx/{transaction.signature}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg></a></td>
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

    {#if !loading && $fetchedTransactions.length > 0}
        <div class="flex justify-center flex-row pt-8">
            <footer class="footer footer-center p-4 bg-base-200 text-base-content rounded-md">
                
                <div class="items-center grid-flow-col">
                    <a href="https://twitter.com/defliction" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current hover:fill-primary"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
                    </a>
                  <p>DeBooks © 2022</p>
                </div>
            </footer>
        </div>
    {/if}
    </div>
    
</div>
    {#if $showMetadata && showInfoTip && false }
    <div class="flex justify-center flex-row">
        <div class="pt-10">
            <div class="alert shadow-lg font-serif">
                <div> 
                   
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-primary-focus flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   
                        <span>We're working on it - fetching metadata, particularly lots of NFTs can feel slow</span>

                        
                </div>
            </div>
        
        </div>
    
    </div>
    {/if}
    {#if !loading && $fetchedTransactions.length == 0}
    <div class="flex justify-center flex-row">
        <div class="pt-10">
            <div class="alert shadow-lg font-serif">
                <div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-error flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>No records for this period.</span>
                </div>
            </div>
        
        </div>

    </div>
    {/if}
{:else}

<div class="flex justify-center flex-row">
    <div class="pt-10">
        <div class="alert shadow-lg font-serif">
            <div> 
                {#if rpcConnection == true}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-primary-focus flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               
                    <span>Enter a valid <span class="font-bold">Solana wallet</span> address to display records.</span>
                    {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 stroke-primary-focus" fill="none" viewBox="0 0 24 24"  stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                        <span>Establishing connection to RPC network...</span>
                    {/if}
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
  color: hsl(var(--pf));
}
</style>