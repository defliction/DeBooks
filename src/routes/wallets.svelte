<script lang='ts'>

    import { keyList } from '../stores.js';

</script>

<div class=" ">
    {#if $keyList.length > 0 }
    <table class="table table-compact normal-case ">
        <thead>
            <tr class=" ">
            <th class="min-w-[12rem] text-left normal-case">Wallet address</th>
        </tr>
    </thead>
    <tbody>
        {#each $keyList as item, i}
        <tr class="">
            <td class=" min-w-[12rem] text-left">{item}</td>
        </tr>
        {/each}
    </tbody>
    </table>
    {/if}
</div>