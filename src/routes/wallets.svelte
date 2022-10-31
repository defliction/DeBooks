<script lang='ts'>
    let expand = false
    import { keyList } from '../stores.js';

</script>

<div class=" py-4">
    {#if $keyList.length > 0 }
    <table class="table table-compact normal-case">
        <thead on:click={()=> expand = !expand} >
            <tr class=" ">
                <th class="min-w-[22rem] text-left text-sm normal-case">Wallet addresses ({$keyList.length})</th>
                <th class="min-w-[4rem] text-left text-sm normal-case">Status</th>
                {#if expand}
                <th><button class="btn btn-ghost btn-xs" ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="w-4 h-4 stroke-primary">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button></th>
                    
                {:else}
                <th><button class="btn btn-ghost btn-xs" ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="w-4 h-4 stroke-primary">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button></th>
                {/if}
            </tr>
        </thead>
        {#if expand}
        <tbody>
            {#each $keyList as item, i}
            <tr class="">
                <td class=" min-w-[12rem] text-left text-xs">{item}</td>
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