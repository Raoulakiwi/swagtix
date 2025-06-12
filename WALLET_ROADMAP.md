# Wallet Customization Roadmap  
_Rabby → SwagTix NFT Ticket Wallet (PulseChain)_

| Phase | Timeline* | Key Deliverables | Owner |
|-------|-----------|------------------|-------|
| 0. Bootstrap | **DONE** | `wallet/` sub-dir with Rabby source (git history stripped) | Core |
| 1. Minimal Compile | W1 | `yarn install` & `yarn build:dev` works inside `wallet/` on desktop Chrome | Core |
| 2. PulseChain Only | W1 | • `/src/constant/networks.ts` reduced to PulseChain<br>• Background auto-connect to RPC `https://rpc.pulsechain.com` (chainId 0x171)<br>• Remove ChainSelector UI | Core |
| 3. De-Feature | W1-W2 | Strip non-ticket modules:<br>- Swap & DeFi views (`src/ui/views/Swap*`, `service/swap.ts`)<br>- Token analytics & approvals<br>- Multi-chain & custom RPC logic<br>Outcome: wallet boots with **Assets, NFTs, Settings** only | Core |
| 4. Auth Refactor | W2 | Integrate **Web3Auth** email login<br>• `background/service/web3auth.ts` provider<br>• Hide seed phrase + hardware wallet screens<br>• Link existing Rabby keyring to Web3Auth signer | Auth |
| 5. “My Tickets” View | W2-W3 | New route `src/ui/views/NFTTickets/` (default home)<br>UI components:<br>• Ticket card with Event Name, Date, Venue<br>• QR code (generate via `qrcode.react`)<br>• Status badge (Upcoming, Used, Expired)<br>Data source:<br>• Scan `EventTicket1155` balanceOf for user<br>• Fetch on-chain `uri()` JSON<br>MVP loads first 50 tokenIds | Frontend |
| 6. Ticket Actions | W3 | • Transfer ticket (safeTransferFrom wrapper)<br>• Present ticket (full-screen QR)<br>• Mark “used” via event subgraph (nice-to-have) | Frontend / Chain |
| 7. Mobile Builds | W4 | Capacitor wrapper:<br>• iOS (.ipa) & Android (.apk)<br>• Secure storage for keyring<br>• Deep-link scheme `swagtix://` to open tickets | Mobile |
| 8. QA & Release | W4 | • Unit tests for removed features<br>• E2E Cypress: login → view ticket → sign tx<br>• Audit dependency list (remove unused) | QA |

\*Timelines assume 1-week sprints; adjust based on team capacity.

---

## Technical Checklist

### A. Feature Removal
- [ ] Delete `src/ui/views/Swap*`, `service/swap.ts`, DeFi API hooks.
- [ ] Update `navigation.tsx` to hide removed routes.
- [ ] Purge redux/zustand slices related to swaps, rates, approvals.

### B. PulseChain Hard-coding
- [ ] **RPC** `https://rpc.pulsechain.com`
- [ ] **ChainId** `0x171` (369)
- [ ] Explorer links → `https://scan.pulsechain.com`
- [ ] Asset symbol override `PLS`

### C. Web3Auth Integration
- [ ] Add `@web3auth/modal` & `@web3auth/evm-adapter`.
- [ ] Replace unlock flow in `src/ui/views/Unlock/`.
- [ ] Persist OAuth token ↔ wallet key in encrypted local storage.

### D. “My Tickets” UI
- Component tree:
  ```
  NFTTickets/
    ├─ TicketList.tsx
    ├─ TicketCard.tsx
    └─ TicketQRModal.tsx
  ```
- Use ethers v5 for contract calls; memoize with SWR.

### E. Mobile Packaging
- Capacitor config in `wallet/capacitor.config.ts`.
- Ionic WebView + backgroundScript injection permission.
- Push to TestFlight / Play Console (internal track).

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Web3Auth SDK size | Large bundle | Tree-shake, dynamic import |
| QR code spoofing | Ticket fraud | Sign payload with contract address & tokenId |
| PulseChain RPC downtime | App unusable | Add fallback RPC env var |

---

## Acceptance Criteria

1. Fresh user can **install app on phone**, sign-in with email, and **view their tickets** within 30 s.
2. Only PulseChain network visible; attempts to switch show “Not supported”.
3. No DeFi / swap UI accessible.
4. Lighthouse mobile perf ≥ 80.
5. Ticket ownership reflects on-chain within 1 block of transfer.

---

### Contributors

- **Core Lead:** Raoul Anderson  
- **Frontend:** @username  
- **Smart Contracts:** @username  
- **Mobile:** @username  
- **QA:** @username  

_Update this roadmap as tasks complete. PRs should reference phase & checklist item._  
