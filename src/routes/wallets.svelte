<script lang='ts'>
    let expand = true
    import { keyList } from '../stores.js';

</script>

<div class="card card-compact ">
    {#if $keyList.length > 0 }
    <table class="table table-compact normal-case">
        <thead >
            <tr class=" ">
                <th class="min-w-[12rem] text-left text-sm normal-case">Wallet addresses ({$keyList.length})</th>
                <th class="min-w-[4rem] text-left text-sm normal-case">{#if expand}Status{/if}</th>
            
                <th></th>
                    
                
            </tr>
        </thead>
        {#if expand}
        <tbody>
            {#each $keyList as item, i}
            <tr class="">
                <td class=" min-w-[12rem] text-left text-xs">{item.substring(0,4)}...{item.substring(item.length-4,item.length)}</td>
                <td class=" min-w-[4rem] text-left text-xs">ready</td>
                <td><button class="btn btn-ghost btn-xs min-w-[2rem]" on:click={()=> ($keyList.splice(i,1), $keyList=$keyList)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="w-4 h-4 stroke-primary">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button></td>
            </tr>
            {/each}
        </tbody>
        {/if}
    </table>
    {/if}
</div>