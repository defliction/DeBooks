<script lang='ts'>
    
    import { keyList } from '../stores.js';

</script>

<div class="card card-compact ">
    {#if $keyList.length > 0 }
    <table class="table table-compact normal-case">
        <thead >
            <tr class=" ">
                <th class="min-w-[8rem] text-left text-sm normal-case">Address</th>
                <th class="min-w-[4rem] text-center text-sm normal-case">Active</th>
                <th class="min-w-[4rem] text-center text-sm normal-case">Status</th>
            
                <th class="text-right text-sm normal-case "><button class="btn btn-primary btn-sm p-1" >MGO</button></th>
                    
                
            </tr>
        </thead>
        
        <tbody>
            {#each $keyList as item, i}
            <tr class="">
                <td class=" min-w-[8rem] text-left text-xs">{item.key.substring(0,4)}...{item.key.substring(item.key.length-4,item.key.length)}</td>
                <td class=" min-w-[4rem] text-center text-xs"><input type="checkbox" bind:checked={item.active} class="checkbox checkbox-sm" /></td>
                <td class=" min-w-[4rem] text-center text-xs">ready</td>
                <td class=" min-w-[4rem] text-right text-xs"><button class="btn btn-ghost btn-xs min-w-[2rem]" on:click={()=> ($keyList.splice(i,1), $keyList=$keyList)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="w-4 h-4 stroke-primary">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button></td>
            </tr>
            {/each}
        </tbody>
        <tfoot>
            <tr class="">
                <th class="text-left text-sm normal-case">loading...</th>
                <th class="text-left text-sm normal-case"></th>
                <th class="text-left text-sm normal-case"></th>
                <th class="text-left text-sm normal-case"></th>
            </tr>
          </tfoot>
      
    </table>
    {/if}
</div>