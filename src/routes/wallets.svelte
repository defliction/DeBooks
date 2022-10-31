<script lang='ts'>
    let expand = false
    import { keyList } from '../stores.js';

</script>

<div class=" py-4">
    {#if $keyList.length > 0 }
    <table class="table table-compact normal-case ">
        <thead>
            <tr class=" ">
                <th class="min-w-[22rem] text-left normal-case">Wallet addresses ({$keyList.length})</th>
                <th class="min-w-[4rem] text-left normal-case">Status</th>
                {#if expand}
                    <th class="btn btn-sm" on:click={()=> expand = !expand}>+</th>
                {:else}
                    <th class="btn btn-sm" on:click={()=> expand = !expand}>-</th>
                {/if}
            </tr>
        </thead>
        {#if expand}
        <tbody>
            {#each $keyList as item, i}
            <tr class="">
                <td class=" min-w-[12rem] text-left text-xs">{item}</td>
                <td class=" min-w-[4rem] text-left text-xs">ready</td>
                <td class="btn btn-sm min-w-[2rem] text-left text-xs" on:click={()=> ($keyList.splice(i,1), $keyList=$keyList)}>x</td>
            </tr>
            {/each}
        </tbody>
        {/if}
    </table>
    {/if}
</div>