import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const contract = searchParams.get("contract")

  console.log("[v0] API route called with contract:", contract)

  if (!contract) {
    console.log("[v0] Missing contract parameter")
    return NextResponse.json({ error: "Missing contract address" }, { status: 400 })
  }

  const apiKey = process.env.OPENSEA_API_KEY

  if (!apiKey) {
    console.error("[v0] OPENSEA_API_KEY not configured")
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    // First, get the collection slug from the contract address
    console.log("[v0] Fetching collection info from OpenSea for contract:", contract)

    const nftUrl = `https://api.opensea.io/api/v2/chain/base/contract/${contract}/nfts?limit=1`
    console.log("[v0] Fetching NFT URL:", nftUrl)

    const nftResponse = await fetch(nftUrl, {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    })

    console.log("[v0] OpenSea NFT response status:", nftResponse.status)

    if (!nftResponse.ok) {
      const text = await nftResponse.text()
      console.error("[v0] OpenSea NFT error:", nftResponse.status, text)
      return NextResponse.json({ error: "OpenSea API error", status: nftResponse.status }, { status: 500 })
    }

    const nftData = await nftResponse.json()
    console.log("[v0] NFT data response:", JSON.stringify(nftData, null, 2))

    const collectionSlug = nftData.nfts?.[0]?.collection

    if (!collectionSlug) {
      console.log("[v0] No collection slug found")
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    console.log("[v0] Found collection slug:", collectionSlug)

    // Now get collection stats using the slug
    const statsUrl = `https://api.opensea.io/api/v2/collections/${collectionSlug}/stats`
    console.log("[v0] Fetching stats URL:", statsUrl)

    const statsResponse = await fetch(statsUrl, {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    })

    console.log("[v0] Stats response status:", statsResponse.status)

    if (!statsResponse.ok) {
      const text = await statsResponse.text()
      console.error("[v0] OpenSea stats error:", statsResponse.status, text)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    const statsData = await statsResponse.json()
    console.log("[v0] Stats data:", JSON.stringify(statsData, null, 2))

    // Get collection details for description
    const collectionUrl = `https://api.opensea.io/api/v2/collections/${collectionSlug}`
    const collectionResponse = await fetch(collectionUrl, {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    })

    let description = null
    let supply = null

    if (collectionResponse.ok) {
      const collectionData = await collectionResponse.json()
      console.log("[v0] Collection data:", JSON.stringify(collectionData, null, 2))
      description = collectionData.description
      supply = collectionData.total_supply
    }

    const floor = statsData.total?.floor_price
    const topOffer = statsData.total?.best_offer

    console.log("[v0] Extracted - Floor:", floor, "Top Offer:", topOffer, "Supply:", supply)

    return NextResponse.json({
      collectionFloor: floor ?? null,
      topOffer: topOffer ?? null,
      description: description ?? null,
      supply: supply ?? null,
    })
  } catch (error) {
    console.error("[v0] Error fetching OpenSea data:", error)
    return NextResponse.json({ error: "Failed to fetch collection data" }, { status: 500 })
  }
}
