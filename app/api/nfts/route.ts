import { type NextRequest, NextResponse } from "next/server"

function parseWeiToEth(raw?: string): number {
  if (!raw) return 0

  try {
    // Alchemy usually returns amount as string (hex or decimal)
    const valueBigInt = raw.startsWith("0x") ? BigInt(raw) : BigInt(raw)
    return Number(valueBigInt) / 1e18
  } catch (e) {
    console.warn("[v0 API] Failed to parse amount:", raw, e)
    return 0
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const walletAddress = searchParams.get("address")
  const history = searchParams.get("history")
  const tokenId = searchParams.get("tokenId")
  const contractAddress = searchParams.get("contractAddress")

  if (history === "true" && contractAddress) {
    try {
      console.log("[v0 API] Fetching collection sales history for:", contractAddress)

      const alchemyUrl = `https://base-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTSales?contractAddress=${contractAddress}&order=desc&limit=100`

      const response = await fetch(alchemyUrl)
      if (!response.ok) {
        console.error("[v0 API] Alchemy response not ok:", response.status, await response.text())
        return NextResponse.json({ sales: [] })
      }

      const data = await response.json()
      console.log("[v0 API] Raw Alchemy response:", JSON.stringify(data, null, 2))

      if (data.nftSales && data.nftSales.length > 0) {
        type DayAgg = { total: number; count: number }

        const salesByDate = data.nftSales.reduce((acc: Record<string, DayAgg>, sale: any) => {
          // Sum all fees to get total sale price
          const sellerEth = parseWeiToEth(sale.sellerFee?.amount)
          const protocolEth = parseWeiToEth(sale.protocolFee?.amount)
          const royaltyEth = parseWeiToEth(sale.royaltyFee?.amount)

          const priceInEth = sellerEth + protocolEth + royaltyEth

          if (!priceInEth || !Number.isFinite(priceInEth) || priceInEth <= 0) {
            console.log("[v0 API] Sale without valid price:", {
              sellerEth,
              protocolEth,
              royaltyEth,
            })
            return acc
          }

          // Normalized date key - YYYY-MM-DD
          const iso = sale.blockTimestamp // "2025-12-05T10:11:12Z"
          const dateKey = iso ? iso.slice(0, 10) : new Date().toISOString().slice(0, 10)

          if (!acc[dateKey]) {
            acc[dateKey] = { total: 0, count: 0 }
          }

          acc[dateKey].total += priceInEth
          acc[dateKey].count += 1

          return acc
        }, {})

        const chartData = Object.entries(salesByDate)
          .map(([date, agg]) => ({
            date, // format "2025-12-05"
            price: agg.total / agg.count,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        console.log("[v0 API] Final chart data:", chartData)

        return NextResponse.json({ sales: chartData })
      }

      console.log("[v0 API] No sales found in response")
      return NextResponse.json({ sales: [] })
    } catch (error) {
      console.error("[v0 API] Error fetching sales history:", error)
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
