import { decodeMetadata } from './MetadataUtils'
import { PublicKey, Connection } from '@solana/web3.js'
import { Buffer } from 'buffer';


const METADATA_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const get_metadataPda = async (address:PublicKey) => {
	let [pda, bump] = await PublicKey.findProgramAddress([
		Buffer.from("metadata"),
		METADATA_PUBKEY.toBuffer(),
		address.toBuffer(),
	], METADATA_PUBKEY)
	return pda
}

export async function getTokenMetadata(token_address:PublicKey) {
	try {
		const token_publickey = token_address
		const metadata_pda = await get_metadataPda(token_publickey);

		const data = {
			"jsonrpc": "2.0",
			"id": 1,
			"method": "getAccountInfo",
			"params": [
				metadata_pda.toBase58(),
				{
					"encoding": "base64"
				}
			]
		}
        
		const metadata_res = await fetch("https://solitary-young-butterfly.solana-mainnet.quiknode.pro/73898ef123ae4439f244d362030abcda8b8aa1e9/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
		}); 
		const metadata_parsed = await metadata_res.json();

		const metadata_buf = Buffer.from(metadata_parsed.result.value.data[0], 'base64');
		const metadata = decodeMetadata(metadata_buf)
		//console.log(metadata)

		//const arweave_res = await fetch(metadata.data.uri)
		//const arweave = await arweave_res.json()
		//console.log("Arweave ", arweave)
        //console.log(metadata)
		return metadata.data 

	} catch (e) {
		console.log(e)
	}
}
export async function getTokensMetadata(token_addresses:PublicKey[]) {
	try {
        let nft_data = []

        for await (const token_address of token_addresses) {
            const token_publickey = token_address
            const metadata_pda = await get_metadataPda(token_publickey);
    
            const data = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getAccountInfo",
                "params": [
                    metadata_pda.toBase58(),
                    {
                        "encoding": "base64"
                    }
                ]
            }
            
            const metadata_res = await fetch("https://solitary-young-butterfly.solana-mainnet.quiknode.pro/73898ef123ae4439f244d362030abcda8b8aa1e9/", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            }); 
            const metadata_parsed = await metadata_res.json();
    
            const metadata_buf = Buffer.from(metadata_parsed.result.value.data[0], 'base64');
            const metadata = decodeMetadata(metadata_buf)
            //console.log(metadata)
            nft_data.push(metadata.data)
            //const arweave_res = await fetch(metadata.data.uri)
            //const arweave = await arweave_res.json()
            
    
            
        }
		return nft_data
	} catch (e) {
		console.log(e)
	}
}
