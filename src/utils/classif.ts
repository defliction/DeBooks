	import * as web3 from '@solana/web3.js';
	import * as mtda from '../utils/Metadata'
	import * as spl_token from '@solana/spl-token';
	
	let connection = new web3.Connection("https://solitary-young-butterfly.solana-mainnet.quiknode.pro/73898ef123ae4439f244d362030abcda8b8aa1e9/");
	let fetchedList = []

	export async function classifyTransaction (item, workingArray, showMetadata, programIDs:string [], account_index, keyIn, ownerIn, feePayer, utl) {
		//MAGIC EDEN TRANSACTIONS >>
		if (programIDs?.includes("M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K")) {
			let me_escrow = "1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix"
			let amount = 0
			if (feePayer == keyIn){
				amount = item.meta? item.meta.postBalances[account_index] - item.meta.preBalances[account_index] + item.meta.fee : 0
			}
			else {
				amount = item.meta? item.meta.postBalances[account_index] - item.meta.preBalances[account_index] : 0
			}
			
			//console.log("trans ", item)
			//get NFTs
			let nftIDs: web3.PublicKey[] = []
			item.meta.postTokenBalances.forEach(function (token) {
				if (token.owner == keyIn) {
					nftIDs.push(token.mint)
				}
			})
			item.meta.preTokenBalances.forEach(function (token) {
				if (token.owner == keyIn) {
					nftIDs.push(token.mint)
				}
			})
			//console.log("nftIDs " + nftIDs)
			
			let nftnames = showMetadata? await fetchTokenData(nftIDs, utl, showMetadata) : []
			//console.log("NFTNAMES " +  nftnames.flatMap(s => s.name))
			//item.meta.logMessages[1].includes(" Sell")? "Listed ":null + item.meta.logMessages[1].includes(" CancelSell")? "Delisted ":null +
			let descr = "Magic Eden: Unknown"
			let txn_type = "Generic"
			//Royalty check
			//large instruction index
			let instr_index = 0
			for await (const instruction of item.transaction.message.instructions) {
				if (instruction.accounts.length > 13) {
					//we're likely in the execute instruction
					instr_index = instruction.accounts.flatMap(s => s.toBase58()).indexOf(keyIn.toBase58())
					//console.log("instr index ", instruction.accounts.flatMap(s => s.toBase58()).indexOf(keyIn.toBase58()))
				}
			}
			//for (let value of item.meta?.logMessages) {}
			
			if (instr_index > 8) {
				//add in other classifiers above?
				if (nftIDs.length == 0) {
					item.meta.preTokenBalances.forEach(function (token) {
						if (token.owner == me_escrow) {
							nftIDs.push(token.mint)
						}
					}) 
					nftnames = showMetadata? await fetchTokenData(nftIDs, utl, showMetadata) : []
				}
				//console.log("royalty in")
				//for each instruction find the one with inners > 5 inner instructions; if our account is in the first 3 as a destination then we're a royalty
				descr = showMetadata? "Magic Eden: Royalty Income " + nftnames : "Magic Eden: Royalty Income "
				txn_type = "Royalty Income"
			}
			else if (item.meta?.logMessages[1].includes(" CancelSell")) {
				descr = showMetadata? "Magic Eden: Delisted " + nftnames : "Magic Eden: Delisted "
			}
			else if (item.meta?.logMessages[1].includes(" Sell") && item.meta?.logMessages[6]?.includes(" ExecuteSale") || item.meta?.logMessages[1].includes(" Sell") && item.meta?.logMessages[12]?.includes(" ExecuteSale")  ) {
				//offer accepted
				let me_escrow = "1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix"
				if (nftIDs.length == 0) {
					item.meta.preTokenBalances.forEach(function (token) {
						if (token.owner == me_escrow) {
							nftIDs.push(token.mint)
						}
					}) 
					let nftnames = showMetadata? await fetchTokenData(nftIDs, utl, showMetadata) : []
					descr = showMetadata? "Magic Eden: Sold via Offer " +  nftnames : "Magic Eden: Sold via Offer "
					txn_type = "NFT sale"
					//correct net amount to wallet (net of royalties)
					//let account_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
					
					amount = item.meta.postBalances[account_index] - item.meta.preBalances[account_index]

				}
				else {
					// improve buy vs sold to check who the signer of the transaction was
					// can check full log for 'price' and find row from there
					let offerAmount = ""
					item.meta?.logMessages.forEach(function (value) {
						let priceIndex = value.indexOf('{"price"')
						if (priceIndex > 0) {
							try {
								offerAmount = "" + JSON.parse(value.slice(priceIndex)).price/web3.LAMPORTS_PER_SOL
							}
							catch (e) {
								console.log("### WARNING DID NOT PARSE PRICE [b]", item)
								offerAmount = ""
							}
						}
					});
					/*
					let offerAmount = 0
					if (item.meta?.logMessages[6]?.includes(" ExecuteSale")) {
							try {
								offerAmount = JSON.parse(item.meta?.logMessages[2].slice(13)).price/web3.LAMPORTS_PER_SOL
							}
							catch (e) {
								console.log("### WARNING DID NOT PARSE PRICE 3", item)
								offerAmount = "Unknown"
							}
					}
					else {
						try {
							offerAmount = JSON.parse(item.meta?.logMessages[8].slice(13)).price/web3.LAMPORTS_PER_SOL
						}
						catch (e) {
								console.log("### WARNING DID NOT PARSE PRICE 4", item)
								offerAmount = "Unknown"
							}
						
					}*/
					
					//let account_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
					
					amount = item.meta.postBalances[account_index] - item.meta.preBalances[account_index]
					if (account_index == 0) {
						descr = showMetadata? "Magic Eden: Sold via Offer " +  nftnames + " - " + offerAmount + " SOL" : "Magic Eden: Sold via Offer " + "- " + offerAmount + " SOL"
						txn_type = "NFT sale"
					}
					else {
						descr =  showMetadata? "Magic Eden: Bought via Offer " +  nftnames + " - " + offerAmount + " SOL" : "Magic Eden: Bought via Offer " + "- " + offerAmount + " SOL"
						txn_type = "NFT purchase"
					}
					
				}
			
			}
			else if (item.meta?.logMessages[1].includes(" Sell") ) {
				if (nftIDs.length == 0) {
					let me_escrow = "1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix"
					item.meta.postTokenBalances.forEach(function (token) {
						if (token.owner == me_escrow) {
							nftIDs.push(token.mint)
						}
					}) 
					let nftnames = showMetadata? await fetchTokenData(nftIDs, utl, showMetadata) : []
					descr = showMetadata? "Magic Eden: Price Change " + nftnames : "Magic Eden: Price Change "
				}
				else {
					descr = showMetadata? "Magic Eden: Listed " + nftnames : "Magic Eden: Listed "
				}
				
			}
			else if (item.meta.logMessages[12]?.includes(" ExecuteSale") || item.meta.logMessages[14]?.includes(" ExecuteSale") ) {
				
				if (nftIDs.length == 0) {
					item.meta.preTokenBalances.forEach(function (token) {
						if (token.owner == me_escrow) {
							nftIDs.push(token.mint)
						}
					}) 
					let nftnames = showMetadata? await fetchTokenData(nftIDs, utl, showMetadata) : []
					descr =  showMetadata? "Magic Eden: Sold " + nftnames : "Magic Eden: Sold "
					txn_type = "NFT sale"
					//correct net amount to wallet (net of royalties)
					//let account_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
					
					amount = item.meta.postBalances[account_index] - item.meta.preBalances[account_index]

				}
				else {
					descr = showMetadata? "Magic Eden: Bought " + nftnames : "Magic Eden: Bought "
					txn_type = "NFT purchase"
				}

				
			}
			else if (item.meta?.logMessages[1].includes(" Buy") || item.meta?.logMessages[7]?.includes(" Buy") ) {
				if (nftIDs.length == 0) {
					item.meta.preTokenBalances.forEach(function (token) {
						if (token.owner == me_escrow) {
							nftIDs.push(token.mint)
						}
					}) 
				
					//correct net amount to wallet (net of royalties)
					//console.log("make offer ", item.transaction.message.instructions[0].accounts.flatMap(s => s.toBase58()))
					let account_index = item.transaction.message.instructions[0].accounts.flatMap(s => s.toBase58())[2]
					//console.log("acc ", account_index)
				
					let nftnames = showMetadata? await fetchTokenData([account_index], utl, showMetadata) : []				
					if (item.meta?.logMessages[2].includes("Program 11111111111111111111111111111111 invoke") || item.meta?.logMessages[8]?.includes("Program 11111111111111111111111111111111 invoke")  ) {
						descr = showMetadata?  "Magic Eden: Make Offer " +  nftnames : "Magic Eden: Make Offer " //+ " - " + offerAmount + " SOL"
					}
					else {
						descr = showMetadata?  "Magic Eden: Adjust Offer " +  nftnames : "Magic Eden: Adjust Offer " //+ " - " + offerAmount + " SOL"
					}
					
				}
				else {
					if (item.meta?.logMessages[2].includes("Program 11111111111111111111111111111111 invoke") || item.meta?.logMessages[8]?.includes("Program 11111111111111111111111111111111 invoke")  ) {
						descr = showMetadata?  "Magic Eden: Make Offer " +  nftnames : "Magic Eden: Make Offer " //+ " - " + offerAmount + " SOL"
					}
					else {
						descr = showMetadata?  "Magic Eden: Adjust Offer " +  nftnames : "Magic Eden: Adjust Offer " //+ " - " + offerAmount + " SOL"
					}
					
				}
				
				
			}
			else if (item.meta?.logMessages[1].includes(" CancelBuy") ) {
				descr = "Magic Eden: Cancel Offer"

				
			}
			else if (item.meta?.logMessages[1].includes(" Withdraw") ) {
				descr = "Magic Eden: Escrow Withdrawal"
				txn_type = "Escrow"

				
			}
			else if (item.meta?.logMessages[1].includes(" Deposit") ) {
				descr = "Magic Eden: Escrow Desposit"
				txn_type = "Escrow"

				
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
				"usd_amount": null,
				"mint": "So11111111111111111111111111111111111111112",
				"token_name": "SOL",
				"type": txn_type,
				"account_keys": item.transaction.message.accountKeys,
				"pre_balances": item.meta? item.meta.preBalances : null,
				"post_balances": item.meta? item.meta.postBalances : null,
				"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
				"post_token_balances": item.meta? item.meta.postTokenBalances : null,
				"description": descr
			}
			workingArray.push(new_line)
			//console.log(new_line)
		}
		//Magic Eden V1
		else if(programIDs.includes("MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8")) {
			// does it involve my wallet? to add
			// check all instruction accounts flatmapped
			let customDescripton = "Magic Eden Transaction "
			let txn_type = "Generic"
		
			let nftIDs: web3.PublicKey[] = []
			item.meta.postTokenBalances.forEach(function (token) {
				if (token.owner == keyIn) {
					nftIDs.push(token.mint)
				}
			})
			item.meta.preTokenBalances.forEach(function (token) {
				if (token.owner == keyIn) {
					nftIDs.push(token.mint)
				}
			})
			let nftnames = showMetadata? await fetchTokenData(nftIDs, utl, showMetadata) : []

			//console.log("nftIDs " + nftIDs)
			if (item.transaction.message.accountKeys.length < 7 && item.transaction.message.accountKeys[4].pubkey.toBase58() == "11111111111111111111111111111111") {
				customDescripton = "Magic Eden Listing "
			}
			else if (item.transaction.message.accountKeys.length < 7 && item.transaction.message.accountKeys[4].pubkey.toBase58() == "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
				customDescripton = "Magic Eden Cancel Listing "
			}
			else if (account_index == 0) {
				customDescripton = "Magic Eden Purchase "
				txn_type = "NFT purchase"
			}
			else if (account_index == 2) {
				customDescripton = "Magic Eden Sale "
				txn_type = "NFT sale"
				nftIDs.push(item.meta.preTokenBalances[0].mint)
				nftnames = showMetadata? await fetchTokenData(nftIDs, utl, showMetadata) : []
				
			}
			else if (account_index > 6) {
				nftIDs.push(item.meta.preTokenBalances[0].mint)
				nftnames = showMetadata? await fetchTokenData(nftIDs, utl, showMetadata) : []
				customDescripton = "Magic Eden Royalty Income "
				txn_type = "Royalty Income"
			}

			let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn)
			let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn)
			const combined = [...preFiltered.flatMap(s => s.mint), ...postFiltered.flatMap(s => s.mint)];
			const uniqueTokens =  [...new Set(combined)]
			//console.log("Unique tokens ", combined,  uniqueTokens)
			//token balance loop
			for await (const uniqueToken of uniqueTokens) {
				
				let decimals = item.meta.postTokenBalances.filter(line => line.mint == uniqueToken)[0]?.uiTokenAmount.decimals
				let preFil = item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
				let preBal =  preFil? preFil : 0
				
				let postFil = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
				let postBal = postFil? postFil : 0
				let tokenChange = parseFloat((postBal-preBal).toFixed(decimals)) 
				//customDescripton = "Magic Eden "
				if (tokenChange != 0) {
					//console.log("--> unique token ", uniqueToken)
					let direction = tokenChange < 0? "Out: " : "In: "
					//console.log("--> unique token ", tokenName.symbol? )
					let tokenName = await fetchTokenData([uniqueToken], utl, showMetadata)
					var new_line = 
					{
						"signature": item.transaction.signatures[0],
						"timestamp": item.blockTime, 
						"slot": item.slot,
						"success": item.meta?.err == null? true : false,
						"fee": item.meta? item.meta.fee : null,
						"amount": tokenChange,
						"usd_amount": null,
						"mint": uniqueToken,
						"token_name": tokenName,
						"account_keys": item.transaction.message.accountKeys,
						"pre_balances": item.meta? item.meta.preBalances : null,
						"post_balances": item.meta? item.meta.postBalances : null,
						"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
						"post_token_balances": item.meta? item.meta.postTokenBalances : null,
						"description": customDescripton + direction + tokenName
					}
					workingArray.push(new_line)
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
				let direction = amount < 0? "Out: " : "In: "
				var new_line = 
				{
					"signature": item.transaction.signatures[0],
					"timestamp": item.blockTime, 
					"slot": item.slot,
					"success": item.meta?.err == null? true : false,
					"fee": item.meta? item.meta.fee : null,
					"amount": amount,
					"usd_amount": null,
					"mint": "So11111111111111111111111111111111111111112",
					"token_name": "SOL",
					"type": txn_type,
					"account_keys": item.transaction.message.accountKeys,
					"pre_balances": item.meta? item.meta.preBalances : null,
					"post_balances": item.meta? item.meta.postBalances : null,
					"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
					"post_token_balances": item.meta? item.meta.postTokenBalances : null,
					"description": customDescripton + direction + " SOL - " + nftnames
				}
				workingArray.push(new_line)
				//console.log(new_line)
			}
		}
		//Foxy Swap
		else if(programIDs.includes("8guzmt92HbM7yQ69UJg564hRRX6N4nCdxWE5L6ENrA8P")) {
			// does it involve my wallet? to add
					// check all instruction accounts flatmapped
					let customDescripton = "FoxySwap"
					let txn_type = "Swap"
					for (let value of item.meta?.logMessages){
						if(value.includes('InitSwap')) {
							try{
								customDescripton = "FoxySwap Initiate Swap " + item.transaction.message.accountKeys[1].pubkey.toBase58().substring(0,4) + " -"
								
								break
							}
							catch (e) {
								console.log("Error init swap",item.transaction.signatures)
								console.log(e)
							}
							
						}
						else if(value.includes('CompleteSwap')) {
							try{
								customDescripton = "FoxySwap Complete Swap " + item.transaction.message.instructions[0].accounts[0].toBase58().substring(0,4) + " -"
								break
							}
							catch (e) {
								console.log("Error complete swap",item.transaction.signatures)
								console.log(e)
							}
						}
						else if(value.includes('CancelSwap')) {
							try{
								customDescripton = "FoxySwap Cancel Swap " + item.transaction.message.instructions[0].accounts[0].toBase58().substring(0,4) + " -"
								break
							}
							catch (e) {
								console.log("Error complete swap",item.transaction.signatures)
								console.log(e)
							}
						}
					
					}


					let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn)
					let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn)
					const combined = [...preFiltered.flatMap(s => s.mint), ...postFiltered.flatMap(s => s.mint)];
					const uniqueTokens =  [...new Set(combined)]
					//console.log("Unique tokens ", combined,  uniqueTokens)
					//token balance loop
					for await (const uniqueToken of uniqueTokens) {
						
						let decimals = item.meta.postTokenBalances.filter(line => line.mint == uniqueToken)[0]?.uiTokenAmount.decimals
						let preFil = item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
						let preBal =  preFil? preFil : 0
						
						let postFil = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
						let postBal = postFil? postFil : 0
						let tokenChange = parseFloat((postBal-preBal).toFixed(decimals)) 
						
						if (tokenChange != 0) {
							//console.log("--> unique token ", uniqueToken)
							let direction = tokenChange < 0? "Out: " : "In: "
							//console.log("--> unique token ", tokenName.symbol? )
							let tokenName = await fetchTokenData([uniqueToken], utl, showMetadata)
							var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": tokenChange,
								"usd_amount": null,
								"mint": uniqueToken,
								"token_name": tokenName,
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton +  " Transaction " + direction + tokenName
							}
							workingArray.push(new_line)
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
						let direction = amount < 0? "Out: " : "In: "
						var new_line = 
						{
							"signature": item.transaction.signatures[0],
							"timestamp": item.blockTime, 
							"slot": item.slot,
							"success": item.meta?.err == null? true : false,
							"fee": item.meta? item.meta.fee : null,
							"amount": amount,
							"usd_amount": null,
							"mint": "So11111111111111111111111111111111111111112",
							"token_name": "SOL",
							"type": txn_type,
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": customDescripton + " Transaction " + direction + " SOL"
						}
						workingArray.push(new_line)
						//console.log(new_line)
					}
		}
		//YAWWW Swap
		else if(programIDs.includes("1RzgwLNLcLXCnK6eiev5jPmEP6TyJbmkTtvN6NShvXy")) {
			// does it involve my wallet? to add
					// check all instruction accounts flatmapped
					
					let customDescripton = "YAWWW Swap"
					let txn_type = "Swap"
					for (let value of item.meta?.logMessages){
						
						if(value.includes('Initialize swap')) {
							try{
								customDescripton = "YAWWW Initiate Swap " + item.transaction.message.instructions[1].accounts[1].toBase58().substring(0,4) + " -"
								break
							}
							catch (e) {
								console.log("Error init yaw swap",item.transaction.signatures)
								console.log(e)
							}
							
						}
						else if(value.includes('Send swap item to counterparty')) {
							try{
								customDescripton = "YAWWW Complete Swap " + item.transaction.message.instructions[1].accounts[1].toBase58().substring(0,4) + " -"
								break
							}
							catch (e) {
								console.log("Error complete  ywaee swap",item.transaction.signatures)
								console.log(e)
							}
						}
						else if(value.includes('Cancel swap')) {
							try{
								customDescripton = "YAWWW Cancel Swap " + item.transaction.message.instructions[0].accounts[2].toBase58().substring(0,4) + " -"
								break
							}
							catch (e) {
								console.log("Error cancel yaww swap",item.transaction.signatures)
								console.log(e)
							}
						}
					
					}


					let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn)
					let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn)
					const combined = [...preFiltered.flatMap(s => s.mint), ...postFiltered.flatMap(s => s.mint)];
					const uniqueTokens =  [...new Set(combined)]
					//console.log("Unique tokens ", combined,  uniqueTokens)
					//token balance loop
					for await (const uniqueToken of uniqueTokens) {
						
						let decimals = item.meta.postTokenBalances.filter(line => line.mint == uniqueToken)[0]?.uiTokenAmount.decimals
						let preFil = item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
						let preBal =  preFil? preFil : 0
						
						let postFil = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
						let postBal = postFil? postFil : 0
						let tokenChange = parseFloat((postBal-preBal).toFixed(decimals)) 
						
						if (tokenChange != 0) {
							//console.log("--> unique token ", uniqueToken)
							let direction = tokenChange < 0? "Out: " : "In: "
							//console.log("--> unique token ", tokenName.symbol? )
							let tokenName = await fetchTokenData([uniqueToken], utl, showMetadata)
							var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": tokenChange,
								"usd_amount": null,
								"mint": uniqueToken,
								"token_name": tokenName,
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton +  " Transaction " + direction + tokenName
							}
							workingArray.push(new_line)
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
						let direction = amount < 0? "Out: " : "In: "
						var new_line = 
						{
							"signature": item.transaction.signatures[0],
							"timestamp": item.blockTime, 
							"slot": item.slot,
							"success": item.meta?.err == null? true : false,
							"fee": item.meta? item.meta.fee : null,
							"amount": amount,
							"usd_amount": null,
							"mint": "So11111111111111111111111111111111111111112",
							"token_name": "SOL",
							"type": txn_type,
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": customDescripton + " Transaction " + direction + " SOL"
						}
						workingArray.push(new_line)
						//console.log(new_line)
						
					}
		}
		//YAWWW Loan
		else if(programIDs.includes("76f9QiXhCc8YLJc2LEE4Uae4Xu3itc3JCGLmup3VQwRH")) {
			// does it involve my wallet? to add
					// check all instruction accounts flatmapped
					let customDescripton = "YAWWW Loan"
					let txn_type = "Loan"
					for (let value of item.meta?.logMessages){
						if(value.includes('Create loan request')) {
							try{
								customDescripton = "YAWWW Initiate Loan request " + item.transaction.message.instructions[5].accounts[5].toBase58().substring(0,4) + " -"
								break
							}
							catch (e) {
								console.log("Error init loan",item.transaction.signatures)
								console.log(e)
							}
							
						}
						else if(value.includes('Cancel loan request')) {
							try{
								customDescripton = "YAWWW Cancel Loan request " + item.transaction.message.instructions[1].accounts[3].toBase58().substring(0,4) + " -"
								break
							}
							catch (e) {
								console.log("Error cancel loan",item.transaction.signatures)
								console.log(e)
							}
							
						}
						else if(value.includes('Create loan offer')) {
							try{
								customDescripton = "YAWWW Create Loan offer " + item.transaction.message.instructions[0].accounts[1].toBase58().substring(0,4) + " -"
								break
							}
							catch (e) {
								console.log("Error cancel loan",item.transaction.signatures)
								console.log(e)
							}
							
						}
						else if(value.includes('Cancel loan offer')) {
							try{
								customDescripton = "YAWWW Cancel Loan offer " + item.transaction.message.instructions[0].accounts[1].toBase58().substring(0,4) + " -"
								break
							}
							catch (e) {
								console.log("Error cancel loan",item.transaction.signatures)
								console.log(e)
							}
							
						}
						else if(value.includes('Pay loan back')) {
							try{
								customDescripton = "YAWWW Loan Repaid " + item.transaction.message.instructions[1].accounts[3].toBase58().substring(0,4) + " -"
								break
								
							}
							catch (e) {
								console.log("Error repay loan",item.transaction.signatures)
								console.log(e)
							}
						}
						else if(value.includes('Accept loan request')) {
							try{
								if (feePayer != keyIn) {
									customDescripton = "YAWWW Receive Loan " + item.transaction.message.instructions[0].accounts[2].toBase58().substring(0,4) + " -"
									break
								}
								else if (feePayer == keyIn) {
									customDescripton = "YAWWW Lend Out " + item.transaction.message.instructions[0].accounts[2].toBase58().substring(0,4) + " -"
									break
								}
								
								
							}
							catch (e) {
								console.log("Error complete swap",item.transaction.signatures)
								console.log(e)
							}
						}
						else if(value.includes('Claim loan collateral')) {
							try{
								
								customDescripton = "YAWWW Collateral Claimed " + item.transaction.message.instructions[0].accounts[1].toBase58().substring(0,4) + " -"
								break
								
								
								
								
							}
							catch (e) {
								console.log("Error complete swap",item.transaction.signatures)
								console.log(e)
							}
						}
					}
					

					let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn)
					let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn)
					const combined = [...preFiltered.flatMap(s => s.mint), ...postFiltered.flatMap(s => s.mint)];
					const uniqueTokens =  [...new Set(combined)]
					//console.log("Unique tokens ", combined,  uniqueTokens)
					//token balance loop
					for await (const uniqueToken of uniqueTokens) {
						
						let decimals = item.meta.postTokenBalances.filter(line => line.mint == uniqueToken)[0]?.uiTokenAmount.decimals
						let preFil = item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
						let preBal =  preFil? preFil : 0
						
						let postFil = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
						let postBal = postFil? postFil : 0
						let tokenChange = parseFloat((postBal-preBal).toFixed(decimals)) 
						
						if (tokenChange != 0) {
							//console.log("--> unique token ", uniqueToken)
							let direction = tokenChange < 0? "Out: " : "In: "
							//console.log("--> unique token ", tokenName.symbol? )
							let tokenName = await fetchTokenData([uniqueToken], utl, showMetadata)
							var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": tokenChange,
								"usd_amount": null,
								"mint": uniqueToken,
								"token_name": tokenName,
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton +  " Transaction " + direction + tokenName
							}
							workingArray.push(new_line)
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
						let direction = amount < 0? "Out: " : "In: "
						var new_line = 
						{
							"signature": item.transaction.signatures[0],
							"timestamp": item.blockTime, 
							"slot": item.slot,
							"success": item.meta?.err == null? true : false,
							"fee": item.meta? item.meta.fee : null,
							"amount": amount,
							"usd_amount": null,
							"mint": "So11111111111111111111111111111111111111112",
							"token_name": "SOL",
							"type": txn_type,
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": customDescripton + " Transaction " + direction + " SOL"
						}
						workingArray.push(new_line)
						//console.log(new_line)
					}
		}
		//generic instruction work
		else {
			//generic instruction work

			//we need to check if any instructions are not parsed up here; and that that transaction involes our account keys; default generic; else parse per known instruction parsing
			if (item.transaction.message.instructions.filter(instr => !instr.parsed).length > 0 && programIDs[0] != "DeJBGdMFa1uynnnKiwrVioatTuHmNLpyFKnmB5kaFdzQ") {
					// does it involve my wallet? to add
					// check all instruction accounts flatmapped
					let customDescripton = "Generic"
					let txn_type = "Generic"
					if (programIDs.includes("JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph") || programIDs.includes("JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo") || programIDs.includes("JUP6i4ozu5ydDCnLiMogSckDPpbtr7BJ4FtzYWkb5Rk") ) {
						customDescripton = "Jup.ag"
					}
					else {
						for (let value of item.meta?.logMessages){
							try {
								if(value.toLowerCase().includes(' stake') || value.toLowerCase().includes(' staking') ) {
									
									customDescripton = "Stake"
									txn_type = "Stake"
									break
								}
								else if (value.toLowerCase().includes(' unstake') || value.toLowerCase().includes(' unstaking')) {
								
									customDescripton = "Unstake"
									txn_type = "Stake"
									break
								}
								else if (value.toLowerCase().includes(' claim') || value.toLowerCase().includes(' claiming')) {
									
									customDescripton = "Claim"
									break
								}
								else if (value.toLowerCase().includes(' burn') ) {
									
									customDescripton = "Burn"
									txn_type = "Burn"
									break
								}
							}
							catch (e) {
								console.log("error in generic text search")
							}

						}
						
					}
					//check the pre and post; if any owner is undefined then find it and set it; 
					let preTokens = item.meta.preTokenBalances
					let postTokens =  item.meta.postTokenBalances
					
					for await (var token of preTokens) {
						if (token.owner == undefined) {
							//find owner and set it - old transactions don't have this data
							console.log("looking for owner pre tokens")
							try {
								let owner = await connection.getAccountInfoAndContext(item.transaction.message.accountKeys[token.accountIndex].pubkey)
								if (owner.value.owner.toBase58() == 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
									//SPL token
									//get ultimate owner
									let decoded = spl_token.AccountLayout.decode(owner.value.data)
									let uowner = decoded.owner.toBase58()
									token.owner = uowner
								}
							}
							catch (e) {
								console.log(e, )
							}
							
						}
					}
					for await (var token of postTokens) {
						if (token.owner == undefined) {
							//find owner and set it
							console.log("looking for owner post tokens")
							try {
								let owner = await connection.getAccountInfoAndContext(item.transaction.message.accountKeys[token.accountIndex].pubkey)
								if (owner.value.owner.toBase58() == 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
									//SPL token
									//get ultimate owner
									let decoded = spl_token.AccountLayout.decode(owner.value.data)
									let uowner = decoded.owner.toBase58()
									token.owner = uowner
								}
							}
							catch (e) {
								console.log(e, )
							}
						}
					}

					let preFiltered = preTokens.filter(token => token.owner == keyIn)
					let postFiltered = postTokens.filter(token => token.owner == keyIn)
					const combined = [...preFiltered.flatMap(s => s.mint), ...postFiltered.flatMap(s => s.mint)];
					const uniqueTokens =  [...new Set(combined)]
					//console.log("Unique tokens ", combined,  uniqueTokens)
					//token balance loop
					for await (const uniqueToken of uniqueTokens) {
						
						let decimals = preTokens.filter(line => line.mint == uniqueToken)[0]?.uiTokenAmount.decimals
						if (decimals == undefined) {
							decimals = postFiltered.filter(line => line.mint == uniqueToken)[0]?.uiTokenAmount.decimals
						}
						let preFil = preTokens.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount					
						let postFil = postTokens.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount

						let preBal =  preFil? preFil : 0
						let postBal = postFil? postFil : 0
						let tokenChange = parseFloat((postBal-preBal).toFixed(decimals)) 
						
						if (uniqueToken == "So11111111111111111111111111111111111111112") {
							if (feePayer == keyIn) {
								tokenChange -= item.meta? (item.meta.postBalances[account_index] - item.meta.preBalances[account_index] + item.meta.fee)/web3.LAMPORTS_PER_SOL : 0
								
							}
							else {
								tokenChange -= item.meta? (item.meta.postBalances[account_index] - item.meta.preBalances[account_index])/web3.LAMPORTS_PER_SOL : 0
								//console.log("NaN? ", amount, account_index)
							}
						}

						if (tokenChange != 0) {
							//console.log("--> unique token ", uniqueToken)
							let direction = tokenChange < 0? "Out: " : "In: "
							//console.log("--> unique token ", tokenName.symbol? )
							let tokenName = await fetchTokenData([uniqueToken], utl, showMetadata)
							var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": tokenChange,
								"usd_amount": null,
								"mint": uniqueToken,
								"token_name": tokenName,
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton +  " Transaction " + direction + tokenName
							}
							workingArray.push(new_line)
							console.log(new_line, decimals)
						}
					}
					//SOL balance sort
					if (account_index != -1) {
						let amount = 0
						if (feePayer == keyIn) {
							amount = item.meta? (item.meta.postBalances[account_index] - item.meta.preBalances[account_index] + item.meta.fee)/web3.LAMPORTS_PER_SOL : 0
							
						}
						else {
							amount = item.meta? (item.meta.postBalances[account_index] - item.meta.preBalances[account_index])/web3.LAMPORTS_PER_SOL : 0
							//console.log("NaN? ", amount, account_index)
						}
						if (amount != 0 ) {
							let direction = amount < 0? "Out: " : "In: "
							var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": amount,
								"usd_amount": null,
								"mint": "So11111111111111111111111111111111111111112",
								"token_name": "SOL",
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton + " Transaction " + direction + " SOL"
							}
							workingArray.push(new_line)
							
							//console.log("SOL", new_line, (item.meta.postBalances[account_index] - item.meta.preBalances[account_index])/web3.LAMPORTS_PER_SOL,(item.meta.postBalances[account_index] - item.meta.preBalances[account_index] + item.meta.fee)/web3.LAMPORTS_PER_SOL )
							
							//console.log(new_line)
						}
					}
					
					
			}
			else {
				let customDescripton = ""
				let txn_type = "Generic"
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
						
						let amount = instruction.parsed.info.lamports
						txn_type = "Transfer"
						var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": amount/web3.LAMPORTS_PER_SOL,
								"usd_amount": null,
								"mint": "So11111111111111111111111111111111111111112",
								"token_name": "SOL",
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton + "SOL Transfer In "
							}
							workingArray.push(new_line)
							//console.log(new_line)

					}
					else if (instruction.parsed.type == "transfer" && instruction.program == "system" && instruction.parsed.info.source == keyIn) {
						//console.log("SOL TRANSFER OUT")
						let amount = -instruction.parsed.info.lamports
						txn_type = "Transfer"
						var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": amount/web3.LAMPORTS_PER_SOL,
								"usd_amount": null,
								"mint": "So11111111111111111111111111111111111111112",
								"token_name": "SOL",
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton+ "SOL Transfer Out "
							}
							workingArray.push(new_line)
							//console.log(new_line)
					}
					else if (instruction.program == "spl-token" && instruction.parsed.type == "transferChecked") {
						let mint = instruction.parsed.info.mint
						let authority = instruction.parsed.info.authority
						//console.log("decimals", item.meta.postTokenBalances.filter(line => line.mint == mint)[0]?.uiTokenAmount.decimals)
						let decimals = item.meta.postTokenBalances.filter(line => line.mint == mint)[0].uiTokenAmount.decimals
						let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn)
						let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn)

						//potential improvmenet not to waiste an RPC call here
						
						if (ownerIn.value != null && ownerIn.value.owner.toBase58() == 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
							//SPL token
							//get ultimate owner
							let decoded = spl_token.AccountLayout.decode(ownerIn.value.data)
							let uowner = decoded.owner.toBase58()
							preFiltered = item.meta.preTokenBalances.filter(token => token.owner == uowner && token.mint == mint)[0]?.uiTokenAmount.uiAmount
							postFiltered = item.meta.postTokenBalances.filter(token => token.owner == uowner && token.mint == mint)[0]?.uiTokenAmount.uiAmount
						}
						else {
							preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == mint)[0]?.uiTokenAmount.uiAmount
							postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == mint)[0]?.uiTokenAmount.uiAmount
						}

						//the way this is solved generically above is potentailly better? but slower
						let test1 = item.meta.preTokenBalances.filter(token => token.owner == undefined && token.mint == mint)[0]
						let test2 = item.meta.postTokenBalances.filter(token => token.owner == undefined && token.mint == mint)[0]
						if (test1 && test1.owner == undefined || test2 && test2.owner == undefined) {
							
							if (authority == keyIn) {
								//transfer out
								preFiltered = instruction.parsed.info.tokenAmount.uiAmountString
								postFiltered = 0
							}
							else {
								//transfer in
								preFiltered = 0
								postFiltered = instruction.parsed.info.tokenAmount.uiAmountString

							}
							
						}

						
						let preBal =  preFiltered? preFiltered : 0
						let postBal = postFiltered? postFiltered : 0
						txn_type = "Transfer"
						//console.log("amounts ", preBal, postBal, parseFloat((postBal-preBal).toFixed(decimals)),  instruction)
						let tokenChange = parseFloat((postBal-preBal).toFixed(decimals))
						let direction = tokenChange < 0? "Out: " : "In: "
						let tokenName =  await fetchTokenData([mint], utl, showMetadata)
						var new_line = 
						{
							"signature": item.transaction.signatures[0],
							"timestamp": item.blockTime, 
							"slot": item.slot,
							"success": item.meta?.err == null? true : false,
							"fee": item.meta? item.meta.fee : null,
							"amount": item.meta? tokenChange : null,
							"usd_amount": null,
							"mint": mint,
							"token_name": tokenName,
							"type": txn_type,
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": customDescripton + "SPL Transfer " + direction + tokenName
						}
						workingArray.push(new_line)
						//console.log(new_line, mint, preBal, postBal, )
					}
					else if (instruction.program == "spl-token" && instruction.parsed.type == "transfer") {
						//old legacy transfer could break if other spl instructions pre loaded? or mulitple instructions chained in 1 transaction?
						let authority = instruction.parsed.info.authority
						let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn)
						let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn)
						const combined = [...preFiltered.flatMap(s => s.mint), ...postFiltered.flatMap(s => s.mint)];
						const uniqueTokens =  [...new Set(combined)]
						//console.log("Unique tokens ", combined,  uniqueTokens)
						//token balance loop
						for await (const uniqueToken of uniqueTokens) {
							
							let decimals = item.meta.postTokenBalances.filter(line => line.mint == uniqueToken)[0].uiTokenAmount.decimals
							let preFiltered
							let postFiltered
							//potential improvmenet not to waiste an RPC call here
							
							if (ownerIn.value != null && ownerIn.value.owner.toBase58() == 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
								//SPL token
								//get ultimate owner
								let decoded = spl_token.AccountLayout.decode(ownerIn.value.data)
								let uowner = decoded.owner.toBase58()
								preFiltered = item.meta.preTokenBalances.filter(token => token.owner == uowner && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
								postFiltered = item.meta.postTokenBalances.filter(token => token.owner == uowner && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
							}
							else {
								preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
								postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == uniqueToken)[0]?.uiTokenAmount.uiAmount
							}

							let test1 = item.meta.preTokenBalances.filter(token => token.owner == undefined && token.mint == mint)[0]
							let test2 = item.meta.postTokenBalances.filter(token => token.owner == undefined && token.mint == mint)[0]
							if (test1 && test1.owner == undefined || test2 && test2.owner == undefined) {
								
								if (authority == keyIn) {
									//transfer out
									preFiltered = instruction.parsed.info.tokenAmount.uiAmountString
									postFiltered = 0
								}
								else {
									//transfer in
									preFiltered = 0
									postFiltered = instruction.parsed.info.tokenAmount.uiAmountString

								}
								
							}
							let preBal =  preFiltered? preFiltered : 0
							let postBal = postFiltered? postFiltered : 0

							let tokenChange = parseFloat((postBal-preBal).toFixed(decimals))
							
							if (tokenChange != 0) {
								let direction = tokenChange < 0? "Out: " : "In: "
								let tokenName = await fetchTokenData([uniqueToken], utl, showMetadata)
								txn_type = "Transfer"
								var new_line = 
								{
									"signature": item.transaction.signatures[0],
									"timestamp": item.blockTime, 
									"slot": item.slot,
									"success": item.meta?.err == null? true : false,
									"fee": item.meta? item.meta.fee : null,
									"amount": tokenChange,
									"usd_amount": null,
									"mint": uniqueToken,
									"token_name": tokenName,
									"type": txn_type,
									"account_keys": item.transaction.message.accountKeys,
									"pre_balances": item.meta? item.meta.preBalances : null,
									"post_balances": item.meta? item.meta.postBalances : null,
									"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
									"post_token_balances": item.meta? item.meta.postTokenBalances : null,
									"description": customDescripton + " SPL Transfer " + direction + tokenName
								}
								workingArray.push(new_line)
								//console.log(new_line)
							}
						}
						//is ignoring SOL here dangerous?
						break
						
						
						
					}
					else if (instruction.program == "spl-token" && instruction.parsed.type.includes("burn") && instruction.parsed.info.authority == keyIn )  {
						//to catch burns
						let mint = instruction.parsed.info.mint
						let decimals = item.meta.preTokenBalances.filter(line => line.mint == mint)[0].uiTokenAmount.decimals
						let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == mint)[0]?.uiTokenAmount.uiAmount
						let preBal =  preFiltered? preFiltered : 0
						
						let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == mint)[0]?.uiTokenAmount.uiAmount
						let postBal = postFiltered? postFiltered : 0
						txn_type = "Burn"
						let tokenName = await fetchTokenData([mint], utl, showMetadata)
						var new_line = 
						{
							"signature": item.transaction.signatures[0],
							"timestamp": item.blockTime, 
							"slot": item.slot,
							"success": item.meta?.err == null? true : false,
							"fee": item.meta? item.meta.fee : null,
							"amount": item.meta? parseFloat((postBal-preBal).toFixed(decimals)) : null,
							"usd_amount": null,
							"mint": mint,
							"token_name": tokenName,
							"type": txn_type,
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": "Burn SPL Token " + tokenName
						}
						workingArray.push(new_line)

					}
					else if (instruction.program == "spl-token" && instruction.parsed.type == "closeAccount" && instruction.parsed.info.destination == keyIn)  {
						//close account refund incoming
						//instruction.parsed.info.account change in SOL
						let closed_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(instruction.parsed.info.account)
						//console.log("closed account index ", instruction.parsed.info.account,instruction.parsed.info, closed_index)
						let amount = item.meta? (item.meta.postBalances[closed_index] - item.meta.preBalances[closed_index])/web3.LAMPORTS_PER_SOL : 0
						txn_type = "Close Account"
						//if the owner is me then show negative and positive
						if (instruction.parsed.info.owner == keyIn){
							var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": amount,
								"usd_amount": null,
								"mint": "So11111111111111111111111111111111111111112",
								"token_name": "SOL",
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton+ "Closed account " + instruction.parsed.info.account.substring(0,4)
							}
							workingArray.push(new_line)
						}
						var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": -amount,
								"usd_amount": null,
								"mint": "So11111111111111111111111111111111111111112",
								"token_name": "SOL",
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton+ "Closed account " + instruction.parsed.info.account.substring(0,4)
							}
							workingArray.push(new_line)
							//console.log(new_line)
					}
					else if (instruction.program == "spl-associated-token-account" && instruction.parsed.type == "create") {
						//console.log("create SPL account", instruction)
						//change in SOL balance for account index of new account
						//change in token balance for new mint

						let associated_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(instruction.parsed.info.account)
						let account_amount = item.meta? (item.meta.postBalances[associated_index] - item.meta.preBalances[associated_index])/web3.LAMPORTS_PER_SOL : 0

						let tokenName = await fetchTokenData([instruction.parsed.info.mint], utl, showMetadata)
						let additional = 0
						if (instruction.parsed.info.mint == "So11111111111111111111111111111111111111112") {
							//reverse any wrapped sol transfer amounts too
							additional = item.meta.postTokenBalances.filter(item => item.accountIndex == associated_index)[0]?.uiTokenAmount.uiAmount
						}
						txn_type = "Create Account"
						if (instruction.parsed.info.wallet == keyIn) {
							//account created for our benefit
							//An account balance owned by us goes up!
							//what if we give away this account to someone else? then lose the balance in there! Check to catch this
							
							var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": account_amount, //amount of SOL to create account
								"usd_amount": null,
								"mint": "So11111111111111111111111111111111111111112",
								"token_name": "SOL",
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton + "Create SPL Token account for " + tokenName
							}
							workingArray.push(new_line)
						}
						if (instruction.parsed.info.source == keyIn) {
							// SOL out to create the account our cost;
							var new_line = 
							{
								"signature": item.transaction.signatures[0],
								"timestamp": item.blockTime, 
								"slot": item.slot,
								"success": item.meta?.err == null? true : false,
								"fee": item.meta? item.meta.fee : null,
								"amount": -account_amount + additional, //amount of SOL to create account
								"usd_amount": null,
								"mint": "So11111111111111111111111111111111111111112",
								"token_name": "SOL",
								"type": txn_type,
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton + "Create SPL Token account for " + tokenName
							}
							workingArray.push(new_line)
						}
						

					}
					else {
						//generic parsed instruction! if that exists?
					}
					
				} 
			}
			
			


			
			//find balances of key in? 
			//let account_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
			
		}
	}

	async function fetchTokenData(mintsIn, utl, showMetadata) {
		
		let namedToken = "Unknown Token "
		if (mintsIn.length == 1) {
			
			if (showMetadata) {
				
				let existingIndex = fetchedList.flatMap(s => s.mint).indexOf(mintsIn[0])
				if (existingIndex != -1) {
					//console.log("found existing mint ",fetchedList[existingIndex], existingIndex)
					namedToken = fetchedList[existingIndex].name
					return namedToken
				}

				//let utlToken:Token = await utl.fetchMint(new web3.PublicKey(mintIn))
				let utlToken = utl.filter(item => item.address == mintsIn[0])[0]
				if (utlToken == null || utlToken == undefined) {
					try {
						let nftnames = await mtda.getTokenMetadata(new web3.PublicKey(mintsIn[0]));
						//console.log(mintIn, nftnames)
						if (nftnames.name != "")
						{
							namedToken = "" + nftnames.name
							var add_item = {
								"mint": mintsIn[0],
								"name": namedToken
							}
							fetchedList.push(add_item)
						}
						else if (nftnames.symbol != "" && nftnames.uri != "") {
							let response = await fetch(nftnames.uri)
							let data = await response.json()
							namedToken = "" + data.name
							var add_item = {
								"mint": mintsIn[0],
								"name": namedToken
							}
							fetchedList.push(add_item)
						}
						else {
							namedToken = "" + nftnames.json.name
							var add_item = {
								"mint": mintsIn[0],
								"name": namedToken
							}
							fetchedList.push(add_item)
						}
						
					}
					catch {
						console.log("ERROR1 - Could not find token name for: ", mintsIn[0])
					}
				}
				else {
					namedToken = utlToken.symbol
					var add_item = {
						"mint": mintsIn[0],
						"name": namedToken
					}
					fetchedList.push(add_item)
					
				}
			}
			else {
				namedToken = "Unknown Token " + mintsIn[0].substring(0,4)
			}
		}
		else if (mintsIn.length > 1) {
			for await (const mint of mintsIn) {
				

				if (showMetadata) {
					let existingIndex = fetchedList.flatMap(s => s.mint).indexOf(mint)
					if (existingIndex != -1) {
						//console.log("found existing mint ",fetchedList[existingIndex], existingIndex)
						namedToken = namedToken + " " + fetchedList[existingIndex].name
					}
					//let utlToken:Token = await utl.fetchMint(new web3.PublicKey(mintIn))
					let utlToken = utl.filter(item => item.address == mint)[0]
					if (utlToken == null || utlToken == undefined) {
						try {
							let nftnames = await mtda.getTokenMetadata(new web3.PublicKey(mint));
							//console.log(mintIn, nftnames)
							if (nftnames.name != "")
							{
								var add_item = {
									"mint":mint,
									"name": nftnames.name
								}
								fetchedList.push(add_item)
								namedToken = namedToken + " "  + nftnames.name
							}
							else if (nftnames.symbol != "" && nftnames.uri != "") {
								let response = await fetch(nftnames.uri)
								let data = await response.json()
								var add_item = {
									"mint":mint,
									"name": "" + data.name
								}
								fetchedList.push(add_item)
								namedToken = namedToken + " "  + data.name
							}
							else {
								var add_item = {
									"mint":mint,
									"name": "" + nftnames.json.name
								}
								fetchedList.push(add_item)
								namedToken = namedToken + " " + nftnames.json.name
							}
							
						}
						catch {
							console.log("ERROR2 - Could not find token name for: ", mint)
						}
					}
					else {
						var add_item = {
							"mint":mint,
							"name": "" + utlToken.symbol
						}
						fetchedList.push(add_item)
						namedToken = namedToken + " " + utlToken.symbol
					}
				}
				else {
					namedToken = namedToken + " " + mint.substring(0,4)
				}

			}
		}

		return namedToken

	}
	



