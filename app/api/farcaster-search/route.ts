import { type NextRequest, NextResponse } from "next/server"

// Transform Warpcast user object to the format the client expects (Neynar-compatible)
function transformUser(user: any, ethAddresses: string[]) {
  return {
    fid: user.fid,
    username: user.username,
    display_name: user.displayName || user.username,
    pfp_url: user.pfp?.url || null,
    custody_address: null,
    verified_addresses: {
      eth_addresses: ethAddresses,
    },
  }
}

// Fetch verified ETH addresses for a given fid from Warpcast
async function fetchVerifications(fid: number): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.warpcast.com/v2/verifications?fid=${fid}`,
      { headers: { accept: "application/json" } },
    )

    if (!res.ok) {
      console.error("[v0] Warpcast verifications error for fid", fid, ":", res.status)
      return []
    }

    const data = await res.json()
    const verifications = data.result?.verifications || []
    const addresses = verifications
      .map((v: any) => v.address)
      .filter((a: any) => typeof a === "string" && a.startsWith("0x"))

    console.log("[v0] Verifications for fid", fid, ":", addresses)
    return addresses
  } catch (err) {
    console.error("[v0] Error fetching verifications for fid", fid, ":", err)
    return []
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const address = searchParams.get("address")

  if (!query && !address) {
    return NextResponse.json({ error: "Missing q or address parameter" }, { status: 400 })
  }

  try {
    // --- Address search: find user by verified address ---
    if (address) {
      console.log("[v0] Warpcast address lookup:", address)

      const res = await fetch(
        `https://api.warpcast.com/v2/user-by-verification?address=${encodeURIComponent(address)}`,
        { headers: { accept: "application/json" } },
      )

      if (!res.ok) {
        console.error("[v0] Warpcast user-by-verification error:", res.status)
        return NextResponse.json({})
      }

      const data = await res.json()
      console.log("[v0] Warpcast user-by-verification response:", JSON.stringify(data).slice(0, 500))

      const user = data.result?.user
      if (!user) {
        console.log("[v0] No user found for address:", address)
        return NextResponse.json({})
      }

      // Fetch all verified addresses for this user
      const ethAddresses = await fetchVerifications(user.fid)

      // Client expects: { "0xaddress": [user, ...] }
      const result = {
        [address.toLowerCase()]: [transformUser(user, ethAddresses.length > 0 ? ethAddresses : [address.toLowerCase()])],
      }

      console.log("[v0] Proxy returning address result:", JSON.stringify(result).slice(0, 500))
      return NextResponse.json(result)
    }

    // --- Username search via Neynar by_username ---
    const neynarApiKey = process.env.NEYNAR_API_KEY
    if (!neynarApiKey) {
      console.error("[v0] NEYNAR_API_KEY not set")
      return NextResponse.json({ error: "NEYNAR_API_KEY not configured" }, { status: 500 })
    }

    const url = `https://api.neynar.com/v2/farcaster/user/by_username?username=${encodeURIComponent(query!)}`
    console.log("[v0] Neynar by_username URL:", url)

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        api_key: neynarApiKey,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("[v0] Neynar API error:", response.status, text)
      if (response.status === 404) {
        return NextResponse.json({ result: { users: [] } })
      }
      return NextResponse.json({ error: "Neynar API error" }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Neynar by_username response:", JSON.stringify(data).slice(0, 500))

    const user = data.user
    if (!user) {
      return NextResponse.json({ result: { users: [] } })
    }

    // Neynar already returns the format the client expects
    const result = { result: { users: [user] } }
    console.log("[v0] Proxy returning search result:", JSON.stringify(result).slice(0, 500))
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching Warpcast data:", error)
    return NextResponse.json({ error: "Failed to fetch Farcaster data" }, { status: 500 })
  }
}
