<script lang='ts'>
    import { onMount } from "svelte";
    import { create } from "json-aggregate"
    import { apiData, currentFetch, workingArray } from '../stores.js';
    import * as web3 from '@solana/web3.js';
    import dayjs from 'dayjs'
    import localizedFormat from 'dayjs/plugin/localizedFormat'
    import relativeTime from 'dayjs/plugin/relativeTime'
    import Number from "../utils/Number.svelte";
    
    dayjs.extend(localizedFormat)
    dayjs.extend(relativeTime)


    let allData = []
    let loopNumber = 0;
   
    let fetchLimit = 250
    let loading = false;

    let start = new Date(2022,5,25)
    var startday = dayjs(start)
    let end = new Date(2022,6,7)
    var endday = dayjs(end)
    let deDaoKey = new web3.PublicKey('DeDaoX2A3oUFMddqkvMAU2bBujo3juVDnmowg4Tyuw2r')
    /*
    const connection = new web3.Connection(
                web3.clusterApiUrl('mainnet-beta'),
                'confirmed',
            );*/

    $: roya = $workingArray.filter(transaction => transaction.transaction.message.instructions[0].program == "system" && transaction.transaction.message.instructions[0].parsed.info.source == "AxFuniPo7RaDgPH6Gizf4GZmLQFc4M5ipckeeZfkrPNn").reduce(( previousValue, currentValue ) => previousValue + currentValue.transaction.message.instructions[0].parsed.info.lamports, 0)*0.000000001;
    $: sol_out = $workingArray.filter(transaction => transaction.transaction.message.instructions[0].program == "system"&& transaction.transaction.message.instructions[0].parsed.type == "transfer" && transaction.transaction.message.instructions[0].parsed.type == "transfer" && transaction.transaction.message.instructions[0].parsed.info.source == "DeDaoX2A3oUFMddqkvMAU2bBujo3juVDnmowg4Tyuw2r").reduce(( previousValue, currentValue ) => previousValue + currentValue.transaction.message.instructions[0].parsed.info.lamports, 0)*0.000000001;
    $: sol_in = $workingArray.filter(transaction => transaction.transaction.message.instructions[0].program == "system" && transaction.transaction.message.instructions[0].parsed.type == "transfer" && transaction.transaction.message.instructions[0].parsed.type == "transfer" && transaction.transaction.message.instructions[0].parsed.info.source != "AxFuniPo7RaDgPH6Gizf4GZmLQFc4M5ipckeeZfkrPNn" && transaction.transaction.message.instructions[0].parsed.info.destination == "DeDaoX2A3oUFMddqkvMAU2bBujo3juVDnmowg4Tyuw2r").reduce(( previousValue, currentValue ) => previousValue + currentValue.transaction.message.instructions[0].parsed.info.lamports, 0)*0.000000001;

    const connection = new web3.Connection("https://ssc-dao.genesysgo.net");
    
    onMount(async () => {
       await fetchAll()
        
    });

    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    async function fetchAll () {
       
        loading = true
        let account = await connection.getConfirmedSignaturesForAddress2(deDaoKey, {limit:fetchLimit});
        console.log(account.length)
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
                let blue = await connection.getConfirmedSignaturesForAddress2(deDaoKey, {limit:fetchLimit,before:lastsig});
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
                    console.log("braek")
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
        console.log("fetched account transactions ", $apiData.length)
        //console.log($apiData)
        var results = $apiData.filter(transaction => dayjs.unix(transaction.blockTime) < endday && dayjs.unix(transaction.blockTime) > startday);
        var reformattedArray = results.map((result) => result.signature);

        console.log("reformated array lenghth ", reformattedArray.length);
        console.log(reformattedArray.slice(0,2))
        //batch this if size is bgger than 120?
        //sometimes these come back as null;
        $workingArray = await connection.getParsedTransactions(reformattedArray)
        
        console.log("printing working array")
        console.log($workingArray)
        //console.log($workingArray[0].transaction.message.instructions[0].program)
        var royaltyIncome = $workingArray.filter(transaction => transaction.transaction.message.instructions[0].program == "system" && transaction.transaction.message.instructions[0].parsed.info.source == "AxFuniPo7RaDgPH6Gizf4GZmLQFc4M5ipckeeZfkrPNn");
        
        //console.log(royaltyIncome)
        console.log("royalty income ", roya)
        //a2.filter(x => !a1.includes(x)) 
        console.log($workingArray.filter(x => !royaltyIncome.includes(x)) )
        //const agg = create(JSON.stringify(royaltyIncome))
        //console.log(dayjs.unix(testTrans3.blockTime).format('lll'), testTrans3, );
        //DeGod purchase from ME 3aSxqqw5natU1J8j4SAt9tyZNuG7U8JFeMGvGKvcYrFBLJNsECTnq2nJiErGbL5wzkZ1Go91C2XCMAajmSzCcefn       
        loading = false 
            
        
    }

</script>




<div class="flex justify-center flex-row">
    <div class="pt-4">
        <h1 class="pb-2 font-bely text-5xl font-bold text-center">DeBooks</h1>
        <p class="text-lg font-serif font-bold text-center">Wallet Transaction Statement</p>
        <p class="text-sm font-serif text-center">For the period {startday.format('DD/MM/YYYY')} to {endday.format('DD/MM/YYYY')}</p>
       <p class="pt-2 text-center">
        {#if loading}
            <span class="font-serif font-medium badge badge-lg">loading...</span> 
        {/if}
       </p>
        
    </div>
   
</div>

<div class="p-4 font-serif overflow-x-auto">
    <table class="table table-compact w-full">
        <thead>
            <tr>
                <th></th>
                <th class="block text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="pl-2">Royalty Income</td>
                {#if loading}
                    <td class="text-right">
                        <progress class=" progress w-16"></progress>
                    </td>
                {:else}
                    <td class="pr-4 block text-right"><Number number={roya} locale="en"/></td>
                {/if}
            </tr>
            <tr>
                <td class="pl-2">SOL Transfer In</td>
                {#if loading}
                <td class="text-right">
                    <progress class=" progress w-16"></progress>
                </td>
                {:else}
                    <td class="pr-4 block text-right"><Number number={sol_in} locale="en"/></td>
                {/if}
            </tr>
            <tr>
                <td class="pl-2">SOL Transfer Out</td>
                {#if loading}
                <td class="text-right">
                    <progress class=" progress w-16"></progress>
                </td>
                {:else}
                    <td class="pr-4 block text-right"><Number number={sol_out} locale="en"/></td>
                {/if}
            </tr>
        </tbody>


    </table>


</div>