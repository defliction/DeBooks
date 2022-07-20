<script>
	export let number;
	export let locale = "en";

	$: formattedNumber = ((number==0) ? "-" : number.toLocaleString(locale, {
		notation: "standard",
		compactDisplay: "long", 
        maximumFractionDigits: "2",
        minimumFractionDigits: "2",
       
      
	}));
</script>

<style>
	span {
		font-variant-numeric: tabular-nums;
	}
</style>

<span>{formattedNumber}</span>
