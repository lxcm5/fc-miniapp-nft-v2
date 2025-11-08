"use client"

import { Card } from "@/components/ui/card"
import Image from "next/image"

interface NFT {
  id: string
  name: string
  collection: string
  image: string
}

const mockNFTs: NFT[] = [
  {
    id: "1",
    name: "Bored Ape #3425",
    collection: "BAYC",
    image: "/colorful-abstract-ape-art.jpg",
  },
  {
    id: "2",
    name: "CryptoPunk #7804",
    collection: "CryptoPunks",
    image: "/pixel-art-punk-character.jpg",
  },
  {
    id: "3",
    name: "Azuki #4291",
    collection: "Azuki",
    image: "/anime-character-art.jpg",
  },
  {
    id: "4",
    name: "Doodle #6547",
    collection: "Doodles",
    image: "/colorful-doodle-character.png",
  },
  {
    id: "5",
    name: "Moonbird #2189",
    collection: "Moonbirds",
    image: "/owl-bird-art.jpg",
  },
  {
    id: "6",
    name: "Clone X #4762",
    collection: "Clone X",
    image: "/futuristic-character-art.jpg",
  },
]

export function NFTGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {mockNFTs.map((nft) => (
        <Card
          key={nft.id}
          className="overflow-hidden border-border hover:shadow-lg transition-shadow cursor-pointer bg-card"
        >
          <div className="aspect-square relative bg-muted">
            <Image src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-sm text-foreground truncate">{nft.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{nft.collection}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
