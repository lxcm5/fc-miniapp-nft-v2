import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const contract = searchParams.get("contract")
  const tokenId = searchParams.get("tokenId")
  const collectionSlug = searchParams.get("collectionSlug")

  if (!contract || !tokenId) {
    return NextResponse.json({ error: "Missing contract or tokenId" }, { status: 400 })
  }

  const apiKey = process.env.OPENSEA_API_KEY

  if (!apiKey) {
    console.error("[v0] OpenSea API key not configured")
    return NextResponse.json({ error: "OpenSea API key not configured" }, { status: 500 })
  }

  try {
    let collectionFloor = null
    let topOffer = null

    if (collectionSlug) {
      console.log("[v0] Fetching collection stats for:", collectionSlug)
      const statsResponse = await fetch(`https://api.opensea.io/api/v2/collections/${collectionSlug}/stats`, {
        headers: {
          "X-API-KEY": apiKey,
        },
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log("[v0] Collection stats:", JSON.stringify(statsData, null, 2))
        collectionFloor = statsData.total?.floor_price || null
      } else {
        console.error("[v0] Collection stats error:", statsResponse.status, await statsResponse.text())
      }
    }

    if (contract && tokenId) {
      console.log("[v0] Fetching best offer for:", contract, tokenId)
      const offerResponse = await fetch(
        `https://api.opensea.io/api/v2/offers/collection/base/${contract}/nfts/${tokenId}/best`,
        {
          headers: {
            "X-API-KEY": apiKey,
          },
        },
      )

      if (offerResponse.ok) {
        const offerData = await offerResponse.json()
        console.log("[v0] Best offer data:", JSON.stringify(offerData, null, 2))
        topOffer = offerData.price?.value || null
      } else {
        console.error("[v0] Best offer error:", offerResponse.status, await offerResponse.text())
      }
    }

    console.log("[v0] Returning OpenSea data:", { collectionFloor, topOffer })
    return NextResponse.json({
      collectionFloor,
      topOffer,
    })
  } catch (error) {
    console.error("[v0] Error fetching OpenSea data:", error)
    return NextResponse.json({ error: "Failed to fetch OpenSea data" }, { status: 500 })
  }
}
