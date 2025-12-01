import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const contract = searchParams.get("contract")

  if (!contract) {
    return NextResponse.json({ error: "Missing contract address" }, { status: 400 })
  }

  try {
    console.log("[v0] Fetching collection data from Reservoir for:", contract)
    const res = await fetch(`https://api.reservoir.tools/collections/v5?id=${encodeURIComponent(contract)}`, {
      headers: {
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("[v0] Reservoir error:", res.status, text)
      return NextResponse.json({ error: "Reservoir API error", status: res.status }, { status: 500 })
    }

    const json = await res.json()
    const collection = json.collections?.[0]

    if (!collection) {
      console.log("[v0] Collection not found in Reservoir")
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    const floor = collection.floorAsk?.price?.amount
    const topBid = collection.topBid?.price?.amount

    console.log("[v0] Reservoir data:", {
      floor: floor?.native,
      topOffer: topBid?.native,
      name: collection.name,
    })

    return NextResponse.json({
      collectionFloor: floor?.native ?? null,
      topOffer: topBid?.native ?? null,
      name: collection.name,
      description: collection.description,
      image: collection.image,
      supply: collection.tokenCount,
      owners: collection.ownerCount,
    })
  } catch (error) {
    console.error("[v0] Error fetching Reservoir data:", error)
    return NextResponse.json({ error: "Failed to fetch collection data" }, { status: 500 })
  }
}
