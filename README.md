# SwagTix ‑ NFT Ticketing Platform

SwagTix is an **end-to-end solution for creating, selling and validating NFT-based event tickets**.  
It combines a modern Next.js storefront, Solidity smart contracts and a purpose-built wallet (forked from Rabby) that runs on the PulseChain network.

## Repository Structure

```
.
├── README.md                ← you are here
├── components/              ← React UI pieces for the web app
├── hooks/                   ← shared React hooks
├── pages/                   ← Next.js routes (shop, checkout, etc.)
├── src/
│   └── lib/stripe.ts        ← payment helpers
├── supabase/                ← edge functions & DB migrations
├── EventTicket1155.sol      ← ERC-1155 ticket contract
├── wallet/                  ← Forked Rabby wallet (cut-down)
│   ├── src/…                ← extension / mobile code
│   └── package.json         ← wallet-specific deps & scripts
└── …
```

### Key Components

| Path | Purpose |
|------|---------|
| **Next.js App** (`pages`, `components`) | Customer-facing storefront for browsing events and purchasing tickets (Stripe Checkout). |
| **Smart Contract** (`EventTicket1155.sol`) | Dynamic ERC-1155 that shows a QR code before the event and media afterwards. |
| **Supabase Edge Functions** (`supabase/functions`) |  Payment webhook → mints tickets, emails confirmation. |
| **Wallet** (`wallet/`) | Fork of Rabby Wallet trimmed down to: NFT display, transaction signing, Web3Auth email login. DeFi, swaps & multi-chain UI removed. PulseChain RPC/chainId hard-coded for a friction-less experience. |
| **Migrations** (`supabase/migrations`) | Database schema for orders & users. |

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| Yarn / npm | latest |
| Solidity compiler | via Hardhat/Foundry |
| Supabase CLI | optional for local dev |

### 1. Web App

```bash
# install root deps
npm install
# run dev server at http://localhost:3000
npm run dev
```

Environment variables required (see `.env.example`):

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
STRIPE_SECRET_KEY=sk_test_...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### 2. Ticket Contract

```bash
# compile & test
npx hardhat test
# deploy to PulseChain
npx hardhat run scripts/deploy.ts --network pulsechain
```

### 3. Wallet (forked Rabby)

```bash
cd wallet
yarn install
# development build (extension hot-reload)
yarn build:dev
```

After building, load `wallet/dist` as an **unpacked extension** in Chrome or use Capacitor/Ionic to wrap it for iOS & Android.

## Customisation Notes

* **Web3Auth** integration lives in `wallet/src/background/service/web3auth.ts`.
* PulseChain config is defined in `wallet/src/constant/networks.ts` – change RPC URL if you run your own node.
* To add event-specific metadata to “My Tickets”, edit `wallet/src/ui/views/NFTTickets/`.

## Roadmap

- [x] Fork Rabby into `wallet/`
- [x] Strip non-ticket features
- [ ] Finish “My Tickets” QR view
- [ ] Mobile wrapper builds (Capacitor)
- [ ] In-app ticket transfer & scanning

Contributions welcome! See `CONTRIBUTING.md` for guidelines.
