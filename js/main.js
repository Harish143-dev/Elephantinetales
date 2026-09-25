/* Elephantine Tales · concept v5 · "Wander"
   A single-screen estate explorer with explorable areas, after explore.ownprimland.com.
   Plain JS + GSAP. All content is invented for the concept; see README.md. */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const qs = new URLSearchParams(location.search);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const isSmall = () => window.innerWidth < 900;
  const vw = () => window.innerWidth, vh = () => window.innerHeight;

  const loader = $('loader'), scene = $('scene'), world = $('world'), worldImg = $('worldImg'), birdsEl = $('birds'), hotsEl = $('hots');
  const clouds = $('clouds'), haze = $('haze'), dim = $('dim'), intro = $('intro'), hints = $('hints'), hdr = $('hdr'), compass = $('compass');
  const nav = $('nav'), navPanel = $('navPanel'), navList = $('navList'), navBtn = $('navBtn'), navHome = $('navHome'), navLabel = $('navLabel');
  const season = $('season'), seasonBtn = $('seasonBtn'), seasonTip = $('seasonTip');
  const sb = $('sb'), sbInner = $('sbInner'), sbEyebrow = $('sbEyebrow'), sbScroll = $('sbScroll'), mask = $('mask');
  const lb = $('lb'), lbImg = $('lbImg'), lbCap = $('lbCap');
  const startBtn = $('startBtn');

  if (!window.gsap || !window.Draggable) { startBtn.firstElementChild.textContent = 'Animation library did not load'; return; }
  gsap.registerPlugin(Draggable);
  ['InertiaPlugin', 'MotionPathPlugin', 'SplitText'].forEach((p) => { if (window[p]) gsap.registerPlugin(window[p]); });
  gsap.ticker.lagSmoothing(0); // keep sequencing on wall-clock time even when frames are slow

  /* ==================================================================
     DATA · all copy invented for the concept
     ================================================================== */
  const SITE = 'images/site/', STK = 'images/stock/';
  const CENT = 435.6, RATE = 94 / 21;
  const priceFor = (c) => { const l = RATE * c; return l >= 100 ? '₹' + (l / 100).toFixed(2) + ' Cr' : '₹' + Math.round(l) + ' L'; };
  const fmt = (n) => Math.round(n).toLocaleString('en-IN');
  const pad = (n) => String(n).padStart(2, '0');
  const villaSqft = (c) => c >= 40 ? 3600 : c >= 30 ? 3000 : 2400;

  const GUIDE = [
    'Villas follow the estate design code: sloping clay-tiled roofs, plinths in local granite, timber verandahs and no building above two storeys. A twenty-foot green setback keeps every road lined with trees.',
    'Three pre-approved plans are available for each plot size, drawn by the estate architect, or bring your own and we take it through approval. Construction runs through estate-empanelled builders so the hill stays quiet.'
  ];

  const AREA_TITLES = { forest: 'Forest plots', stream: 'Pond plots', meadow: 'Meadow plots' };
  const GALLERIES = {
    forest: [SITE + '10.webp', SITE + '22.webp', STK + 'tall-forest.jpg'],
    stream: [SITE + '8.webp', SITE + '14.webp', SITE + '13.webp'],
    meadow: [SITE + '1.webp', STK + 'meadow.jpg', SITE + '21.webp'],
  };
  const ROAD = { forest: 'the upper road', stream: 'the pond road', meadow: 'the meadow road' };
  const FACING_LINE = { Forest: 'Shola forest on the rear boundary', Valley: 'Open valley view from the front', Stream: 'The stream within a two-minute walk', Pond: 'Frontage on the lotus pond path', Meadow: 'Open meadow on two sides' };

  function plot(n, cents, st, x, y, facing, area) {
    const wft = Math.round(Math.sqrt(cents * CENT * 4 / 3));
    const status = st === 'a' ? 'Available' : st === 'r' ? 'Reserved' : 'Sold';
    return {
      id: 'p' + pad(n), kind: 'plot', n, cents, st, x, y, facing, area,
      title: 'Plot ' + pad(n), eyebrow: AREA_TITLES[area] + ' · ' + status, status,
      sub: cents + ' cents · ' + (st === 'a' ? priceFor(cents) : status),
      price: st === 'a' ? priceFor(cents) : status,
      img: GALLERIES[area][n % 3], gallery: GALLERIES[area],
      desc: 'A ' + cents + '-cent plot on ' + ROAD[area] + ', ' + (facing === 'Forest' ? 'with the shola forest at its back and the road in front.' : facing === 'Valley' ? 'facing the valley, with the long view down to the plains.' : facing === 'Stream' ? 'a short walk from the stream and the lotus pond.' : facing === 'Pond' ? 'on the path that circles the lotus pond.' : 'in open meadow beside the farm, with the morning sun.') + ' Room for a ' + fmt(villaSqft(cents)) + ' sq ft villa, a garden and a pool.',
      details: [
        ['i-road', 'Road frontage of ' + wft + ' ft on ' + ROAD[area]],
        ['i-power', 'Water, power and fibre at the plot boundary'],
        [facing === 'Stream' || facing === 'Pond' ? 'i-water' : facing === 'Forest' ? 'i-tree' : 'i-view', FACING_LINE[facing]],
        ['i-sunrise', n % 2 ? 'Sunrise side of the slope' : 'Sunset side of the slope'],
        ['i-fence', 'Surveyed, fenced and registered'],
        ['i-plan', 'Villa of up to ' + fmt(villaSqft(cents)) + ' sq ft, pre-approved plans available'],
      ],
    };
  }
  const amen = (id, title, x, y, img, desc, eyebrow) => ({ id, kind: 'amenity', title, x, y, img, desc, eyebrow: eyebrow || 'Amenities', sub: eyebrow || 'Amenities' });
  const area = (id, title, eyebrow, x, y, img, desc, sceneKey) => ({ id, kind: 'area', title, eyebrow, sub: eyebrow, x, y, img, desc, scene: sceneKey });

  const G = 'images/gen/';
  const SCENES = {
    estate: {
      key: 'estate', has: ['planned', 'planned-dusk'], nav: 'The whole estate', title: 'The Estate', img: G + 'estate.webp', imgM: G + 'estate-m.webp', w: 6144, h: 4096, fit: 1.04, focus: [31.6, 57],
      birds: [[[2, 62], [28, 42], [58, 56], [98, 34]], [[98, 82], [70, 70], [40, 86], [-2, 72]]],
      hots: [
        area('club', 'The Clubhouse', 'Amenities · the lotus pavilion', 31.6, 57, SITE + '3.webp', 'The eight-petal pavilion at the centre of the estate, with the stone-rimmed pond beside it: dining on the verandah, the pool, the wellness pavilion and the lawn.', 'club'),
        area('stream', 'The Lotus Ponds', 'Water · Plots 10 to 13', 50.2, 61, SITE + '13.webp', 'Four ponds along the estate road east of the clubhouse, stone-edged and fed by the stream, with a jetty, a bird hide and four plots on the paths around the water.', 'stream'),
        area('meadow', 'The Farm & Meadow Plots', 'Plots 14 to 22', 76, 55, SITE + '11.webp', 'The organic farm with its polyhouses, the big meadow above it, and nine plots on the open ground around them.', 'meadow'),
        area('forest', 'Forest Plots', 'Plots 01 to 09', 9, 82, SITE + '10.webp', 'Nine plots along the hairpin road that climbs the forested hillside on the south-west of the estate.', 'forest'),
        area('view', 'The Upper Land & Star Deck', 'After dark', 30, 8, STK + 'stars.jpg', 'The high ground on the north of the estate: grass clearings in old forest, the sunrise point and the star deck.', 'view'),
        area('reservoir', 'The Reservoir', 'Water', 56, 19, STK + 'lake.jpg', 'The largest water on the estate, with a sandy beach along its western shore. Swimming in the mornings, boats in the evening.'),
        area('zen', 'The Stone Garden', 'Wellness', 24.4, 53, SITE + '16.webp', 'The stone-rimmed pond west of the clubhouse, with a terrace and wide steps down to the water. The quiet corner of the estate.'),
        area('office', 'Estate Office & Nursery', 'Arrival', 75, 18.5, SITE + '18.webp', 'The estate office, the plant nursery and the workshops, on the tar road at the north-east corner.'),
        area('gate', 'The Gate', 'Arrival', 93, 8, SITE + '2.webp', 'The entrance off the Oddanchatram road at the north-east corner, where the tar road meets the estate.'),
        area('trek', 'Shola Trek Head', 'Outdoor pursuits', 8, 45, STK + 'tall-forest.jpg', 'Graded trails leave the western track into the old forest on the hillside, from an hour\'s loop to a half-day climb to the ridge.'),
        area('cycle', 'Cycling Loop', 'Outdoor pursuits', 45.6, 81, STK + 'cycling.jpg', 'The lower estate road winds through the forest below the ponds: the start of the six-kilometre cycling loop.'),
        area('camp', 'Camping Meadow', 'After dark', 11, 26, STK + 'camp.jpg', 'The cleared field in the north-west corner of the estate, with fire pits and canvas tents on request under the darkest sky on the land.'),
        area('rows', 'Equestrian Centre & Paddocks', 'Outdoor pursuits', 60, 79, STK + 'horse.jpg', 'Stables and a schooling arena on the cultivated ground south of the ponds, with rides along the estate\'s bridle paths.'),
        area('village', 'Sembarankulam', 'Neighbours', 67.7, 64.5, SITE + '5.webp', 'The village beside the estate, where the farm team lives and the weekly market is held.'),
      ],
    },
    club: {
      key: 'club', has: ['planned', 'planned-dusk'], nav: 'The Clubhouse', title: 'The Clubhouse', img: G + 'club.webp', imgM: G + 'club-m.webp', w: 6144, h: 4096, fit: 1.0, focus: [44.3, 47],
      birds: [[[-2, 30], [40, 22], [70, 34], [102, 20]], [[102, 70], [60, 78], [30, 66], [-2, 74]]],
      hots: [
        amen('verandah', 'The Lotus Pavilion & Verandah', 44.3, 46.9, SITE + '3.webp', 'The eight-petal clubhouse: reception and lounge under the central roof, the restaurant on the verandah between the petals, dinners on the stone terrace outside.'),
        amen('pool', 'Infinity Pool & Pool Bar', 45.6, 66.4, SITE + '19.webp', 'A thirty-metre pool on the lawn south of the pavilion, its far edge running out towards the lower ponds. The pool bar serves from eleven until the light goes.'),
        amen('garden', 'The Stone Garden', 21.5, 33.2, SITE + '16.webp', 'The stone-rimmed pond west of the pavilion, with a path around it in five minutes and the quietest benches on the estate.', 'Wellness'),
        amen('terrace', 'The Boathouse & Terrace', 13.7, 20, SITE + '8.webp', 'The red-roofed boathouse on the north-west corner of the pond, with a stone terrace and wide steps down to the water. Two rowing boats live here.', 'Water'),
        amen('wellness', 'Wellness & Yoga Pavilion', 33.9, 48, STK + 'yoga.jpg', 'A timber pavilion on the lawn between the pond and the clubhouse, with two treatment rooms and a steam room opening onto the water.', 'Wellness'),
        amen('kids', 'Kids\' Club & Games Room', 52.7, 13.7, SITE + '15.webp', 'The grey-roofed building on the road north of the clubhouse becomes a den for the young ones, with a games room and a treehouse in the canopy.'),
        amen('circle', 'Arrival Court', 43, 12.7, SITE + '2.webp', 'The paved circle on the road where the estate team meets you, with parking hidden under the trees.', 'Arrival'),
        amen('lawn', 'The Event Lawn', 71.6, 44, SITE + '5.webp', 'The open ground east of the road, levelled and turfed: an acre of lawn for the evenings that run late.'),
        amen('cottage', 'The Gardener\'s Cottage', 68.4, 34.2, SITE + '18.webp', 'The small red-roofed cottage at the edge of the clearing, home to the head gardener and the estate\'s tool store.', 'Farm'),
        amen('twin', 'The Twin Ponds & Hatchery', 54, 78, SITE + '7.webp', 'Two quieter ponds below the pool lawn, with the round hatchery huts on their western bank where the estate raises its fish.', 'Water'),
        area('ponds', 'The Lotus Ponds', 'Water · Plots 10 to 13', 92.4, 58.6, SITE + '13.webp', 'The estate road continues east to the stone-edged lotus ponds, the jetty and four plots.', 'stream'),
      ],
    },
    forest: {
      key: 'forest', has: ['planned'], nav: 'Forest Plots', title: 'Forest Plots', img: G + 'forest.webp', imgM: G + 'forest-m.webp', w: 6144, h: 4096, fit: 1.0, focus: [70, 70],
      birds: [[[-2, 40], [30, 30], [60, 44], [102, 30]], [[102, 80], [60, 72], [30, 84], [-2, 70]]],
      hots: [
        plot(1, 21, 'a', 20, 78, 'Forest', 'forest'), plot(2, 30, 'a', 30, 90, 'Valley', 'forest'), plot(3, 21, 's', 42, 80, 'Forest', 'forest'),
        plot(4, 40, 'a', 52, 92, 'Valley', 'forest'), plot(5, 30, 'r', 63, 80, 'Forest', 'forest'), plot(6, 21, 'a', 72, 90, 'Valley', 'forest'),
        plot(7, 30, 'a', 80, 68, 'Forest', 'forest'), plot(8, 40, 's', 92, 58, 'Valley', 'forest'), plot(9, 21, 'a', 88, 42, 'Forest', 'forest'),
        amen('trail', 'Shola Trail Head', 13, 29, STK + 'tall-forest.jpg', 'Two marked trails leave from the clearing on the western slope: an hour\'s loop under the canopy and the half-day climb to the ridge.', 'Outdoor pursuits'),
        amen('fview', 'The Old Trees', 66.4, 41.5, SITE + '6.webp', 'Two old trees stand above the canopy in the middle of the slope. The bench under them has the first long view down the valley.', 'Viewpoint'),
        amen('hairpin', 'The Hairpin Road', 91, 74, STK + 'road.jpg', 'The estate road climbs the hillside in three hairpin bends. Every forest plot sits off this road.', 'Arrival'),
      ],
    },
    stream: {
      key: 'stream', has: ['planned'], nav: 'The Lotus Ponds', title: 'The Lotus Ponds', img: G + 'stream.webp', imgM: G + 'stream-m.webp', w: 6144, h: 4096, fit: 1.0, focus: [73, 40],
      birds: [[[-2, 20], [30, 34], [60, 24], [102, 40]], [[102, 90], [66, 78], [34, 92], [-2, 80]]],
      hots: [
        area('club2', 'The Clubhouse', 'Amenities', 19.5, 24.4, SITE + '3.webp', 'The eight-petal pavilion at the top of the road, with its pond and lawn.', 'club'),
        amen('pond', 'The Lotus Pond', 72.9, 36.1, SITE + '13.webp', 'The largest of the four ponds, stone-edged and fed by the stream all year. Lotus after the monsoon, and a path around it in twenty minutes.', 'Water'),
        amen('jetty', 'Boating Jetty', 76.2, 54.7, SITE + '8.webp', 'The second pond below the road, with a timber jetty, two rowing boats and a coracle for the still hour after sunrise.', 'Water'),
        amen('pavilion', 'Lakeside Pavilion', 82, 68.8, SITE + '16.webp', 'The round pavilion on the lawn below the ponds: tea in the afternoon, and the estate\'s outdoor cinema on Saturday nights.', 'Amenities'),
        amen('hide', 'Bird Hide', 88, 57.6, SITE + '14.webp', 'A timber hide on the small reedy pond at the eastern end. Kingfishers most mornings, hornbills when the figs are in fruit.', 'Nature'),
        amen('twin', 'The Twin Ponds', 36.1, 53.2, SITE + '7.webp', 'Two quieter ponds below the clubhouse, with the marsh lawn above them and the hatchery hut on the bank.', 'Water'),
        amen('picnic', 'Picnic Lawn', 21.5, 44.9, STK + 'meadow.jpg', 'The green patch between the clubhouse and the twin ponds, with a stone table and a fire ring for long lunches.', 'Amenities'),
        amen('nursery', 'The Nursery', 38.7, 85.9, SITE + '11.webp', 'The long white shed on the lower road is the plant nursery that grows every tree planted on the estate.', 'Farm'),
        plot(10, 30, 'a', 45, 28, 'Pond', 'stream'), plot(11, 40, 'a', 60, 20, 'Stream', 'stream'), plot(12, 30, 's', 48, 70, 'Stream', 'stream'), plot(13, 40, 'a', 93, 85, 'Pond', 'stream'),
      ],
    },
    meadow: {
      key: 'meadow', has: ['planned'], nav: 'The Farm & Meadow Plots', title: 'The Farm & Meadow Plots', img: G + 'meadow.webp', imgM: G + 'meadow-m.webp', w: 6144, h: 4096, fit: 1.0, focus: [58, 55],
      birds: [[[-2, 30], [34, 18], [66, 30], [102, 14]], [[102, 64], [64, 74], [30, 62], [-2, 70]]],
      hots: [
        amen('farm', 'The Organic Farm', 57.3, 46.9, SITE + '11.webp', 'The polyhouses grow vegetables and salad leaves all year. Residents take a weekly basket; the clubhouse kitchen takes the rest.', 'Farm'),
        amen('poly', 'The Lower Polyhouses', 62.5, 70.3, STK + 'farm.jpg', 'The second block of greenhouses: fruit, herbs and the flower nursery, with the water tank and the packing yard between them.', 'Farm'),
        amen('store', 'Farm Office & Store', 42.3, 59.1, SITE + '18.webp', 'The red-roofed shed is the farm office and the estate store, where the weekly baskets are packed.', 'Farm'),
        amen('bigmeadow', 'The Big Meadow', 52, 20.5, STK + 'meadow.jpg', 'The open meadow above the farm, mown for the harvest dinner in December and the estate\'s cricket match.', 'Meadow'),
        amen('garden', 'The Kitchen Garden', 20.2, 50.8, SITE + '16.webp', 'The curved, stone-edged garden on the western side, with herbs, a small pond and a bench.', 'Farm'),
        amen('fpond', 'Farm Pond', 81.4, 16.6, SITE + '13.webp', 'The pond in the trees on the north-east, which irrigates the polyhouses.', 'Water'),
        amen('stables', 'Equestrian Centre', 78, 82, STK + 'horse.jpg', 'Stables for eight horses and a schooling arena on the open ground by the eastern road.', 'Outdoor pursuits'),
        amen('village', 'Sembarankulam', 26, 88, SITE + '5.webp', 'The village at the edge of the estate, where the farm team lives.', 'Neighbours'),
        plot(14, 21, 'a', 35, 22, 'Meadow', 'meadow'), plot(15, 30, 'a', 25, 35, 'Meadow', 'meadow'), plot(16, 21, 'r', 12, 62, 'Meadow', 'meadow'),
        plot(17, 40, 'a', 72, 30, 'Meadow', 'meadow'), plot(18, 30, 'a', 88, 36, 'Valley', 'meadow'), plot(19, 21, 's', 90, 52, 'Meadow', 'meadow'),
        plot(20, 30, 'a', 42, 38, 'Meadow', 'meadow'), plot(21, 40, 'r', 66, 90, 'Meadow', 'meadow'), plot(22, 30, 'a', 6, 84, 'Valley', 'meadow'),
      ],
    },
    view: {
      key: 'view', has: [], nav: 'The Upper Land & Star Deck', title: 'The Upper Land & Star Deck', img: G + 'view.webp', imgM: G + 'view-m.webp', w: 6144, h: 4096, fit: 1.0, focus: [72, 49],
      birds: [[[-2, 44], [30, 30], [64, 40], [102, 26]], [[102, 60], [70, 52], [36, 64], [-2, 56]]],
      hots: [
        amen('deck', 'Star Deck', 71.6, 48.8, STK + 'stars.jpg', 'A timber deck in the largest clearing, with no light for miles. The estate keeps a telescope here; bring a blanket.', 'After dark'),
        amen('sunrise', 'Sunrise Point', 87.9, 9.8, STK + 'hills-mist.jpg', 'The bare high ground in the north-east corner. The sun comes up over the plains at six and the mist below burns off by eight.', 'Viewpoint'),
        amen('camp2', 'Camping Clearing', 81.4, 68.4, STK + 'camp.jpg', 'The lower clearing, with fire pits and canvas tents on request. Dinner comes up from the clubhouse in a basket.', 'After dark'),
        amen('hut', 'Forest Warden\'s Hut', 54.7, 85.9, SITE + '15.webp', 'The small hut at the edge of the trees, where the estate\'s forest warden keeps the trail maps and the binoculars.', 'Nature'),
        amen('heli2', 'Helipad', 32.6, 93.8, STK + 'road.jpg', 'A cleared pad on the south-west corner of the upper land. Ninety minutes from Chennai by air.', 'Arrival'),
        amen('cloud', 'Cloud Walk', 19.5, 39, STK + 'forest.jpg', 'A level path through the oldest forest on the estate, above the cloud on monsoon mornings. Forty minutes end to end.', 'Outdoor pursuits'),
        amen('track', 'The North Track', 92.4, 39, SITE + '10.webp', 'The narrow track and the shelter on the eastern edge, where the upper land meets the boundary.', 'Arrival'),
      ],
    },
  };
  const NAV_ORDER = ['estate', 'club', 'forest', 'stream', 'meadow', 'view'];
  const SEASONS = [['summer', 'Summer'], ['monsoon', 'Monsoon'], ['winter', 'Winter'], ['dusk', 'Dusk']];


  /* ---------- 360 views ----------
     Six pictures per spot, one per face of a cube, made by tools/tocubemap.py.
     PANO_FOR says which hotspot in which scene opens which view. */
  const PANOS = {
    club:      { title: 'The clubhouse lawn', next: 'ponds' },
    ponds:     { title: 'Beside the clubhouse pond', prev: 'club', next: 'water' },
    water:     { title: 'The lotus pond path', prev: 'ponds', next: 'meadow' },
    meadow:    { title: 'The meadow plots', prev: 'water' },
    viewpoint: { title: 'The viewpoint', yaw0: 180 },
    forest:    { title: 'The forest trail' },
  };
  const PANO_FOR = {
    estate: { club: 'club', zen: 'ponds', reservoir: 'ponds', stream: 'water', meadow: 'meadow', view: 'viewpoint', trek: 'forest', cycle: 'forest' },
    club:   { verandah: 'club', pool: 'club', lawn: 'club', garden: 'ponds', terrace: 'ponds', twin: 'ponds' },
    stream: { pond: 'water', jetty: 'water', walk: 'water', p10: 'water', p11: 'water', p13: 'water' },
    meadow: { farm: 'meadow', bigmeadow: 'meadow', grove: 'meadow', p14: 'meadow', p15: 'meadow', p17: 'meadow', p20: 'meadow' },
    forest: { trail: 'forest', fview: 'forest', hairpin: 'forest', p01: 'forest', p02: 'forest', p04: 'forest', p07: 'forest' },
    view:   { deck: 'viewpoint', sunrise: 'viewpoint', cloud: 'viewpoint', camp2: 'viewpoint' },
  };
  const panoFor = (item) => (PANO_FOR[current] || {})[item && item.id];

  /* ==================================================================
     CAMERA
     ================================================================== */
  let W = 5000, H = 3333;
  const cam = { x: 0, y: 0, s: 1 };
  let drag = null, homeX = 0, homeY = 0, busy = false;
  const minS = () => Math.max(vw() / W, vh() / H);
  const maxS = () => minS() * 3.4;
  const bounds = (s) => ({ minX: Math.min(0, vw() - W * s), maxX: 0, minY: Math.min(0, vh() - H * s), maxY: 0 });
  function clampXY(x, y, s) { const b = bounds(s); return [gsap.utils.clamp(b.minX, b.maxX, x), gsap.utils.clamp(b.minY, b.maxY, y)]; }
  function render() {
    gsap.set(world, { x: cam.x, y: cam.y, scale: cam.s });
    world.style.setProperty('--inv', (1 / cam.s).toFixed(4));
    gsap.set(clouds, { x: (cam.x - homeX) * 0.08, y: (cam.y - homeY) * 0.08 });
  }
  function setWorldSize(w, h) { W = w; H = h; world.style.width = w + 'px'; world.style.height = h + 'px'; }
  function applyBounds() { if (drag) { drag.applyBounds(bounds(cam.s)); drag.update(); } }
  function homeFor(sc) { const s = minS() * sc.fit; return { s, x: (vw() - W * s) / 2, y: (vh() - H * s) / 2 }; }
  function placeCamera(s, px, py, ax, ay) {
    ax = ax === undefined ? vw() / 2 : ax; ay = ay === undefined ? vh() / 2 : ay;
    cam.s = s; [cam.x, cam.y] = clampXY(ax - px / 100 * W * s, ay - py / 100 * H * s, s); render();
  }
  function zoomAt(px, py, ns, dur) {
    ns = gsap.utils.clamp(minS(), maxS(), ns);
    const k = ns / cam.s; let x = px - (px - cam.x) * k, y = py - (py - cam.y) * k; [x, y] = clampXY(x, y, ns);
    if (dur) gsap.to(cam, { x, y, s: ns, duration: dur, ease: 'power3.out', overwrite: 'auto', onUpdate: render, onComplete: applyBounds });
    else { cam.x = x; cam.y = y; cam.s = ns; render(); applyBounds(); }
  }
  function flyTo(px, py, s, dur, ax, ay, onDone) {
    ax = ax === undefined ? vw() / 2 : ax; ay = ay === undefined ? vh() / 2 : ay;
    s = gsap.utils.clamp(minS(), maxS(), s);
    let x = ax - px / 100 * W * s, y = ay - py / 100 * H * s; [x, y] = clampXY(x, y, s);
    gsap.to(cam, { x, y, s, duration: dur, ease: 'power3.inOut', overwrite: 'auto', onUpdate: render, onComplete: () => { applyBounds(); if (onDone) onDone(); } });
  }
  function goHome(dur) { const h = homeFor(SCENES[current]); homeX = h.x; homeY = h.y; gsap.to(cam, { x: h.x, y: h.y, s: h.s, duration: dur, ease: 'power3.inOut', overwrite: 'auto', onUpdate: render, onComplete: applyBounds }); }

  let lastDragX = 0;
  drag = Draggable.create(world, {
    type: 'x,y', inertia: !!window.InertiaPlugin, edgeResistance: 0.85, minimumMovement: 3, bounds: bounds(1),
    onPress: function () { scene.classList.add('is-dragging'); lastDragX = this.x; },
    onRelease: () => { scene.classList.remove('is-dragging'); compassRest(); },
    onDrag: function () { cam.x = this.x; cam.y = this.y; render(); compassTilt(this.x - lastDragX); lastDragX = this.x; dismissHints(); },
    onThrowUpdate: function () { cam.x = this.x; cam.y = this.y; render(); },
  })[0];
  scene.addEventListener('wheel', (e) => { e.preventDefault(); if (busy) return; zoomAt(e.clientX, e.clientY, cam.s * Math.exp(-e.deltaY * 0.0014), 0); dismissHints(); }, { passive: false });
  const pts = new Map(); let pinch = null;
  scene.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') return; pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: cam.s }; drag.disable(); } });
  scene.addEventListener('pointermove', (e) => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]); if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, pinch.s * d / pinch.d, 0); dismissHints(); } });
  const endPt = (e) => { pts.delete(e.pointerId); if (pinch && pts.size < 2) { pinch = null; drag.enable(); drag.update(); } };
  scene.addEventListener('pointerup', endPt); scene.addEventListener('pointercancel', endPt);
  let wasSmall = isSmall();
  window.addEventListener('resize', () => {
    if (!current) return;
    cam.s = Math.max(cam.s, minS()); [cam.x, cam.y] = clampXY(cam.x, cam.y, cam.s); render(); applyBounds();
    if (isSmall() !== wasSmall) { wasSmall = isSmall(); applyVariant(true); }   // crossed the phone / desktop line
    if (sbOpen) shiftControls(true);
  });

  /* ---------- clouds ---------- */
  if (!reduced) {
    gsap.to('.cloud--1', { xPercent: 6, yPercent: 2, duration: 46, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.cloud--2', { xPercent: -7, yPercent: -3, duration: 58, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.cloud--3', { xPercent: 4, yPercent: 4, duration: 70, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.cloud--4', { xPercent: -5, yPercent: 3, duration: 64, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }

  /* ---------- compass ---------- */
  (function buildCompass() {
    let ticks = '';
    for (let i = 0; i < 60; i++) { const a = i * 6, big = i % 15 === 0; ticks += '<line x1="50" y1="4" x2="50" y2="' + (big ? 11 : 7.5) + '" stroke="currentColor" stroke-width="' + (big ? 1.4 : 0.6) + '" opacity="' + (big ? 0.95 : 0.55) + '" transform="rotate(' + a + ' 50 50)"/>'; }
    compass.innerHTML = '<svg viewBox="0 0 100 100"><g class="compass__rot" id="compassRot">' + ticks + '<circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5"/><path d="M50 27l5 23-5-4-5 4z" fill="currentColor"/><path d="M50 73l-5-23 5 4 5-4z" fill="currentColor" opacity="0.45"/></g><text x="50" y="-3" text-anchor="middle" font-family="Figtree, sans-serif" font-size="11" font-weight="600" fill="currentColor">N</text></svg>';
  })();
  const compassRot = $('compassRot');
  function compassTilt(dx) { if (reduced) return; gsap.to(compassRot, { rotation: gsap.utils.clamp(-28, 28, -dx * 0.9), duration: 0.45, ease: 'power2.out', overwrite: true }); }
  function compassRest() { if (reduced) return; gsap.to(compassRot, { rotation: 0, duration: 1.4, ease: 'elastic.out(1, 0.45)', overwrite: true }); }

  /* ==================================================================
     HOTSPOTS + BIRDS
     ================================================================== */
  const legend = $('legend');
  function updateLegend(sc) { legend.hidden = !sc.hots.some((h) => h.kind === 'plot'); }
  function buildHots(sc) {
    hotsEl.innerHTML = '';
    sc.hots.forEach((h, i) => {
      const el = document.createElement('div');
      el.className = 'hot' + (h.kind === 'plot' ? ' hot--plot' : '') + (h.st === 'r' ? ' hot--reserved' : h.st === 's' ? ' hot--sold' : '') + (h.x > 72 ? ' hot--flip' : '');
      el.style.left = h.x + '%'; el.style.top = h.y + '%'; el.style.setProperty('--d', (0.1 + i * 0.06) + 's');
      el.innerHTML = '<button class="hot__btn" type="button" aria-label="' + h.title + '"><i class="hot__pulse"></i><i class="hot__halo"></i><i class="hot__dot"></i></button><span class="hot__label">' + h.title + (h.sub ? '<small>' + h.sub + '</small>' : '') + '</span>';
      const hb = el.querySelector('button');
      hb.addEventListener('click', (e) => { e.stopPropagation(); openHot(h); });
      if (h.scene) { hb.addEventListener('pointerenter', () => warm(h.scene)); hb.addEventListener('focus', () => warm(h.scene)); }
      hotsEl.appendChild(el); h.el = el;
    });
  }
  function buildBirds(sc) {
    gsap.killTweensOf(birdsEl.querySelectorAll('.flock'));
    birdsEl.innerHTML = '';
    if (reduced || !sc.birds) return;
    sc.birds.forEach((path, fi) => {
      const flock = document.createElement('div'); flock.className = 'flock';
      const n = 5 + fi * 2;
      for (let i = 0; i < n; i++) { const b = document.createElement('i'); b.className = 'bird'; b.style.left = (i * 16 - (i % 2) * 8) + 'px'; b.style.top = (Math.abs(i - n / 2) * 9) + 'px'; b.style.animationDelay = (i * 0.09) + 's'; b.innerHTML = '<svg><use href="#i-bird"/></svg>'; flock.appendChild(b); }
      birdsEl.appendChild(flock);
      const pxPath = path.map(([x, y]) => ({ x: x / 100 * W, y: y / 100 * H }));
      const dur = 60 + fi * 18;
      if (window.MotionPathPlugin) gsap.to(flock, { motionPath: { path: pxPath, curviness: 1.3 }, duration: dur, repeat: -1, ease: 'none', delay: fi * 9 });
      else gsap.to(flock, { keyframes: pxPath, duration: dur, repeat: -1, ease: 'none', delay: fi * 9 });
    });
  }
  let activeHot = null;
  function setActiveHot(h) { if (activeHot && activeHot.el) activeHot.el.classList.remove('is-active'); activeHot = h; if (h && h.el) h.el.classList.add('is-active'); }

  /* ==================================================================
     SCENES
     ================================================================== */
  let current = null, started = false, hintsDone = false;
  const preload = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const errEl = $('sceneErr');
  function sceneError(src) { errEl.querySelector('code').textContent = String(src).split('/').pop(); errEl.hidden = false; }
  function clearSceneError() { errEl.hidden = true; }
  $('errRetry').addEventListener('click', () => { clearSceneError(); const s = worldImg.getAttribute('src'); worldImg.removeAttribute('src'); worldImg.src = s + (s.indexOf('?') < 0 ? '?r=' : '&r=') + Date.now(); });
  async function mountScene(key) {
    const sc = SCENES[key]; const src = isSmall() && sc.imgM ? sc.imgM : sc.img;
    clearSceneError();
    if (!await preload(src)) sceneError(src);
    world.classList.remove('is-ready'); setWorldSize(sc.w, sc.h); worldImg.src = src;
    buildHots(sc); buildBirds(sc); updateLegend(sc); current = key; setActiveHot(null);
    resetVariant(); updateMode(); applyVariant(true);
    history.replaceState(null, '', location.pathname + location.search + (key === 'estate' ? '' : '#/' + key));
    updateNav();
  }
  function uiIn() {
    [hdr, nav, season, compass, modeEl, legend].forEach((e) => e.style.visibility = 'visible');
    if (!reduced) gsap.fromTo([hdr, nav, season, compass, modeEl, legend], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out' });
  }
  function arrive(sc, opts) {
    opts = opts || {};
    const h = homeFor(sc); homeX = h.x; homeY = h.y;
    if (reduced || opts.instant) { placeCamera(h.s, 50, 50); cam.x = h.x; cam.y = h.y; render(); haze.style.opacity = 0; world.classList.add('is-ready'); applyBounds(); if (opts.then) opts.then(); return; }
    placeCamera(minS() * 1.32, sc.focus[0], sc.focus[1]);
    gsap.set(haze, { opacity: opts.fromIntro ? 1 : 0.85 });
    setTimeout(() => world.classList.add('is-ready'), opts.fromIntro ? 1900 : 1200);
    gsap.timeline({ onComplete: () => { applyBounds(); if (opts.then) opts.then(); } })
      .to(cam, { x: h.x, y: h.y, s: h.s, duration: opts.fromIntro ? 3.6 : 2.6, ease: 'power3.inOut', overwrite: 'auto', onUpdate: render }, 0)
      .to(haze, { opacity: 0, duration: 2.4, ease: 'power2.inOut' }, 0.2)
      .fromTo('.cloud', { scale: 1.22 }, { scale: 1, duration: 3.4, ease: 'power2.out', stagger: 0.08 }, 0);
  }
  const maskIn = () => new Promise((res) => { gsap.set(mask, { visibility: 'visible', clipPath: 'inset(100% 0% 0% 0%)' }); gsap.to(mask, { clipPath: 'inset(0% 0% 0% 0%)', duration: reduced ? 0 : 0.85, ease: 'power4.inOut', onComplete: res }); });
  const maskOut = () => new Promise((res) => { gsap.to(mask, { clipPath: 'inset(0% 0% 100% 0%)', duration: reduced ? 0 : 0.9, ease: 'power4.inOut', delay: 0.15, onComplete: () => { gsap.set(mask, { visibility: 'hidden', clipPath: 'inset(100% 0% 0% 0%)' }); res(); } }); });
  let queued = null;
  async function goScene(key, after) {
    if (!SCENES[key]) return;
    if (busy) { queued = key; return; }           // remember the last request instead of dropping it
    if (key === current) { if (after) after(); return; }
    busy = true; hideSb(); closeNav(); dismissHints();
    await maskIn();
    const t0 = Date.now(); await mountScene(key);
    const wait = Math.max(0, (reduced ? 0 : 900) - (Date.now() - t0)); if (wait) await new Promise((r) => setTimeout(r, wait));
    placeCamera(minS() * 1.32, SCENES[key].focus[0], SCENES[key].focus[1]);
    await maskOut();
    arrive(SCENES[key], { then: () => { busy = false; if (after) after(); runQueued(); } });
  }
  function runQueued() { const k = queued; queued = null; if (k && k !== current) goScene(k); }

  /* ==================================================================
     NAV
     ================================================================== */
  let navOpen = false;
  const warmed = {};
  function warm(key) { if (!key || warmed[key] || key === current || !SCENES[key]) return; warmed[key] = true; const sc = SCENES[key]; preload(isSmall() && sc.imgM ? sc.imgM : sc.img); }
  NAV_ORDER.forEach((k) => { const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button'; b.dataset.key = k; b.textContent = SCENES[k].nav; b.addEventListener('click', () => goScene(k)); b.addEventListener('pointerenter', () => warm(k)); b.addEventListener('focus', () => warm(k)); li.appendChild(b); navList.appendChild(li); });
  function updateNav() { navList.querySelectorAll('button').forEach((b) => b.classList.toggle('is-current', b.dataset.key === current)); navLabel.textContent = current === 'estate' ? 'Explore the estate' : SCENES[current].title; }
  function openNav() {
    if (navOpen) return; navOpen = true; nav.classList.add('is-open'); navBtn.setAttribute('aria-expanded', 'true'); gsap.to(modeEl, { autoAlpha: 0, duration: 0.3, overwrite: true });
    gsap.to(navPanel, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'expo.out', overwrite: true });
    gsap.fromTo(navPanel.querySelectorAll('.nav__head, hr, li, .nav__terms'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out', overwrite: true });
  }
  function closeNav() { if (!navOpen) return; navOpen = false; nav.classList.remove('is-open'); navBtn.setAttribute('aria-expanded', 'false'); gsap.to(modeEl, { autoAlpha: 1, duration: 0.4, overwrite: true }); gsap.to(navPanel, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.55, ease: 'power3.in', overwrite: true }); }
  navBtn.addEventListener('click', (e) => { if (e.target.closest('#navHome')) return; navOpen ? closeNav() : openNav(); });
  window.addEventListener('hashchange', () => { const k = (location.hash.replace(/^#\/?/, '') || 'estate').replace(/[^a-z]/g, ''); if (started && SCENES[k] && k !== current) goScene(k); });
  navHome.addEventListener('click', (e) => { e.stopPropagation(); closeNav(); current === 'estate' ? goHome(1.4) : goScene('estate'); });
  $('homeBtn').addEventListener('click', () => { hideSb(); current === 'estate' ? goHome(1.4) : goScene('estate'); });
  $('termsBtn').addEventListener('click', () => { closeNav(); openTerms(); });

  /* ==================================================================
     SEASON
     ================================================================== */
  let seasonIx = 0, tipTimer = null;
  function setSeason(ix, silent) {
    seasonIx = (ix + SEASONS.length) % SEASONS.length; const [key, label] = SEASONS[seasonIx];
    html.dataset.season = key; seasonTip.textContent = label;
    seasonBtn.querySelectorAll('svg').forEach((s) => s.classList.toggle('is-on', s.dataset.s === key));
    if (!silent) { season.classList.add('is-tip'); clearTimeout(tipTimer); tipTimer = setTimeout(() => season.classList.remove('is-tip'), 1800); }
    // Dusk with only a planned-dusk picture available: switch to the planned view so the real picture shows
    if (current && key === 'dusk' && !silent && !sceneHas(current, 'dusk') && sceneHas(current, 'planned-dusk') && !planned) { planned = true; updateMode(); }
    if (current) applyVariant();
  }
  seasonBtn.addEventListener('click', () => setSeason(seasonIx + 1));
  const forcedSeason = SEASONS.findIndex((s) => s[0] === qs.get('season'));
  setSeason(forcedSeason >= 0 ? forcedSeason : 0, true);


  /* ---------- today / planned, and dusk pictures ----------
     Each scene declares in `has` which extra pictures exist, so nothing is probed or downloaded
     until the viewer actually asks for it. Files: images/gen/<key>[-planned][-dusk].webp (+ -m for phones). */
  const altImg = $('worldAlt'), modeEl = $('mode');
  let planned = qs.get('mode') === 'planned'; let fading = null;
  const variantSrc = (sc, v) => G + sc.key + (v ? '-' + v : '') + (isSmall() && sc.imgM ? '-m' : '') + '.webp';
  const sceneHas = (key, v) => (SCENES[key] && SCENES[key].has || []).indexOf(v) >= 0;
  function updateMode() {
    modeEl.hidden = !sceneHas(current, 'planned');
    modeEl.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', (b.dataset.mode === 'planned') === planned));
  }
  function desiredSrc() {
    const sc = SCENES[current]; const dusk = SEASONS[seasonIx][0] === 'dusk';
    if (planned && dusk && sceneHas(current, 'planned-dusk')) return variantSrc(sc, 'planned-dusk');
    if (dusk && sceneHas(current, 'dusk')) return variantSrc(sc, 'dusk');
    if (planned && sceneHas(current, 'planned')) return variantSrc(sc, 'planned');
    return isSmall() && sc.imgM ? sc.imgM : sc.img;
  }
  function applyVariant(instant) {
    if (!current) return;
    const src = desiredSrc(); const cur = worldImg.getAttribute('src');
    world.classList.toggle('has-dusk-img', SEASONS[seasonIx][0] === 'dusk' && /-dusk/.test(src));
    if (src === cur) return;
    if (fading) { fading.kill(); fading = null; }
    if (instant || reduced) { worldImg.src = src; gsap.set(altImg, { opacity: 0 }); altImg.removeAttribute('src'); return; }
    const go = () => { fading = gsap.to(altImg, { opacity: 1, duration: 1.4, ease: 'power2.inOut', onComplete: () => { worldImg.src = src; gsap.set(altImg, { opacity: 0 }); fading = null; } }); };
    altImg.onload = go; altImg.onerror = () => { altImg.onload = null; sceneError(src); };
    altImg.src = src;
    if (altImg.complete && altImg.naturalWidth) { altImg.onload = null; go(); }
  }
  function resetVariant() { if (fading) { fading.kill(); fading = null; } altImg.onload = altImg.onerror = null; gsap.set(altImg, { opacity: 0 }); altImg.removeAttribute('src'); }
  modeEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { planned = b.dataset.mode === 'planned'; updateMode(); applyVariant(); }));

  /* ==================================================================
     SIDEBAR
     ================================================================== */
  let sbOpen = false;
  const btn = (label, attrs, kind) => '<button class="btn btn--' + kind + ' btn--wide" type="button" ' + attrs + '><svg><use href="#i-arrow"/></svg><span class="btn__swap"><span>' + label + '</span><span>' + label + '</span></span></button>';
  const mediaHtml = (src, alt) => '<button class="sb__media" type="button" data-lb="0" aria-label="Open photograph"><img src="' + src + '" alt="' + alt + '"><span class="sb__expand"><svg><use href="#i-expand"/></svg></span></button>';
  const panoBtn = (key, kind) => key ? '<button class="sb__pano" type="button" data-pano="' + key + '"><svg><use href="#i-view"/></svg>' + (kind === 'plot' ? 'Stand on this plot' : 'Stand here') + '</button>' : '';
  function planSvg(cents) {
    const areaSq = cents * CENT, wft = Math.sqrt(areaSq * 4 / 3), hft = areaSq / wft, k = 260 / Math.sqrt(40 * CENT * 4 / 3);
    const w = wft * k, h = hft * k, vs = villaSqft(cents), vw2 = Math.sqrt(vs * 1.5) * k, vh2 = (vs / Math.sqrt(vs * 1.5)) * k;
    return '<svg viewBox="0 0 300 ' + Math.round(h + 44) + '"><g transform="translate(20 18)">' +
      '<rect class="sc-plot" width="' + w + '" height="' + h + '" rx="2"/>' +
      '<rect class="sc-villa" x="12" y="' + (h - vh2 - 12) + '" width="' + vw2 + '" height="' + vh2 + '" rx="2"/><text x="18" y="' + (h - 18) + '">Villa · ' + fmt(vs) + ' sq ft</text>' +
      '<rect class="sc-pool" x="12" y="' + (h - vh2 - 40) + '" width="' + (vw2 * 0.6) + '" height="20" rx="10"/>' +
      '<rect class="sc-car" x="' + (w - 44) + '" y="' + (h - 26) + '" width="28" height="12" rx="3"/>' +
      '<circle class="sc-tree" cx="' + (w - 34) + '" cy="30" r="15"/><circle class="sc-tree" cx="' + (w - 64) + '" cy="58" r="11"/>' +
      '<text x="0" y="' + (h + 16) + '">' + Math.round(wft) + ' × ' + Math.round(hft) + ' ft · ' + fmt(areaSq) + ' sq ft</text></g></svg>';
  }
  function plotHtml(p) {
    return '<dl class="facts"><div><dt class="label">Size</dt><dd>' + p.cents + ' cents</dd></div><div><dt class="label">Area</dt><dd>' + fmt(p.cents * CENT) + ' sq ft</dd></div><div><dt class="label">Facing</dt><dd>' + p.facing + '</dd></div><div><dt class="label">' + (p.st === 'a' ? 'Indicative price' : 'Status') + '</dt><dd>' + p.price + '</dd></div></dl>' +
      '<div class="tabs" role="tablist"><button type="button" class="is-active" data-tab="gal">Gallery</button><button type="button" data-tab="plan">Plan</button><button type="button" data-tab="det">Details</button><button type="button" data-tab="guide">Guidelines</button></div>' +
      '<div class="tab is-active" data-tab="gal"><div class="gal">' + p.gallery.map((s, i) => '<button type="button" data-lb="' + i + '"><img src="' + s + '" alt="" loading="lazy"></button>').join('') + '</div></div>' +
      '<div class="tab plan" data-tab="plan">' + planSvg(p.cents) + '<p class="plan__note label">Plot at scale · villa, pool, car · indicative</p></div>' +
      '<div class="tab" data-tab="det"><ul class="details">' + p.details.map(([ic, t]) => '<li><svg><use href="#' + ic + '"/></svg><span>' + t + '</span></li>').join('') + '</ul></div>' +
      '<div class="tab guide" data-tab="guide">' + GUIDE.map((t) => '<p>' + t + '</p>').join('') + '</div>';
  }
  function relatedHtml(item, sc) {
    const pool = sc.hots.filter((h) => h !== item && h.kind !== 'plot'); const plots = sc.hots.filter((h) => h !== item && h.kind === 'plot');
    const list = (item.kind === 'plot' ? plots.filter((p) => p.st === 'a').slice(0, 2).concat(pool.slice(0, 1)) : pool.slice(0, 3)).slice(0, 3);
    if (!list.length) return '';
    return '<div class="rel"><p class="label rel__head">' + (sc.key === 'estate' ? 'Also on the estate' : item.kind === 'plot' ? 'Other plots nearby' : 'Also here') + '</p><ul>' + list.map((h) => '<li><button type="button" data-hot="' + h.id + '"><span class="rel__thumb"><img src="' + h.img + '" alt="" loading="lazy"></span><span class="rel__text"><span class="label rel__eyebrow">' + h.eyebrow + '</span><span class="rel__title">' + h.title + '</span></span><svg class="rel__arrow"><use href="#i-arrow"/></svg></button></li>').join('') + '</ul></div>';
  }
  function shareHtml(p) {
    const url = location.origin + location.pathname + '?plot=' + p.n + (planned ? '&mode=planned' : '') + (SEASONS[seasonIx][0] === 'dusk' ? '&season=dusk' : '') + '#/' + p.area;
    const text = 'Plot ' + pad(p.n) + ' at Elephantine Tales, ' + p.cents + ' cents on ' + ROAD[p.area] + '. ' + url;
    return '<div class="share"><p class="label rel__head">Share</p><p class="share__title">Found your plot? Share it.</p><div class="share__row">' +
      '<button type="button" class="label" data-copy="' + url + '"><svg><use href="#i-copy"/></svg><span>Copy link</span></button>' +
      '<a class="label" href="https://wa.me/?text=' + encodeURIComponent(text) + '" target="_blank" rel="noopener"><svg><use href="#i-chat"/></svg>WhatsApp</a>' +
      '<a class="label" href="mailto:?subject=' + encodeURIComponent('Plot ' + pad(p.n) + ' at Elephantine Tales') + '&body=' + encodeURIComponent(text) + '"><svg><use href="#i-mail"/></svg>Email</a></div><p class="share__note">The link opens the map on this plot.</p></div>';
  }
  function bindSb(item, gallery, capBase) {
    sbScroll.querySelectorAll('[data-lb]').forEach((b) => b.addEventListener('click', () => openLb(gallery, parseInt(b.dataset.lb, 10), capBase)));
    sbScroll.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => { sbScroll.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('is-active', x === b)); sbScroll.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === b.dataset.tab)); }));
    sbScroll.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => goScene(b.dataset.go)));
    sbScroll.querySelectorAll('[data-enquire]').forEach((b) => b.addEventListener('click', () => openEnquire(b.dataset.enquire)));
    sbScroll.querySelectorAll('[data-hot]').forEach((b) => b.addEventListener('click', () => { const h = SCENES[current].hots.find((x) => x.id === b.dataset.hot); if (h) openHot(h); }));
    sbScroll.querySelectorAll('[data-pano]').forEach((b) => b.addEventListener('click', () => openPano(b.dataset.pano)));
    sbScroll.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => { const t = b.querySelector('span'); const done = () => { t.textContent = 'Copied'; setTimeout(() => t.textContent = 'Copy link', 1800); }; if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, done); else done(); }));
    sbScroll.scrollTop = 0;
  }
  function renderHot(item) {
    const sc = SCENES[current];
    sbEyebrow.textContent = item.eyebrow;
    let h = mediaHtml(item.img, item.title) + panoBtn(panoFor(item), item.kind) + '<h2 class="sb__title">' + item.title + '</h2><div class="sb__body"><p>' + item.desc + '</p></div>';
    if (item.kind === 'plot') h += plotHtml(item);
    h += relatedHtml(item, sc);
    if (item.kind === 'plot') h += shareHtml(item);
    h += '<div class="sb__cta">' + (item.scene ? btn('Explore', 'data-go="' + item.scene + '"', 'brown') : item.kind === 'plot' ? (item.st === 'a' ? btn('Enquire about this plot', 'data-enquire="' + item.n + '"', 'brown') : btn('Ask about similar plots', 'data-enquire="0"', 'green')) : btn('Enquire', 'data-enquire="0"', 'green')) + '</div>';
    sbScroll.innerHTML = h;
    bindSb(item, item.gallery || [item.img], item.title);
  }
  const behind = () => [scene, hdr, nav, season, compass, modeEl];
  // The drawer opens over the right side, so these three slide clear of it instead of hiding behind.
  function shiftControls(open) {
    const w = open && !isSmall() ? (sb.getBoundingClientRect().width || 0) : 0;
    const dur = reduced ? 0 : 0.85, ease = 'expo.out';
    // right-hand controls clear the drawer completely
    gsap.to([season, modeEl, $('enqBtn')], { x: -w, duration: dur, ease, overwrite: 'auto' });
    // the centred menu bar and logo re-centre over the map that is still showing
    gsap.to([nav, $('homeBtn')], { xPercent: -50, x: -w / 2, duration: dur, ease, overwrite: 'auto' });
  }
  let lastFocus = null;
  function trapTab(e) {
    if (e.key !== 'Tab' || !sbOpen || !isSmall()) return;   // only the full-screen phone sheet traps focus
    const f = [...sb.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', trapTab);
  function showSb() {
    if (sbOpen) { if (!reduced) gsap.fromTo(sbScroll, { opacity: 0.4, x: 24 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', overwrite: true }); return; }
    lastFocus = document.activeElement;
    sbOpen = true; sb.setAttribute('aria-hidden', 'false'); gsap.set(sb, { visibility: 'visible' }); html.classList.add('sb-open'); shiftControls(true);
    // On phones the sheet covers the screen, so everything behind it is switched off.
    // On desktop it is a side panel: the map, header, season and menu stay live.
    if (isSmall()) { behind().forEach((el) => el.setAttribute('inert', '')); setTimeout(() => $('sbClose').focus({ preventScroll: true }), 60); }
    gsap.fromTo(sbInner, { x: '100%' }, { x: '0%', duration: reduced ? 0 : 1, ease: 'expo.out', overwrite: true });
    gsap.fromTo(sbScroll, { x: -90, opacity: 0.5 }, { x: 0, opacity: 1, duration: reduced ? 0 : 1, ease: 'expo.out', overwrite: true });
  }
  function hideSb() {
    if (!sbOpen) return; sbOpen = false; sb.setAttribute('aria-hidden', 'true'); setActiveHot(null); html.classList.remove('sb-open'); shiftControls(false);
    behind().forEach((el) => el.removeAttribute('inert'));
    if (isSmall() && lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    lastFocus = null;
    gsap.to(sbInner, { x: '100%', duration: reduced ? 0 : 0.65, ease: 'power3.in', overwrite: true, onComplete: () => gsap.set(sb, { visibility: 'hidden' }) });
  }
  $('sbClose').addEventListener('click', hideSb);
  function openHot(h) {
    closeNav(); dismissHints(); setActiveHot(h); renderHot(h); showSb();
    const sbW = isSmall() ? 0 : sb.getBoundingClientRect().width || Math.min(600, vw() * 0.42);
    const target = Math.max(cam.s, minS() * (h.kind === 'plot' ? 1.9 : 1.45));
    flyTo(h.x, h.y, target, 1.4, (vw() - sbW) / 2, isSmall() ? vh() * 0.4 : vh() / 2);
  }

  /* ---------- enquire + terms ---------- */
  function openEnquire(plotN) {
    closeNav(); setActiveHot(null);
    const p = plotN && plotN !== '0' ? (SCENES[current].hots.find((x) => x.kind === 'plot' && x.n === parseInt(plotN, 10))) : null;
    sbEyebrow.textContent = 'Enquire';
    sbScroll.innerHTML =
      '<h2 class="sb__title">' + (p ? 'About plot ' + pad(p.n) : 'Enquire') + '</h2><div class="sb__body"><p>Plots from ₹94 lakh for 21 cents, with 30 and 40 cent plots on the upper road and beside the meadow. The first villas are under construction and the clubhouse opens in 2027. Tell us what you are looking for and we will call within a working day.</p></div>' +
      '<div class="contact"><a href="tel:+919799796005">+91 97997 96005</a><p class="label" style="color:var(--ink-3)">Sembarankulam · off the Oddanchatram road · Kodaikanal</p></div>' +
      '<form class="form" id="enqForm" novalidate><div class="form__fields"><div class="form__row"><div class="fld"><label class="label" for="fFirst">First name*</label><input id="fFirst" type="text" autocomplete="given-name" required><span class="fld__err">This field is required</span></div><div class="fld"><label class="label" for="fLast">Last name*</label><input id="fLast" type="text" autocomplete="family-name" required><span class="fld__err">This field is required</span></div></div>' +
      '<div class="form__row"><div class="fld"><label class="label" for="fEmail">Email*</label><input id="fEmail" type="email" autocomplete="email" required><span class="fld__err">Please enter a valid email address</span></div><div class="fld"><label class="label" for="fPhone">Phone number*</label><input id="fPhone" type="tel" autocomplete="tel" inputmode="tel" required><span class="fld__err">Please enter a valid phone number</span></div></div>' +
      '<div class="fld"><label class="label" for="fSize">Which plot size interests you?*</label><select id="fSize" required><option value="">Choose one</option><option value="21"' + (p && p.cents === 21 ? ' selected' : '') + '>21 cents · from ₹94 L</option><option value="30"' + (p && p.cents === 30 ? ' selected' : '') + '>30 cents · from ₹1.34 Cr</option><option value="40"' + (p && p.cents === 40 ? ' selected' : '') + '>40 cents · from ₹1.79 Cr</option><option value="any">Not sure yet</option></select><span class="fld__err">This field is required</span></div>' +
      '<div class="fld"><label class="label" for="fMsg">Message</label><textarea id="fMsg" rows="2">' + (p ? 'I would like to know more about plot ' + pad(p.n) + ' (' + p.cents + ' cents).' : '') + '</textarea></div>' +
      '<div class="fld"><span class="label">Are you working with a channel partner?</span><div class="chips" id="brokerChips"><button type="button" class="chip label is-active">No</button><button type="button" class="chip label">Yes</button></div></div>' +
      '<label class="check"><input type="checkbox"><i></i><span>Send me updates on WhatsApp as plots are released</span></label>' +
      '<div class="fld"><label class="check"><input type="checkbox" id="fAgree" required><i></i><span>I have read and agree to the privacy policy and the terms of enquiry*</span></label><span class="fld__err">Please agree to continue</span></div>' +
      '<button class="btn btn--brown btn--wide" type="submit"><span class="btn__swap"><span>Submit</span><span>Submit</span></span></button>' +
      '<p class="form__foot">By sharing your number you agree to receive updates from Elephantine Tales on WhatsApp or SMS. Reply STOP at any time. We never share your details.</p></div>' +
      '<div class="form__done" aria-live="polite"><p>Thank you.</p><p>We have your enquiry. Someone from the estate will call within a working day.</p></div></form>';
    const form = $('enqForm');
    form.querySelectorAll('#brokerChips .chip').forEach((c) => c.addEventListener('click', () => form.querySelectorAll('#brokerChips .chip').forEach((x) => x.classList.toggle('is-active', x === c))));
    form.addEventListener('submit', (e) => {
      e.preventDefault(); let ok = true;
      form.querySelectorAll('input[required], select[required]').forEach((i) => {
        const bad = i.type === 'checkbox' ? !i.checked : i.type === 'email' ? !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value) : i.type === 'tel' ? i.value.replace(/\D/g, '').length < 10 : !i.value.trim();
        i.closest('.fld').classList.toggle('is-invalid', bad); if (bad) ok = false;
      });
      if (ok) { form.classList.add('is-done'); sbScroll.scrollTop = 0; }
    });
    form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', () => i.closest('.fld').classList.remove('is-invalid')));
    showSb(); sbScroll.scrollTop = 0;
  }
  $('enqBtn').addEventListener('click', () => openEnquire('0'));
  function openTerms() {
    setActiveHot(null); sbEyebrow.textContent = 'Terms & Conditions';
    sbScroll.innerHTML = '<h2 class="sb__title">Terms &amp; Conditions</h2><div class="terms">' +
      '<h3>About this map</h3><p>This estate explorer is a design concept. The aerial views are illustrative stand-ins, and the positions of plots, roads, amenities and boundaries are indicative. They do not form part of any offer, agreement or contract.</p>' +
      '<h3>Prices and availability</h3><p>Prices are indicative, quoted for 21-cent plots from ₹94 lakh and extrapolated for larger plots at the same rate per cent. Availability changes daily; the plot status shown here is a snapshot and is confirmed by the estate office at the time of enquiry.</p>' +
      '<h3>Your details</h3><p>Details you share through the enquiry form are used only to respond to your enquiry and, if you choose, to send updates about the estate. They are never sold or shared with third parties. Reply STOP to any message to opt out.</p>' +
      '<h3>Photographs</h3><p>Photographs of the land are the estate\'s own. Renders are artist\'s impressions and the built result may differ. Stock photography used in this concept is credited in the project notes.</p>' +
      '<p style="margin-top:20px">© 2026 Elephantine Enterprises Pvt Ltd, Chennai.</p></div><div class="sb__cta">' + btn('Enquire', 'data-enquire="0"', 'green') + '</div>';
    sbScroll.querySelectorAll('[data-enquire]').forEach((b) => b.addEventListener('click', () => openEnquire('0')));
    showSb(); sbScroll.scrollTop = 0;
  }


  /* ==================================================================
     360 VIEW
     ================================================================== */
  const panoEl = $('pano'), panoStage = $('panoStage'), panoCube = $('panoCube');
  const panoNext = $('panoNext'), panoPrev = $('panoPrev'), panoLoading = $('panoLoading'), panoHint = $('panoHint');
  const FACE_T = { f: 'rotateY(0deg)', b: 'rotateY(180deg)', l: 'rotateY(90deg)', r: 'rotateY(-90deg)', u: 'rotateX(-90deg)', d: 'rotateX(90deg)' };
  const FACE_S = 1000, FACE_H = FACE_S / 2;
  const faces = {};
  for (const k in FACE_T) {
    const el = document.createElement('div');
    el.className = 'pano__face';
    el.style.transform = FACE_T[k] + ' translateZ(' + (-FACE_H) + 'px) scale(1.004)';
    panoCube.appendChild(el); faces[k] = el;
  }
  let panoOpen = false, panoKey = null, yaw = 0, pitch = 0, fov = 88, panoDrag = null, panoRet = null;
  const panoPersp = () => (window.innerWidth / 2) / Math.tan(fov * Math.PI / 360);
  function panoRender() {
    const p = panoPersp();
    panoStage.style.perspective = p + 'px';
    panoCube.style.transform = 'translateZ(' + p + 'px) rotateX(' + pitch + 'deg) rotateY(' + yaw + 'deg)';
  }
  function panoLoad(key) {
    const dir = 'images/pano/' + key + '/';
    panoLoading.hidden = false;
    let left = 6;
    Object.keys(faces).forEach((k) => {
      preload(dir + k + '.webp').then(() => { if (--left === 0) panoLoading.hidden = true; });
      faces[k].style.backgroundImage = 'url(' + dir + k + '.webp)';
    });
    panoKey = key;
    $('panoTitle').textContent = PANOS[key].title;
    const n = PANOS[key].next, p = PANOS[key].prev;
    panoNext.hidden = !n; panoPrev.hidden = !p;
    if (n) $('panoNextLabel').textContent = PANOS[n].title;
    if (p) $('panoPrevLabel').textContent = PANOS[p].title;
  }
  function panoStep(key) {
    if (!key || !PANOS[key]) return;
    // push forward, swap, settle back: the step that reads as walking
    gsap.timeline()
      .to({ v: fov }, { v: fov - 26, duration: 0.55, ease: 'power2.in', onUpdate: function () { fov = this.targets()[0].v; panoRender(); } })
      .to(panoStage, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.2)
      .call(() => { panoLoad(key); yaw = PANOS[key].yaw0 || yaw; fov = 108; panoRender(); })
      .to(panoStage, { opacity: 1, duration: 0.5, ease: 'power2.out' })
      .to({ v: 108 }, { v: 88, duration: 0.9, ease: 'power2.out', onUpdate: function () { fov = this.targets()[0].v; panoRender(); } }, '-=0.3');
  }
  function openPano(key, returnTo) {
    if (!PANOS[key]) return;
    panoOpen = true; panoRet = returnTo || null;
    panoEl.setAttribute('aria-hidden', 'false');
    yaw = PANOS[key].yaw0 || 0; pitch = 0; fov = 88;
    panoLoad(key); panoRender();
    gsap.set(panoStage, { opacity: 1 });
    gsap.to(panoEl, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' });
    gsap.fromTo(panoHint, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.5 });
    gsap.to(panoHint, { opacity: 0, duration: 0.8, delay: 5 });
  }
  function closePano() {
    if (!panoOpen) return;
    panoOpen = false; panoEl.setAttribute('aria-hidden', 'true');
    gsap.to(panoEl, { autoAlpha: 0, duration: 0.45, onComplete: () => { Object.values(faces).forEach((f) => f.style.backgroundImage = ''); } });
  }
  $('panoClose').addEventListener('click', closePano);
  panoNext.addEventListener('click', () => panoStep(PANOS[panoKey] && PANOS[panoKey].next));
  panoPrev.addEventListener('click', () => panoStep(PANOS[panoKey] && PANOS[panoKey].prev));
  panoStage.addEventListener('pointerdown', (e) => { panoDrag = { x: e.clientX, y: e.clientY, yaw, pitch }; panoStage.classList.add('is-drag'); panoStage.setPointerCapture(e.pointerId); gsap.to(panoHint, { opacity: 0, duration: 0.4 }); });
  panoStage.addEventListener('pointermove', (e) => {
    if (!panoDrag) return;
    const k = fov / window.innerHeight;
    yaw = panoDrag.yaw - (e.clientX - panoDrag.x) * k;
    pitch = gsap.utils.clamp(-85, 85, panoDrag.pitch + (e.clientY - panoDrag.y) * k);
    panoRender();
  });
  const panoUp = () => { panoDrag = null; panoStage.classList.remove('is-drag'); };
  panoStage.addEventListener('pointerup', panoUp); panoStage.addEventListener('pointercancel', panoUp);
  panoStage.addEventListener('wheel', (e) => { e.preventDefault(); fov = gsap.utils.clamp(38, 104, fov + e.deltaY * 0.05); panoRender(); }, { passive: false });
  window.addEventListener('resize', () => { if (panoOpen) panoRender(); });

  /* ---------- lightbox ---------- */
  let lbList = [], lbIx = 0, lbBase = '', lbOpen = false;
  function openLb(list, i, base) { lbList = list; lbBase = base; showLb(i); }
  function showLb(i) { lbIx = (i + lbList.length) % lbList.length; lbImg.src = lbList[lbIx]; lbCap.textContent = lbBase + (lbList.length > 1 ? ' · ' + pad(lbIx + 1) + ' / ' + pad(lbList.length) : ''); if (!lbOpen) { lbOpen = true; lb.setAttribute('aria-hidden', 'false'); gsap.to(lb, { autoAlpha: 1, duration: 0.5 }); } if (!reduced) gsap.fromTo(lbImg, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }); }
  function closeLb() { if (!lbOpen) return; lbOpen = false; lb.setAttribute('aria-hidden', 'true'); gsap.to(lb, { autoAlpha: 0, duration: 0.4 }); }
  $('lbClose').addEventListener('click', closeLb); $('lbPrev').addEventListener('click', () => showLb(lbIx - 1)); $('lbNext').addEventListener('click', () => showLb(lbIx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (panoOpen) closePano(); else if (lbOpen) closeLb(); else if (sbOpen) hideSb(); else if (navOpen) closeNav(); }
    if (lbOpen && e.key === 'ArrowRight') showLb(lbIx + 1); if (lbOpen && e.key === 'ArrowLeft') showLb(lbIx - 1);
  });

  /* ==================================================================
     HINTS
     ================================================================== */
  let hintsTl = null;
  const hintSet = (name) => hints.querySelectorAll('[data-hint]').forEach((el) => gsap.to(el, { opacity: el.dataset.hint === name ? 1 : 0, duration: 0.6, overwrite: true }));
  function showHints() {
    if (hintsDone || reduced) return; hintsDone = true;
    hints.setAttribute('aria-hidden', 'false');
    hintsTl = gsap.timeline()
      .set(hints, { visibility: 'visible' }).to(hints, { opacity: 1, duration: 0.8 }, 0).call(() => hintSet('drag'), null, 0)
      .call(() => hintSet('zoom'), null, 4.2)
      .to(hints, { opacity: 0, duration: 0.8 }, 8.2).set(hints, { visibility: 'hidden' });
  }
  function dismissHints() { if (!hintsTl) return; hintsTl.kill(); hintsTl = null; gsap.to(hints, { opacity: 0, duration: 0.5, onComplete: () => gsap.set(hints, { visibility: 'hidden' }) }); }

  /* ==================================================================
     INTRO + START
     ================================================================== */
  [hdr, nav, season, compass, modeEl, legend].forEach((e) => e.style.visibility = 'hidden');
  let split = null;
  function introIn() {
    if (window.SplitText) { split = new SplitText('#introTitle', { type: 'chars,words', charsClass: 'char', wordsClass: 'word' }); }
    const chars = split ? split.chars : ['#introTitle'];
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(loader, { autoAlpha: 0, duration: 1.1, ease: 'power2.inOut' }, 0)
      .fromTo('#introMark', { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 1.2 }, 0.5)
      .fromTo('#introEyebrow', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1 }, 0.7)
      .fromTo(chars, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, stagger: 0.028, ease: 'expo.out' }, 0.8)
      .fromTo('#introSub', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1 }, 1.5)
      .fromTo('#introCta', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1 }, 1.8);
    if (reduced) tl.progress(1);
  }
  function start() {
    if (started) return; started = true;
    const sc = SCENES[current];
    if (reduced) { intro.remove(); dim.style.opacity = 0; arrive(sc, { instant: true }); uiIn(); return; }
    const chars = split ? split.chars : ['#introTitle'];
    gsap.timeline()
      .to(chars, { yPercent: -110, opacity: 0, duration: 0.8, stagger: 0.012, ease: 'power3.in' }, 0)
      .to(['#introMark', '#introEyebrow', '#introSub', '#introCta'], { opacity: 0, y: -12, duration: 0.7, ease: 'power2.in', stagger: 0.04 }, 0)
      .to(dim, { opacity: 0, duration: 2.2, ease: 'power2.inOut' }, 0.3)
      .call(() => { intro.remove(); arrive(sc, { fromIntro: true, then: () => { showHints(); openDeepLink(); } }); }, null, 0.5)
      .call(uiIn, null, 2.6);
  }
  function openDeepLink() {
    const hot = qs.get('hot'), pl = parseInt(qs.get('plot') || '0', 10); const sc = SCENES[current];
    const h = pl ? sc.hots.find((x) => x.kind === 'plot' && x.n === pl) : hot ? sc.hots.find((x) => x.id === hot) : null;
    if (h) openHot(h);
  }
  startBtn.addEventListener('click', () => start());

  // boot: pick the scene from the hash, preload, arm the intro
  const hashKey = (location.hash.replace(/^#\/?/, '') || 'estate').replace(/[^a-z]/g, '');
  const initial = SCENES[hashKey] ? hashKey : 'estate';
  (async function boot() {
    const t0 = Date.now();
    await Promise.all([mountScene(initial), preload('images/cloud-1.webp'), preload('images/cloud-2.webp'), preload('images/cloud-3.webp'), document.fonts ? document.fonts.ready : Promise.resolve()]);
    const sc = SCENES[initial];
    placeCamera(minS() * 1.32, sc.focus[0], sc.focus[1]); applyBounds();
    if (qs.has('nointro')) {
      started = true; intro.remove(); gsap.set(loader, { autoAlpha: 0 }); dim.style.opacity = 0;
      arrive(sc, { instant: true }); uiIn(); openDeepLink(); return;
    }
    const wait = Math.max(0, 1600 - (Date.now() - t0));
    setTimeout(() => { startBtn.disabled = false; startBtn.firstElementChild.textContent = 'Explore the estate'; introIn(); }, wait);
  })();
})();
