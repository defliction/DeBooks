<script lang='ts'>

    import { onMount } from "svelte";
    import { apiData, cleanedArray, fetchedTransactions, workingArray, displayArray, keyInput, loadedAddress, showfailed, showfees, currentPage, textFilter, reportingCurrency, showMetadata, time, cnx } from '../stores.js';
    import * as web3 from '@solana/web3.js';
    import dayjs from 'dayjs'
    import localizedFormat from 'dayjs/plugin/localizedFormat'
    import relativeTime from 'dayjs/plugin/relativeTime'

    import {paginate, PaginationNav  } from 'svelte-paginate-ts'
    import { Buffer } from 'buffer';
  
    import * as classif from "../utils/classif";
    import { getDomainKey, NameRegistryState } from "@bonfida/spl-name-service";
    import { csvGenerator } from "../utils/csvGenerator";   
    import * as mtda from '../utils/Metadata'
    import { decodeMetadata } from '../utils/MetadataUtils'
    import * as token from '@solana/spl-token';
    
    dayjs.extend(localizedFormat)
    dayjs.extend(relativeTime)
  
    const settings = { columnFilter: true }
    let rows

    let allData = []
    let loopNumber = 0;
   
    let fetchLimit = 250
    let loading = false;

    //let start = dayjs(new Date(2021,1,1))
    let start = dayjs().subtract(7, 'days').format("YYYY-MM-DD")
    $: startday = dayjs(start).startOf('day')
    //let end = new Date(2022,6,6)
    let end = dayjs().format("YYYY-MM-DD")
    let firstDate = dayjs(new Date(2020,9,2)).startOf('day').format("YYYY-MM-DD")
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
    let metadataAnimation = false
    let metadataAnimText = ""
    let tableHeader = ["success", "signature", "timestamp",  "description", "amount"]
    let showConversion = false
    let convertingToReporting = false
    let storedCoinGeckoData: [] = []
    let loadingText = "initializing..."
    let metadataText = "Metadata On - Toggle off for faster loading without fetching NFT names etc..."
    let rpcConnection = false
    //let deDaoKey = new web3.PublicKey('DeDaoX2A3oUFMddqkvMAU2bBujo3juVDnmowg4Tyuw2r')
    let startTime: number;
    let showInfoTip = false
    let invalidKey = false;

    //const connection = new web3.Connection("https://ssc-dao.genesysgo.net");
    $cnx = new web3.Connection("https://solitary-young-butterfly.solana-mainnet.quiknode.pro/73898ef123ae4439f244d362030abcda8b8aa1e9/");
    //const metap = new Metaplex($connection)
    //const mx = Metaplex.make($cnx);
    //let mx

    onMount(async () => {
       //await fetchAll()
        console.log("START - starting logs")
    
        let latestBlockhash 
        while(latestBlockhash == null) {

            try {
                latestBlockhash = await $cnx.getLatestBlockhashAndContext()
                rpcConnection = true
                 
            }
            catch (e) {
                rpcConnection = false
                console.log("unable to establish connection to RPC nodes")
            }
            sleep(150)
            
        }
        console.log("first date", firstDate)
        //first blocktimed block - 38669748
        //let block = 38669748
        //let startB = await $cnx.getBlockTime(block)
        //console.log("b1 ",startB, dayjs.unix(startB).format("DD-MM-YYYY"), startday.format("DD-MM-YYYY"), (dayjs.unix(startB).diff(startday, 'hours')), block)
        //let giraffe = await $cnx.getAccountInfoAndContext(new web3.PublicKey("2moSEa33qxnGDZuydUYPeAkwdAjmEfCe87VcLJfhrBWp"))
        //let giraffe = await $cnx.getAccountInfoAndContext(new web3.PublicKey("2moSEa33qxnGDZuydUYPeAkwdAjmEfCe87VcLJfhrBWp"))
        //console.log(giraffe)
        //let trans = await $cnx.getParsedTransaction("2WCGGJd52r9wpVqFsUKH4dsfgewQcEGzPUQtkH8WQMRxVyBaHGm69KdnjCGKKNgCncMaX66MLfBRTCsypCr9PTGn")
        //console.log(trans)
        //console.log(trans.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()))
        //console.log(metadata_parsed)
        //const metadata_buf = Buffer.from(metadata_parsed.value.data, 'base64');
        //const metadata = decodeMetadata(metadata_buf)
        //console.log(metadata)
        //console.log("connection ", rpcConnection)
        //let metad = await mtda.getTokenMetadata(new web3.PublicKey("2ba9LpNiJQkyCwQahDiEZNFKJHUYnJ67DbyCnDdK88fP"))
        //console.log("Metadata", metad)
        //let teawk = await fetch("https://bafybeic6ljkikzvqjliilfqnz7sezi6ffvxkfliszntpozp3pdxko6mxlu.ipfs.nftstorage.link/2391.json")
        //let tewak = await teawk.json()
        //console.log(tewak)

        let response = await fetch("https://prices.debooks.xyz/wrapped-solana.json")
        let solanaData2 = await response.json()
        storedCoinGeckoData.push(solanaData2)
        storedCoinGeckoData = storedCoinGeckoData.flat()
        //console.log("latest date ", storedCoinGeckoData[0])
        //fetch historics manually
        
        //console.log(rpcConnection)
        //await interpolateBlockSignatures()
        console.log("END - starting logs")
    });
    
    const sleep = (milliseconds:number) => {
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
        
        let latestBlockhash =  await $cnx.getLatestBlockhashAndContext()
        console.log(latestBlockhash.context.slot)

        let slotIncrements = 500000
        let topSlot = latestBlockhash.context.slot
        let endBlockTime;
        try {
            endBlockTime =  await $cnx.getBlockTime(topSlot)
        }
        catch (e) {
            endBlockTime =  await $cnx.getBlockTime(topSlot)
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
                endBlockTime = await $cnx.getBlockTime(topSlot)
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
                            endBlockTime = await $cnx.getBlockTime(topSlot)
                            //console.log("a2 ", dayjs.unix(endBlockTime).format("DD-MM-YYYY"), endday.format("DD-MM-YYYY"), (dayjs.unix(endBlockTime).diff(endday, 'hours')), (dayjs.unix(endBlockTime).diff(endday, 'hours')) > 0)
                        }
                        catch (e) {
                            console.log("error in interpolate 1b", e)
                        }
                    }
                    let sigs = await $cnx.getBlockSignatures(topSlot)
                    endSignature = sigs.signatures[0]
                    console.log("END BLOCK SIG1 ", sigs.signatures[0], dayjs.unix(endBlockTime))
                    break end_loop
                    
                }
                else if ((dayjs.unix(endBlockTime).diff(endday, 'hours')) < 6 && (dayjs.unix(endBlockTime).diff(endday, 'hours')) > 0) {
                    let sigs = await $cnx.getBlockSignatures(topSlot)
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
        while ((dayjs.unix(startBlocktime).diff(startday, 'hours')) > 0 && startSlot != 38669748) {
            
            try {
                if ((dayjs.unix(startBlocktime).diff(startday, 'hours')) > 24){
                    
                    startSlot -= Math.floor(biggerIncrements * 2 * (dayjs.unix(startBlocktime).diff(startday, 'hours'))/24 )
                }
                else {
                    startSlot -=  Math.floor(smallerIncrements)
                }
                startSlot = Math.max(startSlot, 38669748)
                
                startBlocktime = await $cnx.getBlockTime(startSlot)
                
                
                if (dayjs.unix(startBlocktime).diff(startday, 'hours') < 0 && startBlocktime != null) {
                    while ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < -24) {
                        
                        if ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < -48) {
                            startSlot += Math.floor(biggerIncrements  * -(dayjs.unix(startBlocktime).diff(startday, 'hours'))/24 )
                        }
                        else {
                            startSlot += smallerIncrements
                        }

                        try {
                            //console.log("b2 ", dayjs.unix(startBlocktime).format("DD-MM-YYYY"), startday.format("DD-MM-YYYY"), (dayjs.unix(startBlocktime).diff(startday, 'hours')), startSlot)
                            startBlocktime = await $cnx.getBlockTime(startSlot)
                            
                        }
                        catch (e) {
                            console.log("error in interpolate 2b",  e)
                        }
                       
                    }
                    let sigs = await $cnx.getBlockSignatures(startSlot)
                    startSignature = sigs.signatures[0]
                    console.log("START BLOCK SIG1 ", sigs.signatures[0], dayjs.unix(startBlocktime))
                    break start_loop

                }
                else if ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < 0 && (dayjs.unix(startBlocktime).diff(startday, 'hours')) > -24 && startBlocktime != null) {
                    let sigs = await $cnx.getBlockSignatures(startSlot)
                    startSignature = sigs.signatures[0]
                    console.log("START BLOCK SIG2 ", sigs.signatures[0], dayjs.unix(startBlocktime))
                    break start_loop
                }
                

           

            }
            catch (e) {
                console.log("error in interpolate 2a",  e)
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
            let result = $displayArray.map(o => Object.fromEntries(["success", "signature", "timestamp",  "description", "token_name", "type", "amount", "usd_amount"].map(key => [key.toLowerCase(), o[key.toLowerCase()]])));
            let tableKeys = Object.keys(result[0]); //extract key names from first Object
            csvGenerator(result, tableKeys, ["success", "signature", "timestamp",  "description", "token_name", "type", "amount", "usd_amount"], filename);
        }
        else {
            console.log("withOUT USD")
            let result = $displayArray.map(o => Object.fromEntries(["success", "signature", "timestamp",  "description", "token_name", "type", "amount"].map(key => [key.toLowerCase(), o[key.toLowerCase()]])));
            let tableKeys = Object.keys(result[0]); //extract key names from first Object
            csvGenerator(result, tableKeys, ["success", "signature", "timestamp",  "description", "token_name", "type", "amount"], filename);
        }
        
    }
    async function metadataHandler() {
        $showMetadata = !$showMetadata
        //console.log($fetchedTransactions.length, $displayArray.length, $workingArray.length)
        if (showMetadata && !loading && $fetchedTransactions.length > 0 && $loadedAddress == $keyInput) {
            metadataAnimation = true
            metadataAnimText = ""
            await classifyArray (new web3.PublicKey($keyInput))
            showConversion = false
            metadataAnimation = false
        }
        
    }
    async function classifyArray (keyIn) {
        //loading = true
        let response = await fetch("https://token-list-api.solana.cloud/v1/list");
        let utl_api = await response.json()
        $workingArray = []
        
        loadingText = $showMetadata? "analyzing with metadata..." : "analyzing..."
        $showMetadata? startTime = $time.getSeconds() : null
        let owner = await $cnx.getAccountInfoAndContext(new web3.PublicKey(keyIn))
        let txn = 0
        for await (const item of $fetchedTransactions) {
            txn += 1
           

            let account_index = item.transaction.message?.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
            let programIDs: string[] = []
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
                    "token_name": "SOL",
                    "type": "Fees",
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
                    try {
                        await classif.classifyTransaction (item, $workingArray, $showMetadata, programIDs, account_index, keyIn, owner, feePayer, utl_api.content)
                    }
                    catch (e)
                    {
                        console.log("Failed to classify, ", e, item)
                    }
                    
                }
                
            }
            metadataAnimText = "" + Math.min(99,Math.round(txn/$fetchedTransactions.length*100))+"%"
            
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
        //$currentPage = 1
        //totalPages = Math.ceil($displayArray.length/pageIncrement)
        sliceDisplayArray()
        //loading = false
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
        $loadedAddress = $keyInput
        

        let signatureBracket = await interpolateBlockSignatures()

        let tokenAccounts = await $cnx.getParsedTokenAccountsByOwner(new web3.PublicKey(keyIn), {
                            programId: token.TOKEN_PROGRAM_ID,
                            })

        let response = await fetch("https://token-list-api.solana.cloud/v1/list");
        let utl_api = await response.json()

       
        let account_list = [keyIn]
        for await (const account of tokenAccounts.value) {
            if (utl_api.content.flatMap(s => s.address).indexOf(account.account.data.parsed.info.mint) !== -1) {
                account_list.push(account.pubkey)
                console.log("adding mint ",account.pubkey.toBase58() )
                //signatures.push((await $cnx.getSignaturesForAddress(account.pubkey, {limit:fetchLimit,before:signatureBracket[1], until:signatureBracket[0]}))[0]);
            }
        }
        
        let signatures = []
        account_list = account_list.flat()
        loadingText = "pre-fetch..."
        for await (const account of account_list) {
            loadingText = "pre-fetch... " + account_list.indexOf(account) + "/" + account_list.length
            let fetched = await $cnx.getSignaturesForAddress(account, {limit:fetchLimit,before:signatureBracket[1], until:signatureBracket[0]})
            if (fetched != undefined) {
                signatures.push(fetched)
            }
            //set initial lastday and last sig
            
            let lastsig:string = await signatures[signatures.length - 1].signature
            let lastday = dayjs.unix(await signatures[signatures.length - 1].blockTime)
            let firstLastday = dayjs.unix(await signatures[signatures.length - 1].blockTime)
            while (lastday > startday) {
                try {
                    let loopsigs = await $cnx.getSignaturesForAddress(keyIn, {limit:fetchLimit,before:lastsig, until:signatureBracket[0]});
                    for await (const account of tokenAccounts.value) {
                        if (utl_api.content.flatMap(s => s.address).indexOf(account.account.data.parsed.info.mint) !== -1) {
                            //console.log("adding mint ",account.pubkey.toBase58() )
                            let fetched = (await $cnx.getSignaturesForAddress(account.pubkey, {limit:fetchLimit,before:lastsig, until:signatureBracket[0]}))[0]
                            if (fetched != undefined) {
                                loopsigs.push(fetched);
                            }
                        } 
                        //console.log('loopsig', loopsigs)
                    }
                    if (loopsigs.length == 0) {
                     //   await sleep(500) //wait 0.5 seconds
                        break
                    }
                    loopsigs = loopsigs.filter(x => x !== undefined)
                    //updated lastday and last sig
                    lastday = dayjs.unix(await loopsigs[loopsigs.length - 1].blockTime)
                    loadingText = "pre-fetch... " + account_list.indexOf(account) + "/" + account_list.length + " - " + Math.min(Math.round(firstLastday.diff(lastday, 'hours')/firstLastday.diff(startday, 'hours')*100,0),100) +"%"
                    lastsig = await loopsigs[loopsigs.length - 1].signature
                    signatures.push(loopsigs)
                    //console.log("signatures ", lastday.format("DD-MM-YYY"), startday.format("DD-MM-YYYY"), endday.format("DD-MM-YYYY"), endday.diff(lastday, 'hours'), endday.diff(startday, 'hours'), endday.diff(lastday, 'hours')/endday.diff(startday, 'hours'))
                }
                catch (e) {
                    console.log("Error in loopsigs", e)
                    //await sleep(500) //wait 0.5 seconds
                }
            }
        }
        signatures = signatures.flat()
        signatures = signatures.filter(x => x !== undefined)
        signatures = [...new Set(signatures.map(a => a.signature))].map(signature => {
                                                return signatures.find(a => a.signature === signature)
                                                });
        //get all signatures, remove dupes and undefined;
        //console.log(signatures)
        if (signatures.length == 0)
        {
            //validKey = false
            console.log("initial signatures length 0", signatures.length)
        }  
        else
        {
            
            //console.log(signatures)
            $apiData.push(signatures)
            $apiData = $apiData.flat()
            //console.log("flat account transactions: ", $apiData)
            
            //fetch all transactions
            //console.log("fetched account transactions: ", test)
            //console.log("fetched account transactions: ", $apiData)
            //console.log($apiData)
            var results = $apiData.filter(transaction => dayjs.unix(transaction.blockTime) < endday && dayjs.unix(transaction.blockTime) > startday);

            //console.log("date filtered results ", results.length)
            var reformattedArray = results.map((result) => result.signature);

            //fetching parsed transaction
            let y = 0
            let yIncrement = 250
            while (y < reformattedArray.length) {

                loadingText =  y>0? "fetching data... " +  Math.round(y/reformattedArray.length*100) +"%" : "fetching data..."
                let array = await $cnx.getParsedTransactions(reformattedArray.slice(y,Math.min(y+yIncrement, reformattedArray.length)))
                $fetchedTransactions.push(array)
                console.log("incrementally fetching parsed ", y, reformattedArray.length)
                y += yIncrement
                

            }
            $fetchedTransactions = $fetchedTransactions.flat()
            //$fetchedTransactions = await connection.getParsedTransactions(reformattedArray)
            
            
            //console.log("fetched ", $fetchedTransactions.flatMap(s => s.transaction.signatures))
            //console.log("fetched ", $fetchedTransactions)
            loadingText = $showMetadata? "analyzing with metadata..." : "analyzing..."
            $showMetadata? startTime = $time.getSeconds() : null
            let owner = await $cnx.getAccountInfoAndContext(new web3.PublicKey(keyIn))

            for await (const item of $fetchedTransactions) {
              
                currentTransaction++
                let account_index = item.transaction.message?.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
                let programIDs: string[] = []
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
                        "token_name": "SOL",
                        "type": "Fees",
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
                        try {
                            await classif.classifyTransaction (item, $workingArray, $showMetadata, programIDs, account_index, keyIn, owner, feePayer, utl_api.content)
                        }
                        catch (e)
                        {
                            console.log("Failed to classify, ", e, item)
                        }
                        
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
            $currentPage = 1
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

    async function checkKey () {
        try {
            
           
            if (web3.PublicKey.isOnCurve($keyInput) == true) {
                if (!loading) {
                    
                    validKey = true
                    invalidKey = false
                    $currentPage = 1
                    loadingText = "initializing..."
                    fetchForAddress(new web3.PublicKey($keyInput))
                 
                    return true
                }
                
            } else {
                

                console.log("Key not on curve ")
                $loadedAddress = ""
                validKey = false
                invalidKey = true
                return false
          
            }

        } catch(e) {
            //sns check
            const { pubkey } = await getDomainKey($keyInput.toLowerCase());
            console.log(pubkey.toBase58())
            if (pubkey != undefined) {
                
                if (!loading && $keyInput != "") {
                    try {
                        const { registry, nftOwner } = await NameRegistryState.retrieve($cnx, pubkey);
                        $keyInput = nftOwner? nftOwner.toBase58() : registry.owner.toBase58()
                        if (web3.PublicKey.isOnCurve($keyInput) == true) {
                
                            if (!loading) {
                                
                                validKey = true
                                invalidKey = false
                                $currentPage = 1
                                loadingText = "initializing..."
                                fetchForAddress(new web3.PublicKey($keyInput))
                            
                                return true
                            }
                            
                        } else {
                            console.log("SNS Key not on curve " )
                            $loadedAddress = ""
                            $keyInput = ""
                            validKey = false
                            invalidKey = true
                            return false
                        }
                    }
                    catch (e) {
                        console.log("Error fetching SNS " )
                        $loadedAddress = ""
                        $keyInput = ""
                        validKey = false
                        invalidKey = true
                        return false
                    }
                    
                }
            }
            console.log("failed key")
            $loadedAddress = ""
            validKey = false
            invalidKey = true
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

//$: $keyInput != "" && $keyInput != $loadedAddress ? checkKey() : null
$: $showfailed, sliceDisplayArray()
$: $showfees, sliceDisplayArray(), !$showfees? $currentPage > totalPages? $currentPage = totalPages : $currentPage=$currentPage : $currentPage=$currentPage
$: $displayArray, sortArray($displayArray)
$: $textFilter, sliceDisplayArray(), $currentPage = 1
$: currentTransaction != 0? currentPercentage = "" + Math.round(currentTransaction/$fetchedTransactions.length*100) + "%" : ""
$: smallScreenCondition = innerWidth < 755

$: startTime? $time.getSeconds() - startTime > 15? showInfoTip = true : null : null
$: !validKey? $currentPage = 1 : $currentPage=$currentPage
$: $showMetadata? metadataText = "Token Metadata is On (loading can be slower)" : metadataText = "Token Metadata is Off (loading is faster)"
//$: (async() => $keyInput = await checkKey ())();

//$: start, end && $keyInput != "" ? checkKey() ? new web3.PublicKey($keyInput) : loading = false : (validKey = false, loading = false)
//<DateInput on:close={fetchAll} bind:value={start} closeOnSelection={true} format="yyyy-MM-dd" placeholder="2022-01-01" />   
// /<DateInput on:close={fetchAll} bind:value={end} closeOnSelection={true} format="yyyy-MM-dd" placeholder="2022-01-01" />
</script>

<svelte:window bind:innerWidth bind:innerHeight />


<div class="flex justify-center">
    
    
    <div class="pt-2 text-center ">
        <div class="grid grid-flow-col place-items-end ">
                  
                    <div class="md:tooltip md:tooltip-bottom z-50" data-tip="{metadataText}">                    
                        {#if loading}
                            <button on:click={metadataHandler} disabled class="btn btn-xs btn-ghost normal-case ">
                            {#if $showMetadata}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-current fill-transparent" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-transparent fill-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                            </svg>
                            {/if}
                            
                        </button>
                        {:else if metadataAnimation}
                        <button class="btn btn-xs btn-ghost normal-case font-serif ">
                            <svg class="animate-spin h-5 w-5 text-bg-neutral-content" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25 stroke-primary" cx="12" cy="12" r="10" stroke-width="4"></circle>
                                <path class="opacity-75 fill-primary" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg><span class = "pl-2">{metadataAnimText} </span>
                        </button>
                        {:else}
                            <button on:click={metadataHandler} class="btn btn-xs btn-ghost normal-case ">
                                {#if $showMetadata}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-current fill-transparent" viewBox="0 0 24 24" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-transparent fill-primary" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                                </svg>
                                {/if}
                                
                            </button>
                        {/if}
                        
                        
                    </div>
        
            
           
               
        
         
        </div>
        <div class="indicator z-5">
            <span class="indicator-item indicator-top indicator-end badge badge-ghost font-ros1">alpha</span>
            <h1 class="pb-2 font-rosu1 text-5xl text-center">DeBooks</h1>
        </div>
        
        
        {#if loading == false && rpcConnection == true}
        
        <div class="input-group justify-center">
            <input type="text" placeholder="enter account address e.g. DeDao..uw2r" bind:value={$keyInput} class=" text-center font-serif input input-sm input-bordered input-primary sm:w-96 w-64 " />
            {#if $keyInput != ""}
            <button class="btn btn-primary btn-sm btn-square" on:click={checkKey}>
                GO
                </button>
            {:else}
            <button disabled class="btn btn-sm btn-square">
                GO
                </button>
            {/if}
        </div>
            
        {:else if loading == true || rpcConnection == false}
        <div class="justify-center">
            <input type="text" placeholder="enter account address e.g. DeDao..uw2r" bind:value={$keyInput} disabled class=" text-center font-serif input input-sm input-bordered input-primary sm:w-96 w-64 " />
        </div>
        {/if}
        
        <p class="pt-2 text-lg font-serif font-bold text-center">Transaction Statement</p>
        
        <div class="flex flex-row text-sm font-serif justify-center">
            <span class="flex items-center pr-2">
                For the period
            </span>
            {#if loading == false}
                <input type="date" bind:value={start} min={firstDate} max={end} class="text-center bg-base-100 border border-primary rounded-md"/>
            {:else}
                <input type="date" disabled bind:value={start} max={end} class="text-center bg-base-100"/>
            {/if}
            
            <span class="flex items-center px-2 ">
                to
            </span>
            {#if loading == false}
                <input type="date" bind:value={end} min={start} max={new Date().toJSON().slice(0,10)} class="text-center bg-base-100 border border-primary rounded-md"/>
            {:else}
                <input type="date" disabled={true} bind:value={end} min={start} max={new Date().toJSON().slice(0,10)} class="text-center bg-base-100"/>
            {/if}
            
        </div>
        

       
        
    </div>
   
</div>

{#if validKey == true}

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
                    
            {/if}
                    
                    
                    
        </div>
        
        {#if $displayArray.length > 0}
            <table class="table table-compact normal-case ">
                
            <!-- head -->
            <thead>
                <tr class=" ">
                
                    <th class="min-w-[1rem] text-left normal-case">Date</th>
                    <th class="lg:min-w-[32rem] max-w-[32rem] min-w-[11rem]  text-left normal-case">Description</th>
                    {#if !smallScreenCondition}
                        <th class="min-w-[4rem] text-left normal-case">Ref</th>
                    {/if}
                    {#if !showConversion && !smallScreenCondition}
                        <th class="min-w-[4rem] max-w-[8rem] text-right normal-case">Base Ccy</th>
                    {:else if showConversion && !smallScreenCondition}
                        <th class="min-w-[4rem] max-w-[8rem] text-right normal-case">Base Ccy</th>
                        <th class="min-w-[4rem] max-w-[6rem] text-right normal-case">${$reportingCurrency}</th>
                    {:else if showConversion && smallScreenCondition}
                        <th class="min-w-[4rem] max-w-[6rem] text-right normal-case">${$reportingCurrency}</th>
                    {:else}
                        <th class="min-w-[4rem] max-w-[8rem] text-right normal-case">Base Ccy</th>
                    {/if}
                    <th class="min-w-[2rem]"></th>
                </tr>
            </thead>          
        
            <tbody>
                <!-- row 1 -->
                {#each $displayArray.slice(pageIncrement*($currentPage - 1), pageIncrement*($currentPage - 1) + pageIncrement) as transaction, i}
                    <!-- show everything -->
                    <tr class="">
                        {#if !smallScreenCondition}
                            <td class="min-w-[1rem] text-left">{dayjs.unix(transaction.timestamp).format('YYYY-MM-DD')}</td>
                        {:else}
                            <td class="min-w-[1rem] text-left">{dayjs.unix(transaction.timestamp).format('YY-M-D')}</td>
                        {/if}
                        <td class="whitespace-normal lg:min-w-[32rem] max-w-[32rem] min-w-[11rem] text-left">{transaction.description}</td>
                        {#if !smallScreenCondition}
                            <td class="min-w-[4rem] text-left">{transaction.signature.substring(0,4)}...</td>
                        {/if}
                        {#if !showConversion && !smallScreenCondition}
                        <td class="min-w-[2rem] max-w-[8rem] text-right">{transaction.amount?.toLocaleString('en-US', { maximumFractionDigits: 10 })}</td>
                        {:else if showConversion && !smallScreenCondition}
                        <td class="min-w-[2rem] max-w-[8rem] text-right">{transaction.amount?.toLocaleString('en-US', { maximumFractionDigits: 10 })}</td>
                            {#if convertingToReporting} 
                                <td class="min-w-[4rem] max-w-[6rem] text-right"><progress class="progress w-[2rem]"></progress></td>
                            {:else}
                                <td class="min-w-[4rem] max-w-[6rem]  text-right">{transaction.usd_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                            {/if}
                        {:else if showConversion && smallScreenCondition}
                            {#if convertingToReporting} 
                                <td class="min-w-[4rem] max-w-[6rem] text-right"><progress class="progress w-[2rem]"></progress></td>
                            {:else}
                                <td class="min-w-[4rem] max-w-[6rem]  text-right">{transaction.usd_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                            {/if}
                        {:else}
                        <td class="min-w-[2rem] max-w-[8rem] text-right">{transaction.amount?.toLocaleString('en-US', { maximumFractionDigits: 10 })}</td>
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
    </div>
    
</div>
    {#if $showMetadata && showInfoTip && false }
    <div class="flex justify-center flex-row">
        <div class="pt-10">
            <div class="alert shadow-lg font-serif">
                <div> 
                   
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-primary-focus flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   
                        <span>We're working on it - fetching metadata, particularly lots of NFTs data can feel slow</span>

                        
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
                    
                    {#if invalidKey == false}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-primary-focus flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <div>Enter a <span class="font-bold">Solana wallet</span> or <span class="font-bold">.sol</span> address to display records</div>
                  
                        
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-warning flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>Invalid key entered - Try again with a <span class="font-bold">Solana wallet</span> or <span class="font-bold">.sol</span> address</span>
                    {/if}
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 stroke-primary-focus" fill="none" viewBox="0 0 24 24"  stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                        <span>Establishing connection to network...</span>
                {/if}
            </div>
        </div>
    
    </div>

</div>

{/if}
{#if !loading}
<div class="flex justify-center flex-row pt-8">
    <footer class="footer footer-center p-2 text-base-content rounded-md">
        
        <div class="items-center grid-flow-col">
            <a href="https://twitter.com/defliction" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current hover:fill-primary"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
            </a>

        <p class="font-serif text-sm">DeBooks © 2022</p>
        </div>
    
    </footer>
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