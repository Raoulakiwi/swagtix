# SwagTix Wallet Branding Guide  
_A unified reference for applying the SwagTix look-and-feel across the forked Rabby code-base._

---

## 1. Brand Essence

| Element | Description |
|---------|-------------|
| Logo    | Ticket silhouette with pulse/heartbeat cut-out. Blue → Purple → Pink vertical gradient. |
| Word-mark| “SwagTix” set in bold geometric sans (fallback: **Arial Black**, **Inter Black**). Uses the same gradient, applied as **text-fill via background-clip**. |
| Tagline | “Your NFT Ticket Wallet for PulseChain Events”. |
| Voice   | Energetic, event-centric, inclusive. |

---

## 2. Asset Inventory

| File | Purpose | Usage |
|------|---------|-------|
| `wallet/src/ui/assets/logo.svg` | Stand-alone icon (extension toolbar, launcher, small promo). |
| `wallet/src/ui/assets/logo-with-text.svg` | Horizontal lock-up (splash, onboarding, header). |
| `wallet/src/ui/assets/favicon.svg` | Browser/manifest icon ≈ 64×64. Auto-export PNGs for stores. |
| `wallet/src/ui/views/Splash/` | Animated splash screen showcasing logo & gradient. |
| `wallet/src/ui/styles/swagtix-theme.less` | Global LESS variables & mixins. |
| `wallet/src/ui/utils/theme.ts` | Runtime CSS variable injection & dark-mode switch. |

---

## 3. Colour System

| Token | HEX | Notes |
|-------|-----|-------|
| **@swagtix-blue** | `#00A3FF` | Top of gradient, accent links |
| **@swagtix-purple** | `#7B5BFF` | Primary UI / buttons |
| **@swagtix-pink** | `#FF3D8A` | Alerts / gradient tail |
| **@swagtix-dark** | `#192945` | Heading text, footer bg |
| **@swagtix-light** | `#F5F6FA` | App canvas |

Gradient helpers (LESS):

```less
@primary-gradient:  linear-gradient(to bottom, @swagtix-blue, @swagtix-purple, @swagtix-pink);
@button-gradient:   linear-gradient(to right , @swagtix-purple, @swagtix-pink);
@header-gradient:   linear-gradient(to right , @swagtix-blue  , @swagtix-purple);
```

---

## 4. Global Theme Setup

1. **Import the LESS file** once in `wallet/src/index.less` (or equivalent entry):
   ```less
   @import './ui/styles/swagtix-theme.less';
   ```
2. **Init CSS variables** on boot:
   ```ts
   import { initTheme } from '@/ui/utils/theme';
   initTheme();
   ```
3. **Dark-mode** toggles call `setTheme('light' | 'dark' | 'system')` from the same util.

---

## 5. Component Patterns

### 5.1 Buttons
```jsx
<button className="swagtix-button">Buy Ticket</button>
```
Adds gradient background, subtle hover-lift, no borders.

### 5.2 Tickets
Ticket card border + notches:
```jsx
<div className="swagtix-ticket">
  <div className="swagtix-ticket-content">…</div>
</div>
```

### 5.3 Gradient Text
```jsx
<h1 className="swagtix-gradient-text">SwagTix</h1>
```
or inline:
```jsx
<span style={getGradientTextStyle()}>SwagTix</span>
```

### 5.4 Headers
Use `.swagtix-header` on `div` or Ant `Layout.Header`.

---

## 6. Re-branding Checklist

| Area | Action |
|------|--------|
| **Manifest** | Update `manifest.json` name, description, icons (pull from `favicon.svg` exports). |
| **Extension icon** | Chrome: 16/32/48/128 PNGs from `logo.svg`. |
| **Onboarding / Unlock** | Replace Rabby fox with `LogoSVG` & gradient header background. |
| **About / Settings** | Update copy & external links (SwagTix site, privacy, terms). |
| **Emails** | Use logo-with-text in footer of ticket confirmation mails sent by Supabase. |
| **Mobile Splash (Capacitor)** | Set `resources/splash.*` from `logo-with-text.svg` on dark bg `#192945`. |
| **Dark Mode** | Verify ticket notches & QR contrast (white QR on dark bg). |

---

## 7. Accessibility

• Maintain WCAG AA contrast for text >14 px (gradient text passes when clipped).  
• Provide alt text: `"SwagTix logo – ticket with heartbeat icon"`.  
• Ensure focus states use **@swagtix-blue** outline.

---

## 8. Testing

1. `yarn build:dev` → load as unpacked extension; confirm icon appears.  
2. Run wallet, toggle dark-mode, inspect CSS variables.  
3. Lighthouse ★ mobile > 80 performance with splash.  
4. Browser favicon in new tab matches logo.  

---

## 9. Future Enhancements

- Animated **pulse** line on hover for logo (CSS keyframes).  
- Themed QR code colours (ensure scanner compatibility).  
- In-app confetti after successful ticket scan using gradient particles.

---

### Maintainers

For new UI contributions **always** reference the variables in `swagtix-theme.less` or helpers in `theme.ts`.  
Questions → `#design` channel or @RaoulAnderson.
