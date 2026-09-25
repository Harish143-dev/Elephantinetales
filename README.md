# Elephantine Tales · Estate Explorer

A website design concept for the Elephantine Tales holiday-home estate in the Pachalur hills
above Kodaikanal. Plain HTML, CSS and JavaScript. No build step, no framework.

**Live:** https://harish143-dev.github.io/Elephantinetales/

Open `index.html` to run it locally. Keep the folder together; the pictures sit beside it.

---

## What it does

An aerial of the estate you drag and zoom, with glowing points you click.

- **Six views.** The whole estate, the clubhouse, the lotus ponds, the farm and meadow, the
  forest plots, the upper land. Each opens through a green wipe into its own aerial.
- **Today / Planned.** Cross-fades between the land as it is and the estate as planned, with
  the villas, the pool and the lawns in place.
- **Season.** Summer, monsoon, winter and dusk. Dusk brings up an evening picture with the
  lights on where one exists.
- **Plots.** Twenty-two plots with size, area, facing and an indicative price, plus tabs for
  photographs, the plot drawn to scale, details and building guidelines.
- **Stand here.** A ground-level 360 view on about thirty points. Drag to look, scroll to
  zoom, and step forward along a chain of spots the way Street View does.
- Works on a phone. Hotspots are reachable by keyboard.

Review shortcuts: `?nointro`, `#/club`, `?plot=4#/forest`, `?hot=club`, `?season=dusk`,
`?mode=planned`.

---

## How the 360 view works

Each panorama is cut into six square pictures, one per face of a cube. The browser arranges
them with CSS 3D and puts the viewer at the centre. There is no library and no WebGL,
deliberately: a browser refuses to put a local image into WebGL when the page is opened by
double-clicking, which rules out Pannellum, Marzipano and every viewer like them. Cube maps
are also what the professional tours use.

---

## Please read before showing this to anyone

This is a **design concept**, not a live product.

- The enquiry form sends nothing. Nothing typed into it is stored or transmitted.
- The **aerial views** were produced for this concept from satellite imagery of the estate.
  They show the real roads, ponds, clubhouse, farm and village in their real positions, but
  they are illustrations, not survey drawings, and the source imagery is not licensed for
  publication. Replace them with a commissioned drone survey before this goes live.
- The **360 views** are free public-domain photographs of woodland, meadow and hillside from
  [Poly Haven](https://polyhaven.com). They are not the estate and must be replaced with real
  360 photographs taken on the land.
- **Plot positions, plot numbers, availability, prices and the amenity descriptions are
  invented** to demonstrate how the site would work. None of it is confirmed and none of it
  should be quoted to a buyer. Prices are extrapolated from the published starting price of
  ₹94 lakh for 21 cents and are marked indicative.

See `CREDITS.txt` for the stock photography credits.
