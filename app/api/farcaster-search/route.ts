import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const address = searchParams.get("address")

  if (!query && !address) {
    return NextResponse.json({ error: "Missing q or address parameter" }, { status: 400 })
  }

  const apiKey = process.env.NEYNAR_API_KEY

  if (!apiKey) {
    console.error("[v0] NEYNAR_API_KEY not configured")
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    let url: string

    if (address) {
      url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${encodeURIComponent(address)}`
    } else {
      url = `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(query!)}&limit=5`
    }

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        api_key: apiKey,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("[v0] Neynar API error:", response.status, text)
      return NextResponse.json({ error: "Neynar API error" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching Neynar data:", error)
    return NextResponse.json({ error: "Failed to fetch Farcaster data" }, { status: 500 })
  }
}
