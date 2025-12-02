import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const walletAddress = searchParams.get("address")
  const history = searchParams.get("history")
  const tokenId = searchParams.get("tokenId")
  const contractAddress = searchParams.get("contractAddress")

  if (history === "true" && contractAddress) {
    try {
      console.log("[v0] Fetching collection sales history for:", contractAddress)

      // Use Alchemy to get recent sales for the entire collection
      const alchemyUrl = `https://base-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTSales?contractAddress=${contractAddress}&order=desc&limit=100`

      const response = await fetch(alchemyUrl)
      const data = await response.json()

      console.log("[v0] Collection sales data from Alchemy:", data)

      if (data.nftSales && data.nftSales.length > 0) {
        // Group sales by date and calculate average price per day
        const salesByDate = data.nftSales.reduce((acc: any, sale: any) => {
          const date = new Date(sale.blockTimestamp).toLocaleDateString()
          const price = Number.parseFloat(sale.sellerFee?.amount || "0")

          if (!acc[date]) {
            acc[date] = { total: 0, count: 0 }
          }
          acc[date].total += price
          acc[date].count += 1

          return acc
        }, {})

        // Convert to array of {date, price} for chart
        const chartData = Object.entries(salesByDate)
          .map(([date, data]: [string, any]) => ({
            date,
            price: data.total / data.count, // Average price for the day
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        return NextResponse.json({ sales: chartData })
      }

      return NextResponse.json({ sales: [] })
    } catch (error) {
      console.error("[v0] Error fetching sales history:", error)
      return NextResponse.json({ error: "Failed to fetch sales history" }, { status: 500 })
    }
  }

  if (history === "true" && walletAddress && tokenId) {
    try {
      console.log("[v0] Fetching sales history for:", walletAddress, tokenId)

      const alchemyUrl = `https://base-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTSales?contractAddress=${walletAddress}&tokenId=${tokenId}&order=desc&limit=50`

      const response = await fetch(alchemyUrl)
      const data = await response.json()

      console.log("[v0] Sales data from Alchemy:", data)

      if (data.nftSales && data.nftSales.length > 0) {
        const sales = data.nftSales.map((sale: any) => ({
          timestamp: sale.blockTimestamp,
          price: sale.sellerFee?.amount || 0,
          buyer: sale.buyerAddress,
          seller: sale.sellerAddress,
        }))

        return NextResponse.json({ sales })
      }

      return NextResponse.json({ sales: [] })
    } catch (error) {
      console.error("[v0] Error fetching sales history:", error)
      return NextResponse.json({ error: "Failed to fetch sales history" }, { status: 500 })
    }
  }

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
