<script lang='ts'>
	import * as web3 from '@solana/web3.js';
	import { workingArray,} from '../stores.js';
	import type { Token } from '@solflare-wallet/utl-sdk';

	export async function classifyTransaction (item, programIDs, metaplex, account_index, keyIn, feePayer, utl) {
		//MAGIC EDEN TRANSACTIONS >>
		if (programIDs?.includes("M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K")) {
			let me_escrow = "1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix"
			let amount = item.meta? item.meta.postBalances[0] - item.meta.preBalances[0] + item.meta.fee : null
			//console.log("trans ", item)
			//get NFTs
			let nftIDs: web3.PublicKey[] = []
			item.meta.postTokenBalances.forEach(function (token) {
				if (token.owner == keyIn) {
					nftIDs.push(new web3.PublicKey(token.mint))
				}
			})
			item.meta.preTokenBalances.forEach(function (token) {
				if (token.owner == keyIn) {
					nftIDs.push(new web3.PublicKey(token.mint))
				}
			})
			//console.log("nftIDs " + nftIDs)
			
			let nftnames = await metaplex.nfts().findAllByMintList(nftIDs).run();
			//console.log("NFTNAMES " +  nftnames.flatMap(s => s.name))
			//item.meta.logMessages[1].includes(" Sell")? "Listed ":null + item.meta.logMessages[1].includes(" CancelSell")? "Delisted ":null +
			let descr = "Magic Eden: Unknown"

			if (item.meta?.logMessages[1].includes(" CancelSell")) {
				descr = "Magic Eden: Delisted " + nftnames.flatMap(s => s.name)
			}
			else if (item.meta?.logMessages[1].includes(" Sell") && item.meta?.logMessages[6]?.includes(" ExecuteSale") || item.meta?.logMessages[1].includes(" Sell") && item.meta?.logMessages[12]?.includes(" ExecuteSale")  ) {
				//offer accepted
				let me_escrow = "1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix"
				if (nftIDs.length == 0) {
					item.meta.preTokenBalances.forEach(function (token) {
						if (token.owner == me_escrow) {
							nftIDs.push(new web3.PublicKey(token.mint))
						}
					}) 
					let nftnames = await metaplex.nfts().findAllByMintList(nftIDs).run();
					descr = "Magic Eden: Sold via Offer " + nftnames.flatMap(s => s.name)
					//correct net amount to wallet (net of royalties)
					//let account_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
					
					amount = item.meta.postBalances[account_index] - item.meta.preBalances[account_index]

				}
				else {
					// improve buy vs sold to check who the signer of the transaction was
					// can check full log for 'price' and find row from there
					
					let offerAmount = 0
					if (item.meta?.logMessages[6]?.includes(" ExecuteSale")) {
						offerAmount = JSON.parse(item.meta?.logMessages[2].slice(13)).price/web3.LAMPORTS_PER_SOL
					}
					else {
						offerAmount = JSON.parse(item.meta?.logMessages[8].slice(13)).price/web3.LAMPORTS_PER_SOL
					}
					
					//let account_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
					
					amount = item.meta.postBalances[account_index] - item.meta.preBalances[account_index]
					if (account_index == 0) {
						descr = "Magic Eden: Sold via Offer " + nftnames.flatMap(s => s.name) + " - " + offerAmount + " SOL"
					}
					else {
						descr = "Magic Eden: Bought via Offer " + nftnames.flatMap(s => s.name) + " - " + offerAmount + " SOL"
					}
					
				}
			
			}
			else if (item.meta?.logMessages[1].includes(" Sell") ) {
				if (nftIDs.length == 0) {
					let me_escrow = "1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix"
					item.meta.postTokenBalances.forEach(function (token) {
						if (token.owner == me_escrow) {
							nftIDs.push(new web3.PublicKey(token.mint))
						}
					}) 
					let nftnames = await metaplex.nfts().findAllByMintList(nftIDs).run();
					descr = "Magic Eden: Price Change " + nftnames.flatMap(s => s.name)
				}
				else {
					descr = "Magic Eden: Listed " + nftnames.flatMap(s => s.name)
				}
				
			}
			else if (item.meta.logMessages[12]?.includes(" ExecuteSale") || item.meta.logMessages[14]?.includes(" ExecuteSale") ) {
				
				if (nftIDs.length == 0) {
					item.meta.preTokenBalances.forEach(function (token) {
						if (token.owner == me_escrow) {
							nftIDs.push(new web3.PublicKey(token.mint))
						}
					}) 
					let nftnames = await metaplex.nfts().findAllByMintList(nftIDs).run();
					descr = "Magic Eden: Sold " + nftnames.flatMap(s => s.name)
					//correct net amount to wallet (net of royalties)
					//let account_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
					
					amount = item.meta.postBalances[account_index] - item.meta.preBalances[account_index]

				}
				else {
					descr = "Magic Eden: Bought " + nftnames.flatMap(s => s.name)
				}

				
			}
			
			else if (item.meta?.logMessages[1].includes(" Buy") ) {
				if (nftIDs.length == 0) {
					item.meta.preTokenBalances.forEach(function (token) {
						if (token.owner == me_escrow) {
							nftIDs.push(new web3.PublicKey(token.mint))
						}
					}) 
				
					//correct net amount to wallet (net of royalties)
					//console.log("make offer ", item.transaction.message.instructions[0].accounts.flatMap(s => s.toBase58()))
					let account_index = item.transaction.message.instructions[0].accounts.flatMap(s => s.toBase58())[2]
					//console.log("acc ", account_index)
					let nftnames = await metaplex.nfts().findByMint(new web3.PublicKey(account_index)).run()
					//console.log(item.meta?.logMessages[4].slice(13))
					let offerAmount = ""
					if (item.meta?.innerInstructions.length > 0 ){
						offerAmount = "" + JSON.parse(item.meta?.logMessages[4].slice(13)).price/web3.LAMPORTS_PER_SOL
					}
					else {
						offerAmount = "" + JSON.parse(item.meta?.logMessages[2].slice(13)).price/web3.LAMPORTS_PER_SOL
					}
					
					

					descr = "Magic Eden: Make Offer " + nftnames.name //+ " - " + offerAmount + " SOL"
				}
				else {
					descr = "Magic Eden: Make Offer "
				}
				

				
			}
			else if (item.meta?.logMessages[1].includes(" CancelBuy") ) {
				descr = "Magic Eden: Cancel Offer"

				
			}
			else if (item.meta?.logMessages[1].includes(" Withdraw") ) {
				descr = "Magic Eden: Escrow Withdrawal"

				
			}
			else if (item.meta?.logMessages[1].includes(" Deposit") ) {
				descr = "Magic Eden: Escrow Desposit"

				
			}
			//var decsr = "Magic Eden: " + item.meta?.logMessages[1].includes(" CancelSell")? " DeListed ": item.meta?.logMessages[1].includes(" Sell")?" Listed ": " " : " " : " " + nftnames.flatMap(s => s.name)
			var new_line = 
			{
				"signature": item.transaction.signatures[0],
				"timestamp": item.blockTime, 
				"slot": item.slot,
				"success": item.meta?.err == null? true : false,
				"fee": item.meta? item.meta.fee : null,
				"amount": amount/web3.LAMPORTS_PER_SOL,
				"account_keys": item.transaction.message.accountKeys,
				"pre_balances": item.meta? item.meta.preBalances : null,
				"post_balances": item.meta? item.meta.postBalances : null,
				"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
				"post_token_balances": item.meta? item.meta.postTokenBalances : null,
				"description": descr
			}
			$workingArray.push(new_line)
			//console.log(new_line)
		}

		else {
			//generic instruction work

			//we need to check if any instructions are not parsed up here; and that that transaction involes our account keys; default generic; else parse per known instruction parsing
			if (item.transaction.message.instructions.filter(instr => !instr.parsed).length > 0 && programIDs[0] != "DeJBGdMFa1uynnnKiwrVioatTuHmNLpyFKnmB5kaFdzQ") {
					// does it involve my wallet? to add
					// check all instruction accounts flatmapped
					let customDescripton = "Generic"
					
					if (programIDs.includes("JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph") || programIDs.includes("JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo") || programIDs.includes("JUP6i4ozu5ydDCnLiMogSckDPpbtr7BJ4FtzYWkb5Rk") ) {
						customDescripton = "Jup.ag"
					}


					let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn)
					let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn)
					const combined = [...preFiltered.flatMap(s => s.mint), ...postFiltered.flatMap(s => s.mint)];
					const uniqueTokens =  [...new Set(combined)]
					//console.log("Unique tokens ", combined,  uniqueTokens)
					//token balance loop
					for await (const uniqueToken of uniqueTokens) {
						
						let decimals = item.meta.postTokenBalances.filter(line => line.mint == uniqueToken)[0].uiTokenAmount.decimals
						let preFil= item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
						let preBal =  preFil? preFil : 0
						
						let postFil = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
						let postBal = postFil? postFil : 0
						let tokenChange = parseFloat((postBal-preBal).toFixed(decimals)) 
						
						if (tokenChange != 0) {
							//console.log("--> unique token ", uniqueToken)
			
							//console.log("--> unique token ", tokenName.symbol? )
							var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": tokenChange,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton +  " Transaction: " + await fetchTokenData(uniqueToken, utl, metaplex)
							}
							$workingArray.push(new_line)
							//console.log(new_line, (postBal-preBal), (postBal-preBal).toFixed(decimals), tokenChange)
						}
					}
					//SOL balance sort
					
					let amount = 0
					if (feePayer == keyIn) {
						amount = item.meta? (item.meta.postBalances[account_index] - item.meta.preBalances[account_index] + item.meta.fee)/web3.LAMPORTS_PER_SOL : 0
					}
					else {
						amount = item.meta? (item.meta.postBalances[account_index] - item.meta.preBalances[account_index])/web3.LAMPORTS_PER_SOL : 0
					}
					if (amount != 0) {
						var new_line = 
						{
							"signature": item.transaction.signatures[0],
							"timestamp": item.blockTime, 
							"slot": item.slot,
							"success": item.meta?.err == null? true : false,
							"fee": item.meta? item.meta.fee : null,
							"amount": amount,
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": customDescripton + " Transaction: SOL"
						}
						$workingArray.push(new_line)
						//console.log(new_line)
					}
					
					
					
					
				}
			else {
				let customDescripton = ""
				for await (const instruction of item.transaction.message.instructions) {
					if (instruction.programId.toBase58() == "DeJBGdMFa1uynnnKiwrVioatTuHmNLpyFKnmB5kaFdzQ") {
						customDescripton = "Phantom "
						continue
					}
					
					//each instruction check
					// is there > 0 instructions not parsed? then just break and build a generic transction for each SOL and Token pre/post; else they're all parsed and proceed with classification per instruction data.
					// specific classifications e.g. Jup2 will have to be done above per program ID; this is a catch all;
					// however does inner instruction data solve this ?
					//console.log("PARSED INSTRUCTION ", instruction, item.transaction.signatures[0], item)
					//have a parsed instruction
					if (instruction.parsed.type == "transfer" && instruction.program == "system" && instruction.parsed.info.destination == keyIn) {
						//console.log("SOL TRANSFER IN")
						//SOL TRANSFER
						
						let amount = item.meta.postBalances[account_index] - item.meta.preBalances[account_index]
						if (feePayer == keyIn) {
							amount += item.meta.fee 
						}

						var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": amount/web3.LAMPORTS_PER_SOL,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton + "SOL Transfer In "
							}
							$workingArray.push(new_line)
							//console.log(new_line)

					}
					else if (instruction.parsed.type == "transfer" && instruction.program == "system" && instruction.parsed.info.source == keyIn) {
						//console.log("SOL TRANSFER OUT")
						let amount = item.meta.postBalances[account_index] - item.meta.preBalances[account_index]
						if (feePayer == keyIn) {
							amount += item.meta.fee 
						}

						var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": amount/web3.LAMPORTS_PER_SOL,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton+ "SOL Transfer Out "
							}
							$workingArray.push(new_line)
							//console.log(new_line)
					}
					else if (instruction.program == "spl-token" && instruction.parsed.type == "transferChecked") {
						let mint = instruction.parsed.info.mint
						//console.log("decimals", item.meta.postTokenBalances.filter(line => line.mint == mint)[0]?.uiTokenAmount.decimals)
						let decimals = item.meta.postTokenBalances.filter(line => line.mint == mint)[0].uiTokenAmount.decimals
						let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == mint)[0]?.uiTokenAmount.uiAmount
						let preBal =  preFiltered? preFiltered : 0
						
						let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == mint)[0]?.uiTokenAmount.uiAmount
						let postBal = postFiltered? postFiltered : 0

						//console.log("amounts ", preBal, postBal, parseFloat((postBal-preBal).toFixed(decimals)) )
						
						var new_line = 
						{
							"signature": item.transaction.signatures[0],
							"timestamp": item.blockTime, 
							"slot": item.slot,
							"success": item.meta?.err == null? true : false,
							"fee": item.meta? item.meta.fee : null,
							"amount": item.meta? parseFloat((postBal-preBal).toFixed(decimals)) : null,
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": customDescripton + "SPL Transfer " + await fetchTokenData(mint, utl, metaplex)
						}
						$workingArray.push(new_line)
						//console.log(new_line)
						
						
						
					}
					else if (instruction.program == "spl-token" && instruction.parsed.type == "transfer") {
						//old legacy transfer could break if other spl instructions pre loaded? or mulitple instructions chained in 1 transaction?

						let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn)
						let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn)
						const combined = [...preFiltered.flatMap(s => s.mint), ...postFiltered.flatMap(s => s.mint)];
						const uniqueTokens =  [...new Set(combined)]
						//console.log("Unique tokens ", combined,  uniqueTokens)
						//token balance loop
						for await (const uniqueToken of uniqueTokens) {
							
							let decimals = item.meta.postTokenBalances.filter(line => line.mint == uniqueToken)[0].uiTokenAmount.decimals
							let preFil= item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
							let preBal =  preFil? preFil : 0
							
							let postFil = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
							let postBal = postFil? postFil : 0
							let tokenChange = parseFloat((postBal-preBal).toFixed(decimals))
							
							if (tokenChange != 0) {
								
								var new_line = 
								{
									"signature": item.transaction.signatures[0],
									"timestamp": item.blockTime, 
									"slot": item.slot,
									"success": item.meta?.err == null? true : false,
									"fee": item.meta? item.meta.fee : null,
									"amount": tokenChange,
									"account_keys": item.transaction.message.accountKeys,
									"pre_balances": item.meta? item.meta.preBalances : null,
									"post_balances": item.meta? item.meta.postBalances : null,
									"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
									"post_token_balances": item.meta? item.meta.postTokenBalances : null,
									"description": customDescripton + " SPL Transfer " + await fetchTokenData(uniqueToken, utl, metaplex)
								}
								$workingArray.push(new_line)
								//console.log(new_line)
							}
						}
						//is ignoring SOL here dangerous?
						break
						
						
						
					}
					else if (instruction.program == "spl-token" && instruction.parsed.type == "burn" && instruction.parsed.info.authority == keyIn)  {
						//to catch burns
						let mint = instruction.parsed.info.mint
						let decimals = item.meta.preTokenBalances.filter(line => line.mint == mint)[0].uiTokenAmount.decimals
						let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == mint)[0]?.uiTokenAmount.uiAmount
						let preBal =  preFiltered? preFiltered : 0
						
						let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == mint)[0]?.uiTokenAmount.uiAmount
						let postBal = postFiltered? postFiltered : 0

						
						var new_line = 
						{
							"signature": item.transaction.signatures[0],
							"timestamp": item.blockTime, 
							"slot": item.slot,
							"success": item.meta?.err == null? true : false,
							"fee": item.meta? item.meta.fee : null,
							"amount": item.meta? parseFloat((postBal-preBal).toFixed(decimals)) : null,
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": "Burn SPL Token " + await fetchTokenData(mint, utl, metaplex)
						}
						$workingArray.push(new_line)

					}
					else if (instruction.program == "spl-token" && instruction.parsed.type == "closeAccount" && instruction.parsed.info.destination == keyIn)  {
						//close account refund incoming
						//instruction.parsed.info.account change in SOL
						let closed_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(instruction.parsed.info.account)
						//console.log("closed account index ", closed_index)
						let amount = item.meta? (item.meta.postBalances[closed_index] - item.meta.preBalances[closed_index])/web3.LAMPORTS_PER_SOL : 0
						
						var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": -amount,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton+ "Closed account " + await fetchTokenData(instruction.parsed.info.account, utl, metaplex)
							}
							$workingArray.push(new_line)
							//console.log(new_line)
					}
					else if (instruction.program == "spl-associated-token-account" && instruction.parsed.type == "create" && instruction.parsed.info.source == keyIn) {
						//console.log("create SPL account", instruction)
						let amount = 0
						if (feePayer == keyIn) {
							amount = item.meta? (item.meta.postBalances[account_index] - item.meta.preBalances[account_index] + item.meta.fee)/web3.LAMPORTS_PER_SOL : 0
						}
						else {
							amount = item.meta? (item.meta.postBalances[account_index] - item.meta.preBalances[account_index])/web3.LAMPORTS_PER_SOL : 0
						}
						
						var new_line = 
						{
							"signature": item.transaction.signatures[0],
							"timestamp": item.blockTime, 
							"slot": item.slot,
							"success": item.meta?.err == null? true : false,
							"fee": item.meta? item.meta.fee : null,
							"amount": amount, //amount of SPL movement
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": customDescripton+ "Create SPL Token account for " + await fetchTokenData(instruction.parsed.info.mint, utl, metaplex)
						}
						$workingArray.push(new_line)
					}
					else {
						//generic parsed instruction! if that exists
					}
					
				} 
			}
			
			


			
			//find balances of key in? 
			//let account_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
			
		}
	}

	async function fetchTokenData(mintIn, utl, metaplex) {
		let namedToken = "Unknown " + mintIn.substring(0,4)
		
		let utlToken:Token = await utl.fetchMint(new web3.PublicKey(mintIn))
		if (utlToken == null || utlToken == undefined) {
			try {
				let nftnames = await metaplex.nfts().findByMint(new web3.PublicKey(mintIn)).run();
				console.log("Found mint: ", nftnames)
				if (nftnames.name != "")
				{
					namedToken = "" + nftnames.name
				}
				else {
					namedToken = "" + nftnames.json.name
				}
				
			}
			catch {
				console.log("ERROR - Could not find token name for: ", mintIn)
			}
		}
		else {
			namedToken = utlToken.symbol
		}

		return namedToken

	}
	

	
</script>

