<script lang='ts'>

    import { onMount, afterUpdate } from "svelte";
    import { apiData, keyList, fetchedTransactions, workingArray, fullArray, displayArray, keyInput, loadedAddress, showfailed, showfees, currentPage, textFilter, reportingCurrency, showMetadata, time, cnx, smallScreenCondition } from '../stores.js';
    import * as web3 from '@solana/web3.js';
    import dayjs from 'dayjs'
    import localizedFormat from 'dayjs/plugin/localizedFormat'
    import relativeTime from 'dayjs/plugin/relativeTime'

    import { Buffer } from 'buffer';
  
    import * as classif from "../utils/solana_classifier";
    import { getDomainKey, NameRegistryState } from "@bonfida/spl-name-service";

    import * as token from '@solana/spl-token';

    import { themeChange } from 'theme-change'
	import Statement from "./statement.svelte";
 

    dayjs.extend(localizedFormat)
    dayjs.extend(relativeTime)
   
    let fetchLimit = 250
    let loading = false;
    let darkMode = false;
    let firstUpdate = false;
    let activeChain = "Solana"
    let enableAptos = false
    let enableSui = false
    let fetchingMulti = false
    let fetchedTransDicts = []

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
 
    let loadingText = "initializing..."
    let multiText = ""
    let metadataText = "Metadata On - Toggle off for faster loading without fetching NFT names etc..."
    let rpcConnection = false
    //let deDaoKey = new web3.PublicKey('DeDaoX2A3oUFMddqkvMAU2bBujo3juVDnmowg4Tyuw2r')
    let startTime: number;
    let showInfoTip = false
    let invalidKey = false;

    //let blockcnx = new web3.Connection("https://solana-mainnet.g.alchemy.com/v2/AtE9_yJOMYOrEYcu5EpkPPvEv-jVKafC");
    let blockcnx = new web3.Connection("https://solitary-young-butterfly.solana-mainnet.quiknode.pro/73898ef123ae4439f244d362030abcda8b8aa1e9/");
    //https://solana-mainnet.g.alchemy.com/v2/AtE9_yJOMYOrEYcu5EpkPPvEv-jVKafC
    //const connection = new web3.Connection("https://ssc-dao.genesysgo.net");
    //$cnx = new web3.Connection("https://solana-mainnet.g.alchemy.com/v2/AtE9_yJOMYOrEYcu5EpkPPvEv-jVKafC");
    $cnx = new web3.Connection("https://solitary-young-butterfly.solana-mainnet.quiknode.pro/73898ef123ae4439f244d362030abcda8b8aa1e9/");
    //const metap = new Metaplex($connection)
    //const mx = Metaplex.make($cnx);
    //let mx
    afterUpdate(() => {
		// secondary CSS variable gives you HSL values
		if (!firstUpdate) {
            if (getComputedStyle(document.querySelector(':root')).getPropertyValue('--s') == "0 2% 20%") {
            //console.log("FOUND THEME")
            if (!darkMode) {
                darkMode = true
            }
                
        }
        else if (getComputedStyle(document.querySelector(':root')).getPropertyValue('--s') == "338 71% 78%") {
            //console.log("FOUND THEME")
            if (darkMode) {
                darkMode = false
            }
                
        }
        firstUpdate = true
        }
        
	});

    onMount(async () => {
       //await fetchAll()
        console.log("START - starting logs")
        themeChange(false)
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
        //console.log("first date", firstDate)
        //first blocktimed block - 38669748
        let trans1 = await $cnx.getParsedTransaction("5GkGQBbWgfgFwZD8mhYaVMrNGEkX39Vqvc2w1CnpvA1gy7V6TzP1fpUVf88Cku8CJe9JXrxsBHGKSYXWoPniw9wJ")
        
        
        console.log (trans1)
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
        //console.log("latest date ", storedCoinGeckoData[0])
        //fetch historics manually
        
        //console.log(rpcConnection)
        //await interpolateBlockSignatures()
        console.log("END - starting logs")
    });
    
    const sleep = (milliseconds:number) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

 
    async function interpolateBlockSignatures() {
        
        let latestBlockhash =  await blockcnx.getLatestBlockhashAndContext()
        console.log("slot", latestBlockhash.context.slot)

        let slotIncrements = 500000

        let topSlot;
        let endBlockTime;
        try {
            topSlot = latestBlockhash.context.slot
            endBlockTime =  await blockcnx.getBlockTime(topSlot)
        }
        catch (e) {
            topSlot = latestBlockhash.context.slot-50
            endBlockTime =  await blockcnx.getBlockTime(topSlot)
            console.log("failed to get block time")
        }
        let endSignature;
        let startSignature;
        
        
        //starting with the right starting point; then increment downwards
        let biggerIncrements = 100000
        let smallerIncrements = 25000
        //topSlot -= firstIncrement
        loadingText = "optimizing retrieval..."
        //let endTimeDiff = (dayjs.unix(endBlockTime).diff(endday, 'hours'))
        
        
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
                endBlockTime = await blockcnx.getBlockTime(topSlot)
                //loadingText = "optimizing retrieval..." + (1-(dayjs.unix(endBlockTime).diff(endday, 'hours'))/endTimeDiff)
                //console.log("a1 ", dayjs.unix(endBlockTime).format("DD-MM-YYYY"), endday.format("DD-MM-YYYY"), (dayjs.unix(endBlockTime).diff(endday, 'hours')))
                loadingText = "optimizing retrieval 1/2..." //+ Math.round((1-((dayjs.unix(endBlockTime).diff(endday, 'hours'))/endTimeDiff))*100)+"%"
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
                            endBlockTime = await blockcnx.getBlockTime(topSlot)
                            loadingText = "optimizing retrieval 1/2..." //+ Math.round((1-((dayjs.unix(endBlockTime).diff(endday, 'hours'))/endTimeDiff))*100)+"%"
                            //console.log("a2 ", dayjs.unix(endBlockTime).format("DD-MM-YYYY"), endday.format("DD-MM-YYYY"), (dayjs.unix(endBlockTime).diff(endday, 'hours')), (dayjs.unix(endBlockTime).diff(endday, 'hours')) > 0)
                        }
                        catch (e) {
                            console.log("error in interpolate 1b", e)
                        }
                    }
                    let sigs = await blockcnx.getBlockSignatures(topSlot)
                    endSignature = sigs.signatures[0]
                    console.log("END BLOCK SIG1 ", sigs.signatures[0], dayjs.unix(endBlockTime))
                    break end_loop
                    
                }
                else if ((dayjs.unix(endBlockTime).diff(endday, 'hours')) < 6 && (dayjs.unix(endBlockTime).diff(endday, 'hours')) > 0) {
                    let sigs = await blockcnx.getBlockSignatures(topSlot)
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
        //let startTimeDiff = (dayjs.unix(endBlockTime).diff(startday, 'hours'))
        
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
                startBlocktime = await blockcnx.getBlockTime(startSlot)
                loadingText = "optimizing retrieval 2/2..." //+ Math.round((1-(-(dayjs.unix(startBlocktime).diff(endday, 'hours'))/startTimeDiff-1))*100)+"%"
                //console.log(-(dayjs.unix(startBlocktime).diff(endday, 'hours')), startTimeDiff)
                if (dayjs.unix(startBlocktime).diff(startday, 'hours') <= -8 && startBlocktime != null) {
                    while ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < -8) {
                        
                        if ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < -48) {
                            
                            startSlot += Math.floor(biggerIncrements  * -(dayjs.unix(startBlocktime).diff(startday, 'hours'))/24 )
                        }
                        else {
                            startSlot += smallerIncrements
                        }

                        try {
                            //console.log("b2b ", dayjs.unix(startBlocktime).format("DD-MM-YYYY"), startday.format("DD-MM-YYYY"), (dayjs.unix(startBlocktime).diff(startday, 'hours')), startSlot)
                            startBlocktime = await blockcnx.getBlockTime(startSlot)
                            //console.log(-(dayjs.unix(startBlocktime).diff(endday, 'hours')), startTimeDiff)
                            loadingText = "optimizing retrieval 2/2..." //+ Math.round((1-(-(dayjs.unix(startBlocktime).diff(endday, 'hours'))/startTimeDiff-1))*100)+"%"
                        }
                        catch (e) { 
                            console.log("error in interpolate 2b",  e)
                        }
                       
                    }
                    let sigs = await blockcnx.getBlockSignatures(startSlot)
                    startSignature = sigs.signatures[0]
                    console.log("START BLOCK SIG1 ", sigs.signatures[0], dayjs.unix(startBlocktime))
                    //break start_loop

                }
                else if ((dayjs.unix(startBlocktime).diff(startday, 'hours')) < 0 && (dayjs.unix(startBlocktime).diff(startday, 'hours')) > -8 && startBlocktime != null) {
                    let sigs = await blockcnx.getBlockSignatures(startSlot)
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

    async function metadataHandler() {
        $showMetadata = !$showMetadata
        if (showMetadata && !loading && $fetchedTransactions.length > 0) {
            loading = true
            metadataAnimation = true
            metadataAnimText = ""
            $fullArray = []
            for await (const key_item of $keyList) {
                
                await classifyArray (key_item.key)
            }
            
            sliceDisplayArray()
            loading = false
            metadataAnimation = false
        }   
        
    }

    async function classifyArray (keyIn) {
        
        let response = await fetch("https://token-list-api.solana.cloud/v1/list");
        let utl_api = await response.json()
        $workingArray = []
        
        loadingText = $showMetadata? "analyzing with metadata..." : "analyzing..."
        $showMetadata? startTime = $time.getSeconds() : null
        let owner = await $cnx.getAccountInfoAndContext(new web3.PublicKey(keyIn))
        let txn = 0

        let findArray = fetchedTransDicts.filter(k => k.key == keyIn).flatMap(t => t.txns)
        for await (const item of findArray) {
            txn += 1
           

            let account_index = item.transaction.message?.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn)
            let programIDs: string[] = []
            item.transaction.message.instructions.forEach(function (program) {
                
                programIDs.push(program.programId.toBase58())
            })
            
            if (true) {
                //console.log("programIDs ", programIDs, item)
                //only classify successful transactions!
                //MAGIC EDEN TRANSACTIONS >>
                if (item != null || item != undefined) {
                    try {
                        await classif.classifyTransaction (item, $workingArray, $showMetadata, programIDs, account_index, new web3.PublicKey(keyIn), owner, utl_api.content)
                    }
                    catch (e)
                    {
                        console.log("Failed to classify, ", e, item)
                    }
                    
                }
                
            }
            metadataAnimText = "" + Math.min(99,Math.round(txn/findArray.length*100))+"%"
            
        }  
        //console.log("printing cleaned array")
        //console.log($cleanedArray)
        //console.log("printing working array")
        //.log($workingArray)
        startTime = null
        showInfoTip = false
        $workingArray = $workingArray
        sortArray($workingArray)
        $fullArray.push($workingArray)
        //$currentPage = 1
        //totalPages = Math.ceil($displayArray.length/pageIncrement)
       
        
    }
    export async function fetchForAllAddresses () {
        console.log("TEST")
        let iterator = 0
        fetchingMulti = true
        fetchedTransDicts = []
        $fullArray = []
        $displayArray = []
        for await (const key_item of $keyList) {
            iterator ++
            key_item.loading = true
            $keyList = $keyList
            multiText = "Wallet " + iterator + "/" + $keyList.length + " "
            console.log("Fetching key ", key_item.key)
            await fetchForAddress(new web3.PublicKey(key_item.key))
            key_item.loading = false
            $keyList = $keyList
            
        }
        fetchingMulti = false
    }
    async function fetchForAddress (keyIn) {
    
      
        $currentPage = 1
        $apiData =[]
        $workingArray = []
        //$displayArray = []
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
            //if (utl_api.content.flatMap(s => s.address).indexOf(account.account.data.parsed.info.mint) !== -1) {
                account_list.push(account.pubkey)
                
                //console.log("adding mint ", account.pubkey.toBase58() )
                //signatures.push((await $cnx.getSignaturesForAddress(account.pubkey, {limit:fetchLimit,before:signatureBracket[1], until:signatureBracket[0]}))[0]);
            //}
        }
        
        let signatures = []
        account_list = account_list.flat()
        loadingText = "pre-fetch..."
        
        let position = 0;
        let batchSize = 200;
        while (position < account_list.length) {
            const itemsForBatch = account_list.slice(position, position + batchSize);
            await Promise.all(itemsForBatch.map(async (account) => {
        
                loadingText = "pre-fetch... " + Math.round(account_list.indexOf(account)/account_list.length*100)+"%"
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
                        loadingText = "pre-fetch... " + Math.round(account_list.indexOf(account)/account_list.length*100)+"%" + " (" + Math.min(Math.round(firstLastday.diff(lastday, 'hours')/firstLastday.diff(startday, 'hours')*100,0),100) +"%)"
                        lastsig = await loopsigs[loopsigs.length - 1].signature
                        signatures.push(loopsigs)
                        //console.log("signatures ", lastday.format("DD-MM-YYY"), startday.format("DD-MM-YYYY"), endday.format("DD-MM-YYYY"), endday.diff(lastday, 'hours'), endday.diff(startday, 'hours'), endday.diff(lastday, 'hours')/endday.diff(startday, 'hours'))
                    }
                    catch (e) {
                        console.log("Error in loopsigs", e)
                        //await sleep(500) //wait 0.5 seconds
                    }
                }

            }));
            position += batchSize;
        }
       
        //console.log("array1", array1)

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
                


                if (true) {
                    //console.log("programIDs ", programIDs, item)
                    //only classify successful transactions!
                    //MAGIC EDEN TRANSACTIONS >>
                    if (item != null || item != undefined) {
                        try {
                            await classif.classifyTransaction (item, $workingArray, $showMetadata, programIDs, account_index, keyIn, owner, utl_api.content)
                        }
                        catch (e)
                        {
                            console.log("Failed to classify, ", e, item)
                        }
                        
                    }
                    
                }
            }
            var new_txns = {
                "key" : keyIn,
                "txns": $fetchedTransactions
            }
            fetchedTransDicts.push(new_txns)
            //console.log("printing cleaned array")
            //console.log($cleanedArray)
            //console.log("printing working array")
            //.log($workingArray)
            startTime = null
            showInfoTip = false
            $workingArray = $workingArray
            sortArray($workingArray)
            $fullArray.push($workingArray)
            
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
        //$displayArray = $workingArray
        console.log($fullArray.flat())
        $displayArray = $fullArray.flat()
        let activeKeys = $keyList.filter(k => k.active).flatMap(k=>k.key)
        console.log("active keys ", activeKeys)
        $displayArray = $displayArray.filter(transaction => activeKeys.includes(transaction.key))
        //$keyList.filter(k => k.active).flatMap(k=>k.key).includes(transaction.key)
        //$keyList.filter(k => k.active).flatMap(k=>k.key)
        // && $keyList.filter(k => k.active == true).flatMap(k=>k.key).includes(transaction.key)
        if ($showfees && $showfailed) {
            
            $displayArray = $displayArray.filter(transaction => transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.signature.toLowerCase().includes($textFilter.toLowerCase()) )
            //console.log("showfees && showfailed")
        }
        else if ($showfees && !$showfailed) {
            //default
            
            let testArray = $displayArray.filter(transaction => transaction.success == true && transaction.description.toLowerCase().includes($textFilter.toLowerCase())  || transaction.success == true && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
           

            $displayArray = $displayArray.filter(transaction => testArray.flatMap(txn => txn.signature).includes(transaction.signature) )
            //$displayArray = $workingArray.filter(transaction => transaction.success == true && transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.success == true && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            //console.log("showfees && !showfailed")
        }
        else if (!$showfees && $showfailed) {
            //$displayArray = $workingArray.filter(transaction => transaction.description.substring(0,3) != "Txn" && transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.description.substring(0,3) != "Txn" && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            let testArray = $displayArray.filter(transaction => transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            $displayArray = $displayArray.filter(transaction => testArray.flatMap(txn => txn.signature).includes(transaction.signature) && transaction.description.substring(0,3) != "Txn")
            //console.log("!showfees && showfailed")
        }
        else if (!$showfees && !$showfailed) {
            //$displayArray = $workingArray.filter(transaction => transaction.success == true && transaction.description.substring(0,3) != "Txn" && transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.success == true && transaction.description.substring(0,3) != "Txn" && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            let testArray = $displayArray.filter(transaction => transaction.success == true && transaction.description.toLowerCase().includes($textFilter.toLowerCase()) || transaction.success == true && transaction.signature.toLowerCase().includes($textFilter.toLowerCase()));
            $displayArray = $displayArray.filter(transaction => testArray.flatMap(txn => txn.signature).includes(transaction.signature) && transaction.description.substring(0,3) != "Txn" )
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

    async function checkKey (multi:boolean) {
        try {
            $keyInput = $keyInput.trim()
           
            if (web3.PublicKey.isOnCurve($keyInput) == true) {
                validKey = true
                invalidKey = false
                $currentPage = 1
                if (!loading && !multi) {
                    
                    
                    loadingText = "checking address..."
                    loading = true
                    $displayArray = []
                    !multi? fetchForAddress(new web3.PublicKey($keyInput)) : null
                 
                    return true
                }
                var key_item = 
			    {
                    "key": $keyInput,
				    "active": "true", 
                    "loading": false,
                }
                multi && !$keyList.flatMap(item => item.key).includes(key_item.key) ? $keyList.push(key_item) : null
                console.log($keyList)
                console.log($keyList.filter(k => k.active).flatMap(k=>k.key))
                $keyList = $keyList
                return true
            } else {
                console.log("Key not on curve ")
                $loadedAddress = ""
                validKey = false
                invalidKey = true
                loading = false
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
                            validKey = true
                            invalidKey = false
                            if (!loading && !multi) {
                                
                                
                                $currentPage = 1
                                
                                loadingText = "initializing..."
                                loading = true
                                $displayArray = []
                                !multi? fetchForAddress(new web3.PublicKey($keyInput)) : null
                            
                                return true
                            }
                            var key_item = 
                            {
                                "key": $keyInput,
                                "active": "true", 
                                "loading": false,
                            }
                            multi && !$keyList.flatMap(item => item.key).includes(key_item.key)? $keyList.push(key_item) : null
                            console.log($keyList)
                            console.log($keyList.filter(k => k.active).flatMap(k=>k.key))
                            $keyList = $keyList
                            return true
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

    function onKeyDown(e) {
		 switch(e.keyCode) {
			 case 13:
				 checkKey(false)
				 break;
			 
		 }
	}

//$: $keyInput != "" && $keyInput != $loadedAddress ? checkKey() : null
$: $showfailed, sliceDisplayArray()
$: $showfees, sliceDisplayArray(), !$showfees? $currentPage > totalPages? $currentPage = totalPages : $currentPage=$currentPage : $currentPage=$currentPage
$: $displayArray, sortArray($displayArray)
$: $textFilter, sliceDisplayArray(), $currentPage = 1
$: currentTransaction != 0? currentPercentage = "" + Math.round(currentTransaction/$fetchedTransactions.length*100) + "%" : ""
$: $smallScreenCondition = innerWidth < 755

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
        <div class="grid grid-cols-8 gap-1 pt-1">
            <div class="col-start-1 col-span-1">
                <div class="md:tooltip md:tooltip-bottom z-50" data-tip="Toggle Dark Mode">  
                    <button data-toggle-theme="light,black" on:click={()=> darkMode = !darkMode} class="btn btn-xs btn-ghost normal-case " >
                    {#if darkMode}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                    {:else if !darkMode}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>                                  
                    {/if}
                    </button> 
                </div>
            </div>
            <div class ="col-start-2 col-span-3">
                <div class="btn-group ">
                    <div class="md:tooltip md:tooltip-bottom z-50" data-tip={activeChain.toString()}>
                    {#if activeChain == "Solana"}
                        <button class="btn btn-ghost btn-xs" on:click={() => activeChain = "Solana"}>
                        
                            <svg width="101" height="88" viewBox="0 0 101 88" xmlns="http://www.w3.org/2000/svg" class='w-4 h-4'>
                            <path fill="#9945FF" d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z" />
                            
                            </svg>
                        </button>
                    {:else}
                    <button class="btn btn-ghost bg-base-300 btn-xs hover:bg-stone-300" on:click={() => activeChain = "Solana"}>
                        
                        <svg width="101" height="88" viewBox="0 0 101 88" fill="none" xmlns="http://www.w3.org/2000/svg" class='w-4 h-4 fill-base-content '>
                        <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z" />
                        <linearGradient id="paint0_linear_174_4403" x1="8.52558" y1="90.0973" x2="88.9933" y2="-3.01622" gradientUnits="userSpaceOnUse">
                            <stop offset="0.08" stop-color="#9945FF"/>
                            <stop offset="0.3" stop-color="#8752F3"/>
                            <stop offset="0.5" stop-color="#5497D5"/>
                            <stop offset="0.6" stop-color="#43B4CA"/>
                            <stop offset="0.72" stop-color="#28E0B9"/>
                            <stop offset="0.97" stop-color="#19FB9B"/>
                            </linearGradient>
                        </svg>
                    </button>
                    {/if}
                    </div>
                    {#if activeChain == "Aptos" && enableAptos}
                        <button class="btn btn-disabled bg-base-primary btn-xs " on:click={() => activeChain = "Aptos"}>
                        
                            <svg width="100%" height="100%" version="1.2" baseProfile="tiny" class="w-4 h-4 fill-base-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" overflow="visible" xml:space="preserve">
                                <path d="M86.6 37.4h-9.9c-1.1 0-2.2-.5-3-1.3l-4-4.5c-1.2-1.3-3.1-1.4-4.5-.3l-.3.3-3.4 3.9c-1.1 1.3-2.8 2-4.5 2H2.9C1.4 41.9.4 46.6 0 51.3h51.2c.9 0 1.8-.4 2.4-1l4.8-5c.6-.6 1.4-1 2.3-1h.2c.9 0 1.8.4 2.4 1.1l4 4.5c.8.9 1.9 1.4 3 1.4H112c-.4-4.7-1.4-9.4-2.9-13.8H86.6zM53.8 65l-4-4.5c-1.2-1.3-3.1-1.4-4.5-.3l-.3.3-3.5 3.9c-1.1 1.3-2.7 2-4.4 2H.8c.9 4.8 2.5 9.5 4.6 14h25.5c.9 0 1.7-.4 2.4-1l4.8-5c.6-.6 1.4-1 2.3-1h.2c.9 0 1.8.4 2.4 1.1l4 4.5c.8.9 1.9 1.4 3 1.4h56.6c2.1-4.4 3.7-9.1 4.6-14H56.8c-1.2 0-2.3-.5-3-1.4zm19.6-43.6 4.8-5c.6-.6 1.4-1 2.3-1h.2c.9 0 1.8.4 2.4 1l4 4.5c.8.9 1.9 1.3 3 1.3h10.8c-18.8-24.8-54.1-29.7-79-11-4.1 3.1-7.8 6.8-11 11H71c1 .2 1.8-.2 2.4-.8zM34.7 94.2c-1.2 0-2.3-.5-3-1.3l-4-4.5c-1.2-1.3-3.2-1.4-4.5-.2l-.2.2-3.5 3.9c-1.1 1.3-2.7 2-4.4 2h-.2C36 116.9 71.7 118 94.4 96.7c.9-.8 1.7-1.7 2.6-2.6H34.7z"></path>
                            </svg>
                        </button>
                    {:else if enableAptos}
                    <button class="btn btn-disabled btn-ghost bg-base-300 btn-xs hover:bg-stone-300 " on:click={() => activeChain = "Aptos"}>
                        
                        <svg width="100%" height="100%" version="1.2" baseProfile="tiny" class="w-4 h-4 fill-base-content " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" overflow="visible" xml:space="preserve">
                            <path d="M86.6 37.4h-9.9c-1.1 0-2.2-.5-3-1.3l-4-4.5c-1.2-1.3-3.1-1.4-4.5-.3l-.3.3-3.4 3.9c-1.1 1.3-2.8 2-4.5 2H2.9C1.4 41.9.4 46.6 0 51.3h51.2c.9 0 1.8-.4 2.4-1l4.8-5c.6-.6 1.4-1 2.3-1h.2c.9 0 1.8.4 2.4 1.1l4 4.5c.8.9 1.9 1.4 3 1.4H112c-.4-4.7-1.4-9.4-2.9-13.8H86.6zM53.8 65l-4-4.5c-1.2-1.3-3.1-1.4-4.5-.3l-.3.3-3.5 3.9c-1.1 1.3-2.7 2-4.4 2H.8c.9 4.8 2.5 9.5 4.6 14h25.5c.9 0 1.7-.4 2.4-1l4.8-5c.6-.6 1.4-1 2.3-1h.2c.9 0 1.8.4 2.4 1.1l4 4.5c.8.9 1.9 1.4 3 1.4h56.6c2.1-4.4 3.7-9.1 4.6-14H56.8c-1.2 0-2.3-.5-3-1.4zm19.6-43.6 4.8-5c.6-.6 1.4-1 2.3-1h.2c.9 0 1.8.4 2.4 1l4 4.5c.8.9 1.9 1.3 3 1.3h10.8c-18.8-24.8-54.1-29.7-79-11-4.1 3.1-7.8 6.8-11 11H71c1 .2 1.8-.2 2.4-.8zM34.7 94.2c-1.2 0-2.3-.5-3-1.3l-4-4.5c-1.2-1.3-3.2-1.4-4.5-.2l-.2.2-3.5 3.9c-1.1 1.3-2.7 2-4.4 2h-.2C36 116.9 71.7 118 94.4 96.7c.9-.8 1.7-1.7 2.6-2.6H34.7z"></path>
                        </svg>
                    </button>
                    {/if}
                    {#if activeChain == "Sui" && enableSui}
                        <button class="btn btn-disabled bg-base-primary btn-xs " on:click={() => activeChain = "Sui"}>
                            <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" class="w-4 h-4 fill-base-100">
                            
                                <path d="M1.8611,33.0541a13.6477,13.6477,0,0,0,23.7778,0,13.89,13.89,0,0,0,0-13.8909L15.1824.8368a1.6444,1.6444,0,0,0-2.8648,0L1.8611,19.1632A13.89,13.89,0,0,0,1.8611,33.0541ZM10.8044,9.5555,13.0338,5.648a.8222.8222,0,0,1,1.4324,0L23.043,20.68a10.8426,10.8426,0,0,1,.8873,8.8828,9.4254,9.4254,0,0,0-.4388-1.4586c-1.1847-3.0254-3.8634-5.36-7.9633-6.9393-2.8187-1.0819-4.618-2.6731-5.3491-4.73C9.2375,13.7848,10.221,10.8942,10.8044,9.5555ZM7.0028,16.2184,4.457,20.68a10.8569,10.8569,0,0,0,0,10.8582,10.6776,10.6776,0,0,0,16.1566,2.935,7.5061,7.5061,0,0,0,.0667-5.2913c-.87-2.1858-2.9646-3.9308-6.2252-5.1876-3.6857-1.4147-6.08-3.6233-7.1157-6.5625A9.297,9.297,0,0,1,7.0028,16.2184Z" style="fill-rule:evenodd" />
                            </svg>
                        </button>
                    {:else if enableSui}
                    <button class="btn btn-disabled btn-ghost bg-base-300 btn-xs  hover:bg-stone-300 " on:click={() => activeChain = "Sui"}>
                        <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" class="w-4 h-4 fill-base-content ">
                            
                            <path d="M1.8611,33.0541a13.6477,13.6477,0,0,0,23.7778,0,13.89,13.89,0,0,0,0-13.8909L15.1824.8368a1.6444,1.6444,0,0,0-2.8648,0L1.8611,19.1632A13.89,13.89,0,0,0,1.8611,33.0541ZM10.8044,9.5555,13.0338,5.648a.8222.8222,0,0,1,1.4324,0L23.043,20.68a10.8426,10.8426,0,0,1,.8873,8.8828,9.4254,9.4254,0,0,0-.4388-1.4586c-1.1847-3.0254-3.8634-5.36-7.9633-6.9393-2.8187-1.0819-4.618-2.6731-5.3491-4.73C9.2375,13.7848,10.221,10.8942,10.8044,9.5555ZM7.0028,16.2184,4.457,20.68a10.8569,10.8569,0,0,0,0,10.8582,10.6776,10.6776,0,0,0,16.1566,2.935,7.5061,7.5061,0,0,0,.0667-5.2913c-.87-2.1858-2.9646-3.9308-6.2252-5.1876-3.6857-1.4147-6.08-3.6233-7.1157-6.5625A9.297,9.297,0,0,1,7.0028,16.2184Z" style="fill-rule:evenodd" />
                        </svg>
                    </button>
                    {/if}
                </div>
            </div>
            <div class="col-end-8 col-span-1">  
                <div class="md:tooltip md:tooltip-bottom z-50" data-tip="Multi wallet list">
                    <div class="indicator ">                
                        
                    {#if $keyList.length > 0 }
                    <span class="indicator-item indicator-top badge badge-sm badge-primary">{$keyList.length}</span> 
                        
                        <div class="dropdown dropdown-end">
                            <label tabindex="0" class="btn btn-xs btn-ghost normal-case "> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="w-5 h-5 stroke-current fill-transparent">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                            </svg></label>
                            <div tabindex="0" class="dropdown-content">
                                <div class="card card-compact z-55 ">
                                    {#if $keyList.length > 0 }
                                    <table class="table table-compact normal-case">
                                        <thead >
                                            <tr class=" ">
                                                <th class="min-w-[2rem] text-left text-sm normal-case">#</th>
                                                <th class="min-w-[8rem] text-left text-sm normal-case">Address</th>
                                                <th class="min-w-[4rem] text-center text-sm normal-case">Show</th>
                                                <th class="min-w-[4rem] text-center text-sm normal-case">Status</th>
                                                {#if fetchingMulti && loading}
                                                    <th class="text-right text-sm normal-case "><button class="btn btn-primary btn-sm p-1 disabled" ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                                      </svg></button></th>
                                                {:else}
                                                    <th class="text-right text-sm normal-case "><button class="btn btn-primary btn-sm p-1 normal-case" on:click={fetchForAllAddresses}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                                      </svg></button></th>
                                                {/if}  
                                                
                                            </tr>
                                        </thead>
                                        
                                        <tbody>
                                            {#each $keyList as item, i}
                                            <tr class="">
                                                <td class="min-w-[2rem] text-left text-xs normal-case">{i+1}</td>
                                                <td class=" min-w-[8rem] text-left text-xs">{item.key.substring(0,4)}...{item.key.substring(item.key.length-4,item.key.length)}</td>
                                                <td class=" min-w-[4rem] text-center text-xs"><input type="checkbox" on:click={sliceDisplayArray} bind:checked={item.active} on:change={sliceDisplayArray} class="checkbox checkbox-sm" /></td>
                                                {#if item.loading}
                                                    <td class=" min-w-[4rem] justify-center text-xs">
                                                    <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-bg-neutral-content" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    </td>
                                                {:else}
                                                    <td class=" min-w-[4rem] text-center text-xs">ready</td>
                                                {/if}
                                                
                                                <td class=" min-w-[4rem] text-right text-xs"><button class="btn btn-ghost btn-xs min-w-[2rem]" on:click={()=> ($keyList.splice(i,1), $keyList=$keyList)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="w-4 h-4 stroke-primary">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                      </svg>
                                                    </button></td>
                                            </tr>
                                            {/each}
                                        </tbody>
                                        <tfoot>
                                            <tr class="e">
                                                <th class=" text-left text-sm normal-case"></th>
                                                {#if loading}
                                                    <th class="min-w-[8rem] text-left text-sm normal-case">{multiText}{loadingText}{currentPercentage}</th>
                                                    <th class="  text-left text-sm normal-case"></th>
                                                <th class=" text-left text-sm normal-case"></th>
                                                <th class="text-left text-sm normal-case"></th>
                                                {:else}
                                                <th class=" text-left text-sm normal-case"></th>
                                                <th class="min-w-[8rem] text-left text-sm normal-case"></th>
                                                <th class="min-w-[4rem] text-left text-sm normal-case"></th>
                                                <th class="min-w-[4rem] text-left text-sm normal-case"></th>
                                                <th class="text-left text-sm normal-case"></th>
                                                {/if}
                                                
                                                
                                            </tr>
                                          </tfoot>
                                      
                                    </table>
                                    {/if}
                                </div>
                            </div>
                        </div>
                        
                     
                    {/if}
                    
                </div>    
                </div>
            </div>
            <div class="col-end-9 col-span-1">  
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
                    <button class="btn btn-xs btn-ghost normal-case font-serif cursor-default">
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

        </div>
        
        <div class="indicator z-5">
            
            <label class="indicator-item indicator-top indicator-end badge badge-ghost font-ros1 modal-button normal-case hover:cursor-pointer hover:btn-primary" for="my-modal-6">beta</label>
            <h1 class="sm:pt-1 pb-2 font-rosu1 text-5xl text-center">DeBooks</h1>
        </div>
        
        
        {#if loading == false && rpcConnection == true}
        
        <div class="input-group justify-center">
            {#if $keyInput != ""}
           
            <button class="btn btn-primary btn-sm btn-square md:tooltip md:tooltip-bottom normal-case" data-tip="Add address to list" on:click={() => checkKey(true)}>+</button>
            
            {/if}
            <input type="text" placeholder="enter account address e.g. DeDao..uw2r" on:keydown={onKeyDown} bind:value={$keyInput} class=" text-center font-serif input input-sm input-bordered input-primary sm:w-96 w-64 " />
            
            {#if $keyInput != "" }
            <button class="btn btn-primary btn-sm btn-square md:tooltip md:tooltip-bottom normal-case" data-tip="Fetch transaction history" on:click={() => checkKey(false)}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 pl-1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              </button>
            {:else}
            <button disabled class="btn btn-sm btn-square"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 pl-1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
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
<div class="flex justify-center font-serif  ">
    
    {#if loading}
    <div class="flex justify-center flex-row">
        <p class="pt-4 justify-center">
            <span class="font-serif font-medium badge badge-lg ">
                <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-bg-neutral-content" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>{multiText}{loadingText} {currentPercentage}</span> 
        </p>
    </div>
    
    {:else}
    <Statement startday={startday} endday={endday} />

    {/if}

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
</div>
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

        <p class="font-serif text-sm">DeBooks © 2022 - built by <a class="hover:underline hover:decoration-primary" href="https://www.riparian.one">Riparian</a></p>
        </div>
    
    </footer>
</div>
{/if}
<input type="checkbox" id="my-modal-6" class="modal-toggle" />
<div class="modal modal-bottom sm:modal-middle">
  <div class="modal-box relative">
    <label for="my-modal-6" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
    <h3 class="font-bold text-lg">DeBooks Roadmap SS23</h3>
    <div class="prose">
        <em class="text-sm pb-2">last updated: November 2022</em>
        <h4>Feature priority roadmap:</h4>
        <ul class="list-disc leading-4">
            <li class="line-through">Classification engine V2</li>
            <li>(Ongoing) Additional protocol integrations</li> 
            <li>Solana Mobile Stack / Saga native app</li>
            <li>Support for multiple addresses</li>
            <li>xNFT integration</li> 
            <li>Insights & Reporting</li>
            <li>Automated audit reporting</li>
            <li>Multi chain</li>
            <li>(Ongoing) UI & UX improvements</li>
        </ul>
        <blockquote><p>It always seems impossible until it’s done.</p>Nelson Mandela </blockquote>
        <span>Contact <a href="https://twitter.com/defliction" target="_blank">@defliction</a> on Twitter or mail <a href="mailto:hello@riparian.one?subject=DeBooks">hello@riparian.one</a> to submit feature requests or just say hello</span>
    </div>
    
  </div>
</div>

<input type="checkbox" id="my-modal-6" class="modal-toggle" />
<div class="modal modal-bottom sm:modal-middle">
    
  <div class="modal-box prose">
    <label for="my-modal-6" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
    
    
  </div>
</div>

<svelte:head>
    <title>DeBooks - Dynamic Transaction Statements</title>
</svelte:head>


