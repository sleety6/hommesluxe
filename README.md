# HOMMESLUXE website starter

A responsive React, Vite and TypeScript starter for a Ghanaian fashion and occasionwear brand. It includes a home page, filterable collections, product detail popups, an about page, contact page, mobile menu and reduced motion support.

**This is a visual starter, not a live shop.** Product names, descriptions, contact address and image areas are samples. There is no checkout, payment connection, inventory or order system.

## Open it in VS Code

1. Install **Node.js LTS** from [nodejs.org](https://nodejs.org/) if you do not already have it. Close and reopen VS Code after installing.
2. Unzip `hommesluxe-starter.zip`.
3. Open VS Code. Choose **File → Open Folder** and select the unzipped `hommesluxe-starter` folder (the one containing `package.json`).
4. In VS Code choose **Terminal → New Terminal**.
5. Type `npm install` and press Enter. Wait for it to finish.
6. Type `npm run dev` and press Enter.
7. Open the local address shown in the terminal, usually `http://localhost:5173/`.
8. To stop the local website, click the terminal and press **Ctrl+C**.

If Windows PowerShell blocks `npm`, run `npm.cmd install` and `npm.cmd run dev` instead.

## Add your photos

1. Put photos you own or have permission to use inside `public/images/`.
2. Open `src/data.ts`. For each product, change `image: ''` to a path such as `image: '/images/amani.jpg'`.
3. The large home and about photo slots are in `src/App.tsx`. Replace their `<ImageSlot ... />` elements with your own `<img src="/images/your-photo.jpg" alt="Describe the photo" />` elements. Add CSS sizing as needed.
4. Refresh the site in your browser. Vite usually refreshes automatically.

The 13 supplied fashion photos are included in `public/images/` and already connected to the catalogue. Only use them publicly if you have the necessary permission from the photographers and people shown.

## Before publishing

- Replace the sample collection names, descriptions and categories in `src/data.ts`.
- Confirm the email, phone numbers, Instagram profile, WhatsApp link and Orgle Road location in `src/App.tsx` remain current.
- Replace the starter brand story with approved brand copy.
- Check every photo license and add useful alt text.
- Run `npm run build` to check for build errors. The production files appear in `dist/`.

## Folder guide

- `src/App.tsx` — pages, navigation and interactions
- `src/data.ts` — sample catalogue
- `src/styles.css` — colors, type, layout and animation
- `public/images/` — your approved photos
- `index.html` — page title and description

Next step: add the brand’s real photos, then refine the copy and colors together.
