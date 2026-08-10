# Bagel Days — React site

A React (Vite) rewrite of the Bagel Days website: Home, About Us, Menu & Order
(with cart), Pickup Order, Visit Us, Contact, and Checkout.

## Getting started

```bash
npm install
npm run dev
```

Opens a local dev server (usually http://localhost:5173) with hot reload.

## Build for production

```bash
npm run build
```

Outputs static files to `dist/`. Preview the production build locally with:

```bash
npm run preview
```

## Deploying

This is a client-side routed single-page app (React Router). When you deploy
it, your host needs to serve `index.html` for every route (so refreshing
`/menu` or `/about` doesn't 404). Two ready-made configs are included:

- **Netlify**: `public/_redirects` is already set up — just deploy the repo
  or the `dist/` folder.
- **Vercel**: `vercel.json` at the project root handles the rewrite.

Any other static host (S3+CloudFront, your own server, etc.) needs an
equivalent "serve index.html for unknown paths" rule.

## Where things live

- `src/pages/` — one file per page (Home, About, Menu, Pickup, Visit, Contact, Checkout)
- `src/components/` — shared UI (Header, Footer, cart drawer, food cards, icons)
- `src/context/CartContext.jsx` — the cart (add/remove/qty), persisted to
  `localStorage` so it survives page navigation and refreshes
- `src/data/products.js` — every menu item, price, and image path in one place —
  edit here to change the menu
- `src/styles.css` — all styling (plain CSS, no framework)
- `public/assets/images/` — placeholder images (see note below)

## Before this goes live — TODO checklist

1. **Real photos**: `public/assets/images/` currently has illustrated
   placeholders (no internet image sourcing was available while building
   this). Swap in real photography — same filenames, same folder, and
   everything updates automatically.
2. **Business details**: address, phone, and hours are hardcoded in a few
   places (`Home.jsx`, `Visit.jsx`, `Footer.jsx`, the JSON-LD in `index.html`
   if you add it back for a static export). Search the codebase for
   "Fortitude Valley" / "TODO" to find them all.
3. **Uber Eats / DoorDash links**: search for `TODO` in `Home.jsx` and
   `Pickup.jsx` and replace with your real store URLs.
4. **Contact form**: `src/pages/Contact.jsx` posts to Formspree. Create a
   free account at formspree.io, connect a form to your inbox, and replace
   `TODO_FORM_ID`.
5. **Square payments**: `src/pages/Checkout.jsx` uses Square's Web Payments
   SDK to tokenize cards in the browser, but actually charging a card
   requires a backend (for security, Square requires your private access
   token to stay server-side). A minimal reference backend is in
   `/server-example`. Steps:
   - Create a Square account, get your Application ID and Location ID
   - Replace `SQUARE_APP_ID` / `SQUARE_LOCATION_ID` in `Checkout.jsx`
   - Deploy `/server-example` (or your own equivalent) and point
     `PAYMENT_ENDPOINT` at it
   - Switch `SQUARE_SDK_URL` from sandbox to production when ready

## A note on this build

`npm install` / `npm run build` could not be run in the environment this was
built in (no registry access there), so the production build hasn't been
verified end-to-end by me. The code was written and reviewed carefully, but
please run `npm install && npm run dev` first and let me know if anything
doesn't compile — happy to fix it immediately.
