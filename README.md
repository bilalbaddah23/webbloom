# WebBloom

The WebBloom agency website: websites for Instagram shops.

A static site (HTML, CSS, JavaScript) in the `publish` folder. No build step.

## Edit your contact details

Open `publish/main.js`. At the top:

```js
const CONTACT = {
  instagram: '',   // your Instagram username, without @
  whatsapp: '',    // your WhatsApp number with country code, digits only
  email: 'webbloom.lb@gmail.com'
};
```

Fill in `instagram` and/or `whatsapp` and those buttons appear on the site.

## What is inside

- Intro counter, word-by-word headlines, 3D devices that follow the mouse
- A pinned "problem" story, a spotlight feature grid, a sideways work gallery
- Steps, price card, FAQ and a final call to action
- Smooth scrolling and scroll animations with GSAP, ScrollTrigger and Lenis (in `publish/vendor`)
- Everything switches to a simple static page for visitors who ask for reduced motion

## Preview on your computer

```bash
cd publish
python -m http.server 8080
```

Then open http://localhost:8080

## Put it on the VPS

See `deployment/README.txt`.

## Licences

Fonts: Cormorant Garamond and DM Sans (SIL Open Font License, texts in `publish/assets/fonts`).
GSAP is used under the GSAP standard licence (https://gsap.com/standard-license). Lenis is MIT.
