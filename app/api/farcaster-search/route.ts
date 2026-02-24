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

    console.log("[v0] Neynar raw response keys:", Object.keys(data))
    console.log("[v0] Neynar raw response:", JSON.stringify(data).slice(0, 500))

    // Normalize response for ?q= search:
    // Neynar v2 may return { users: [...] } without the "result" wrapper,
    // but the client expects { result: { users: [...] } }
    if (query && !address) {
      if (data.users && !data.result) {
        console.log("[v0] Wrapping Neynar response in { result: { users } } format")
        const normalized = { result: { users: data.users } }
        console.log("[v0] Proxy returning normalized:", JSON.stringify(normalized).slice(0, 500))
        return NextResponse.json(normalized)
      }
      console.log("[v0] Neynar response already has result.users, passing through")
    }

    console.log("[v0] Proxy returning data as-is")
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching Neynar data:", error)
    return NextResponse.json({ error: "Failed to fetch Farcaster data" }, { status: 500 })
  }
}
