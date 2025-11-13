# NFT aWallet - Version History

## Version 1.6 (Current)
**Date:** January 2025

### Features Added:
- Send NFT modal with Farcaster Wallet style UI
  - Recipient selection (address or username input)
  - My verified addresses section
  - Recents section
  - Two-step confirmation flow
- Changed "Hidden" button to "Hidden NFTs"
- Fixed NFT card sizing for grid modes 3 and 4 (removed padding, fit to image boundaries)
- Fixed NFT card sizing for grid mode 2 (minimized height with compact text)
- Hidden descriptions for grid modes 3 and 4
- Fixed floor price calculation to only include NFTs with valid floor prices
- Improved NFT statistics accuracy in wallet balance

### Known Issues:
- Hidden NFTs sync uses localStorage (device-specific)
- Need backend solution for cross-device Hidden NFTs synchronization

---

## Version 1.5
**Date:** January 2025

### Features Added:
- Multi-select NFT functionality with long press
- Bulk actions (Send and Hide) for selected NFTs
- Hidden NFTs page with separate view
- Hide/Unhide functionality for individual NFTs
- Selection mode UI with checkmarks
- Bottom action bar for bulk operations

---

## Version 1.4
**Date:** January 2025

### Features Added:
- Grid mode switcher (2, 3, 4 columns, and list view)
- NFT detail page with full information
- Collection, Token ID, Floor price, Chain display
- Marketplace links (OpenSea)
- Action buttons: List for sale, Send, Hide

---

## Version 1.3
**Date:** January 2025

### Features Added:
- Real NFT loading from connected wallet via Alchemy API
- Pagination support for loading all NFTs (50+ NFTs)
- NFT statistics in wallet balance (count and total floor value)
- Base network integration
- Floor price display from OpenSea metadata

---

## Version 1.2
**Date:** January 2025

### Features Added:
- Farcaster SDK integration
- Wallet connection functionality
- ETH balance display with USD conversion
- Persistent wallet connection (localStorage)
- Automatic wallet address detection from Farcaster context

---

## Version 1.1
**Date:** January 2025

### Features Added:
- Farcaster Frame manifest and meta tags
- Preview Tool compatibility
- Base network RPC configuration
- SDK ready() call for proper Frame initialization

---

## Version 1.0
**Date:** January 2025

### Initial Release:
- NFT aWallet interface with Farcaster Wallet styling
- Wallet balance card
- NFT grid display (placeholder images)
- Light theme with rounded cards
- Responsive design
- Next.js 16 App Router setup
- TypeScript configuration
- Tailwind CSS v4
