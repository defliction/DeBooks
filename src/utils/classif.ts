	import * as web3 from '@solana/web3.js';
	import * as mtda from '../utils/Metadata'

	export async function classifyTransaction (item, workingArray, showMetadata, programIDs:string [], account_index, keyIn, feePayer, utl) {
		//MAGIC EDEN TRANSACTIONS >>
		if (programIDs?.includes("M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K")) {
			let me_escrow = "1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix"
			let amount = item.meta? item.meta.postBalances[0] - item.meta.preBalances[0] + item.meta.fee : null
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

			if (item.meta?.logMessages[1].includes(" CancelSell")) {
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
					}
					else {
						descr =  showMetadata? "Magic Eden: Bought via Offer " +  nftnames + " - " + offerAmount + " SOL" : "Magic Eden: Bought via Offer " + "- " + offerAmount + " SOL"
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
					//correct net amount to wallet (net of royalties)
					//let account_index = item.transaction.message.accountKeys.flatMap(s => s.pubkey.toBase58()).indexOf(keyIn.toBase58())
					
					amount = item.meta.postBalances[account_index] - item.meta.preBalances[account_index]

				}
				else {
					descr = showMetadata? "Magic Eden: Bought " + nftnames : "Magic Eden: Bought "
				}

				
			}
			
			else if (item.meta?.logMessages[1].includes(" Buy") ) {
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
					//console.log(item.meta?.logMessages[4].slice(13))
					/*let offerAmount = ""
					item.meta?.logMessages.forEach(function (value) {
						let priceIndex = value.indexOf('{"price"')
						if (priceIndex > 0) {
							try {
								offerAmount = "" + JSON.parse(value.slice(priceIndex)).price/web3.LAMPORTS_PER_SOL
							}
							catch (e) {
								console.log("### WARNING DID NOT PARSE PRICE []", item)
								offerAmount = ""
							}
						}
						});*/
					/*
					if (item.meta?.innerInstructions.length > 0 ){
						try {
							offerAmount = "" + JSON.parse(item.meta?.logMessages[4].slice(13)).price/web3.LAMPORTS_PER_SOL
						}
						catch (e) {
							console.log("### WARNING DID NOT PARSE PRICE 1", item)
							offerAmount = "Unknown"
						}
						
					}
					else {
						try {
							offerAmount = "" + JSON.parse(item.meta?.logMessages[2].slice(13)).price/web3.LAMPORTS_PER_SOL
						}
						catch (e) {
							console.log("### WARNING DID NOT PARSE PRICE 2", item)
							offerAmount = "Unknown"
						}
					}
					*/
					

					descr = showMetadata?  "Magic Eden: Make Offer " +  nftnames : "Magic Eden: Make Offer " //+ " - " + offerAmount + " SOL"
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
				"usd_amount": null,
				"mint": "So11111111111111111111111111111111111111112",
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
		//Foxy Swap
		else if(programIDs.includes("8guzmt92HbM7yQ69UJg564hRRX6N4nCdxWE5L6ENrA8P")) {
			// does it involve my wallet? to add
					// check all instruction accounts flatmapped
					let customDescripton = "FoxySwap"
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
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton +  " Transaction " + direction + await fetchTokenData([uniqueToken], utl, showMetadata)
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
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton +  " Transaction " + direction + await fetchTokenData([uniqueToken], utl, showMetadata)
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
						if(value.includes('Cancel loan request')) {
							try{
								customDescripton = "YAWWW Cancel Loan request " + item.transaction.message.instructions[1].accounts[3].toBase58().substring(0,4) + " -"
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
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton +  " Transaction " + direction + await fetchTokenData([uniqueToken], utl, showMetadata)
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
					
					if (programIDs.includes("JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph") || programIDs.includes("JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo") || programIDs.includes("JUP6i4ozu5ydDCnLiMogSckDPpbtr7BJ4FtzYWkb5Rk") ) {
						customDescripton = "Jup.ag"
					}
					else {
						for (let value of item.meta?.logMessages){
							try {
								if(value.toLowerCase().includes(' stake') || value.toLowerCase().includes(' staking') ) {
									
									customDescripton = "Stake"
									break
								}
								else if (value.toLowerCase().includes(' unstake') || value.toLowerCase().includes(' unstaking')) {
								
									customDescripton = "Unstake"
									break
								}
								else if (value.toLowerCase().includes(' claim') || value.toLowerCase().includes(' claiming')) {
									
									customDescripton = "Claim"
									break
								}
							}
							catch (e) {
								console.log("error in generic text search")
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
								"account_keys": item.transaction.message.accountKeys,
								"pre_balances": item.meta? item.meta.preBalances : null,
								"post_balances": item.meta? item.meta.postBalances : null,
								"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
								"post_token_balances": item.meta? item.meta.postTokenBalances : null,
								"description": customDescripton +  " Transaction " + direction + await fetchTokenData([uniqueToken], utl, showMetadata)
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
								"usd_amount": null,
								"mint": "So11111111111111111111111111111111111111112",
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
								"usd_amount": null,
								"mint": "So11111111111111111111111111111111111111112",
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
						//console.log("decimals", item.meta.postTokenBalances.filter(line => line.mint == mint)[0]?.uiTokenAmount.decimals)
						let decimals = item.meta.postTokenBalances.filter(line => line.mint == mint)[0].uiTokenAmount.decimals
						let preFiltered = item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == mint)[0]?.uiTokenAmount.uiAmount
						console.log(item.meta.preTokenBalances.filter(token => token.owner == keyIn && token.mint == mint), preFiltered)
						let preBal =  preFiltered? preFiltered : 0
						
						let postFiltered = item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == mint)[0]?.uiTokenAmount.uiAmount
						console.log(item.meta.postTokenBalances.filter(token => token.owner == keyIn && token.mint == mint), postFiltered)
						let postBal = postFiltered? postFiltered : 0

						console.log("amounts ", preBal, postBal, parseFloat((postBal-preBal).toFixed(decimals)),  instruction)
						let tokenChange = parseFloat((postBal-preBal).toFixed(decimals))
						let direction = tokenChange < 0? "Out: " : "In: "
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
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": customDescripton + "SPL Transfer " + direction + await fetchTokenData([mint], utl, showMetadata)
						}
						workingArray.push(new_line)
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
								let direction = tokenChange < 0? "Out: " : "In: "
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
									"account_keys": item.transaction.message.accountKeys,
									"pre_balances": item.meta? item.meta.preBalances : null,
									"post_balances": item.meta? item.meta.postBalances : null,
									"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
									"post_token_balances": item.meta? item.meta.postTokenBalances : null,
									"description": customDescripton + " SPL Transfer " + direction + await fetchTokenData([uniqueToken], utl, showMetadata)
								}
								workingArray.push(new_line)
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
							"usd_amount": null,
							"mint": mint,
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": "Burn SPL Token " + await fetchTokenData([mint], utl, showMetadata)
						}
						workingArray.push(new_line)

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
								"usd_amount": null,
								"mint": "So11111111111111111111111111111111111111112",
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
							"amount": amount, //amount of SOL to create account
							"usd_amount": null,
							"mint": "So11111111111111111111111111111111111111112",
							"account_keys": item.transaction.message.accountKeys,
							"pre_balances": item.meta? item.meta.preBalances : null,
							"post_balances": item.meta? item.meta.postBalances : null,
							"pre_token_balances": item.meta? item.meta.preTokenBalances : null,
							"post_token_balances": item.meta? item.meta.postTokenBalances : null,
							"description": customDescripton+ "Create SPL Token account for " + await fetchTokenData([instruction.parsed.info.mint], utl, showMetadata)
						}
						workingArray.push(new_line)
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

	async function fetchTokenData(mintsIn, utl, showMetadata) {
		
		let namedToken = "Unknown Token "
		if (mintsIn.length == 1) {
			
			if (showMetadata) {
				
				//let utlToken:Token = await utl.fetchMint(new web3.PublicKey(mintIn))
				let utlToken = utl.filter(item => item.address == mintsIn[0])[0]
				if (utlToken == null || utlToken == undefined) {
					try {
						let nftnames = await mtda.getTokenMetadata(new web3.PublicKey(mintsIn[0]));
						//console.log(mintIn, nftnames)
						if (nftnames.name != "")
						{
							namedToken = "" + nftnames.name
						}
						else if (nftnames.symbol != "" && nftnames.uri != "") {
							let response = await fetch(nftnames.uri)
							let data = await response.json()
							namedToken = "" + data.name
						}
						else {
							namedToken = "" + nftnames.json.name
						}
						
					}
					catch {
						console.log("ERROR1 - Could not find token name for: ", mintsIn[0])
					}
				}
				else {
					namedToken = utlToken.symbol
				}
			}
			else {
				namedToken = "Unknown Token " + mintsIn[0].substring(0,4)
			}
		}
		else if (mintsIn.length > 1) {
			for await (const mint of mintsIn) {
				

				if (showMetadata) {
				
					//let utlToken:Token = await utl.fetchMint(new web3.PublicKey(mintIn))
					let utlToken = utl.filter(item => item.address == mint)[0]
					if (utlToken == null || utlToken == undefined) {
						try {
							let nftnames = await mtda.getTokenMetadata(new web3.PublicKey(mint));
							//console.log(mintIn, nftnames)
							if (nftnames.name != "")
							{
								namedToken = "" + nftnames.name
							}
							else if (nftnames.symbol != "" && nftnames.uri != "") {
								let response = await fetch(nftnames.uri)
								let data = await response.json()
								namedToken = "" + data.name
							}
							else {
								namedToken = "" + nftnames.json.name
							}
							
						}
						catch {
							console.log("ERROR2 - Could not find token name for: ", mint)
						}
					}
					else {
						namedToken = utlToken.symbol
					}
				}
				else {
					namedToken = namedToken + " " + mint.substring(0,4)
				}

			}
		}
		
		

		return namedToken

	}
	



