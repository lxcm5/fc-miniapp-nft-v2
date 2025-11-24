import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const walletAddress = searchParams.get("address")

  if (!walletAddress) {
    return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
  }

  try {
    let allNFTs: any[] = []
    let pageKey: string | undefined = undefined

    do {
      const alchemyUrl = `https://base-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${walletAddress}&withMetadata=true&pageSize=100${pageKey ? `&pageKey=${pageKey}` : ""}`

      const response = await fetch(alchemyUrl)
      const data = await response.json()

      if (data.ownedNfts && data.ownedNfts.length > 0) {
        allNFTs = [...allNFTs, ...data.ownedNfts]
      }

      pageKey = data.pageKey
    } while (pageKey)

    return NextResponse.json({ nfts: allNFTs })
  } catch (error) {
    console.error("[v0] Error fetching NFTs:", error)
    return NextResponse.json({ error: "Failed to fetch NFTs" }, { status: 500 })
  }
}
