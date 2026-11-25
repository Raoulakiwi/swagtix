# swagtix

Guide for Claude (interactive sessions and the factory workflow).

## Stack
Next.js pages router + ethers; ERC-1155 ticket contract (`EventTicket1155.sol`); Supabase; wallet + mobile-app subfolders.

## Before you change things, read
- README.md
- IMPLEMENTATION_STATUS.md
- WALLET_ROADMAP.md
- WALLET_BRANDING.md

## Sensitive areas
Smart contract and anything that signs or sends transactions - contract changes are one-way doors.

## Notes
`node_modules/` is partly committed to git; don't add to or commit it.

## Commands
```sh
# install
npm ci
# checks (run all before every PR)
npm run build
# run
npm run dev  # http://localhost:3000
```

## Factory
Issues labelled `factory` run through `.claude/factory/BLUEPRINT.md` (triage -> spec -> implement -> verify -> merge risk -> PR).
Skills: `.claude/skills/factory-triage`, `verify-with-proof`, `merge-risk`. Use them in interactive sessions too.

## Verification gotchas
<!-- Append one line per lesson learned while verifying (ports, env vars, logins, flaky selectors). -->
