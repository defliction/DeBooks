


export async function fetchImage(uriIn) {
    //console.log("fetching ", uriIn)
    try {
        let image_url = await fetch(uriIn)
        //console.log("fetched ", image_url)
        let image_link = await image_url.json()
        //transaction.uri
        return image_link.image
    }
    catch (e) {
        console.log("Failed to fetch image", e)
    }
    
}
