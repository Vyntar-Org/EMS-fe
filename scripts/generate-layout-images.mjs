// Generates per-app layout background SVGs (sidebar/header/main) in the
// brand palette (navy #003366 family + gold #F5D547), composition matched
// to the BMS Design Ref PDF: dark artwork sidebar, light header/main.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT =
	'/home/venkadesan/VenkyFolder/bala_projects/EMS-frontend/public/assets';

const NAVY_DEEP = '#0A1B33';
const NAVY = '#003366';
const NAVY_MID = '#12233E';
const GOLD = '#F5D547';
const GOLD_DIM = '#E3B13E';
const LIGHT_BLUE = '#7FB3E8';

// Each motif is drawn in a 200x200 box. `s` = stroke color, `f` = fill accent.
const motifs = {
	DEFAULT: (s, f) => `
    <path d="M100,34 L154,65 V135 L100,166 L46,135 V65 Z" stroke="${s}" fill="none"/>
    <circle cx="100" cy="100" r="26" stroke="${s}" fill="none"/>
    <path d="M100,74 v-24 M100,126 v24 M74,100 h-24 M126,100 h24" stroke="${f}" fill="none" stroke-width="3"/>
    <circle cx="100" cy="50" r="5" fill="${f}" stroke="none"/>
    <circle cx="150" cy="100" r="5" fill="${f}" stroke="none"/>
    <circle cx="100" cy="100" r="8" fill="${f}" stroke="none"/>`,
	ENERGY: (s, f) => `
    <path d="M62,178 L90,42 L110,42 L138,178" stroke="${s}" fill="none"/>
    <path d="M70,148 L130,148 M77,116 L123,116 M84,84 L116,84 M70,148 L123,116 M130,148 L77,116" stroke="${s}" fill="none" stroke-width="2.5"/>
    <path d="M66,62 L134,62" stroke="${s}" fill="none"/>
    <path d="M106,74 L86,116 h13 L92,152 L118,106 h-14 Z" fill="${f}" stroke="none"/>`,
	WATER: (s, f) => `
    <path d="M100,30 C100,30 65,78 65,106 A35,35 0 0 0 135,106 C135,78 100,30 100,30 Z" stroke="${s}" fill="none"/>
    <path d="M78,108 A22,22 0 0 0 100,128" stroke="${f}" fill="none" stroke-width="3"/>
    <path d="M18,152 Q43,138 68,152 T118,152 T168,152" stroke="${s}" fill="none"/>
    <path d="M18,172 Q43,158 68,172 T118,172 T168,172" stroke="${f}" fill="none"/>`,
	STP: (s, f) => `
    <rect x="45" y="66" width="42" height="84" rx="7" stroke="${s}" fill="none"/>
    <rect x="117" y="88" width="42" height="62" rx="7" stroke="${s}" fill="none"/>
    <path d="M87,108 L117,108" stroke="${f}" fill="none"/>
    <path d="M52,80 h28 M52,94 h28" stroke="${f}" fill="none" stroke-width="2.5"/>
    <path d="M18,170 Q46,156 74,170 T130,170 T186,170" stroke="${f}" fill="none"/>`,
	FUEL: (s, f) => `
    <rect x="58" y="55" width="56" height="105" rx="9" stroke="${s}" fill="none"/>
    <rect x="70" y="70" width="32" height="26" rx="4" stroke="${f}" fill="none" stroke-width="3"/>
    <path d="M114,84 C142,84 142,100 142,118 L142,142 A10,10 0 0 1 122,142" stroke="${s}" fill="none"/>
    <path d="M46,160 L126,160" stroke="${f}" fill="none"/>
    <path d="M86,112 L79,130 h8 L83,148 L95,124 h-8 Z" fill="${f}" stroke="none"/>`,
	SOLAR: (s, f) => `
    <circle cx="100" cy="62" r="20" stroke="${f}" fill="none"/>
    <g stroke="${f}" stroke-width="3">
      <path d="M100,30 v-12 M100,94 v6 M68,62 h-12 M132,62 h12 M77,39 l-8,-8 M123,39 l8,-8 M77,85 l-6,6 M123,85 l6,6"/>
    </g>
    <path d="M42,118 L158,118 L180,170 L20,170 Z" stroke="${s}" fill="none"/>
    <path d="M80,118 L70,170 M120,118 L130,170 M31,144 L169,144" stroke="${s}" fill="none" stroke-width="2.5"/>`,
	COMPRESSOR: (s, f) => `
    <circle cx="100" cy="102" r="54" stroke="${s}" fill="none"/>
    <circle cx="100" cy="102" r="70" stroke="${s}" fill="none" opacity="0.35"/>
    <g stroke="${f}" stroke-width="3">
      <path d="M100,55 v10 M100,139 v10 M53,102 h10 M137,102 h10 M67,69 l7,7 M133,69 l-7,7"/>
    </g>
    <path d="M100,102 L132,74" stroke="${f}" fill="none" stroke-width="4.5"/>
    <circle cx="100" cy="102" r="7" fill="${f}" stroke="none"/>`,
	TEMPERATURE: (s, f) => `
    <rect x="87" y="34" width="26" height="96" rx="13" stroke="${s}" fill="none"/>
    <circle cx="100" cy="150" r="23" stroke="${s}" fill="none"/>
    <path d="M100,64 L100,150" stroke="${f}" fill="none" stroke-width="8" stroke-linecap="round"/>
    <circle cx="100" cy="150" r="11" fill="${f}" stroke="none"/>
    <path d="M121,52 h14 M121,74 h10 M121,96 h14" stroke="${f}" fill="none" stroke-width="3"/>`,
	'FIRE-SAFETY': (s, f) => `
    <path d="M100,32 L152,54 V104 C152,140 129,161 100,174 C71,161 48,140 48,104 V54 Z" stroke="${s}" fill="none"/>
    <path d="M100,68 C113,88 124,97 124,114 A24,24 0 0 1 76,114 C76,100 87,90 91,78 C94,94 106,93 100,68 Z" fill="${f}" stroke="none"/>`,
	FLOWMETER: (s, f) => `
    <rect x="28" y="96" width="144" height="32" rx="7" stroke="${s}" fill="none"/>
    <path d="M52,96 V128 M148,96 V128" stroke="${s}" fill="none" stroke-width="2.5"/>
    <circle cx="100" cy="66" r="24" stroke="${s}" fill="none"/>
    <path d="M92,90 h16 M100,66 L114,54" stroke="${f}" fill="none" stroke-width="3.5"/>
    <path d="M62,112 l10,-7 v14 Z M84,112 l10,-7 v14 Z M106,112 l10,-7 v14 Z" fill="${f}" stroke="none"/>`,
};

const dots = (id, color, r = 2, gap = 16, op = 0.55) => `
  <pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse">
    <circle cx="${r}" cy="${r}" r="${r}" fill="${color}" opacity="${op}"/>
  </pattern>`;

const glow = (id, color) => `
  <filter id="${id}" x="-60%" y="-60%" width="220%" height="220%">
    <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${color}" flood-opacity="0.55"/>
  </filter>`;

const motifGroup = (app, x, y, scale, stroke, fill, opacity, useGlow) => `
  <g transform="translate(${x},${y}) scale(${scale})" opacity="${opacity}"
     stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
     ${useGlow ? 'filter="url(#glow)"' : ''}>
    ${motifs[app](stroke, fill)}
  </g>`;

const sidebarSvg = (
	app
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 1600" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${NAVY_MID}"/>
      <stop offset="0.45" stop-color="${NAVY_DEEP}"/>
      <stop offset="1" stop-color="${NAVY}"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY_DEEP}" stop-opacity="0"/>
      <stop offset="1" stop-color="${NAVY_DEEP}" stop-opacity="0.85"/>
    </linearGradient>
    ${dots('gd', GOLD)}
    ${glow('glow', GOLD)}
  </defs>
  <rect width="440" height="1600" fill="url(#bg)"/>
  <rect x="24" y="26" width="230" height="150" fill="url(#gd)"/>
  <rect x="230" y="1180" width="190" height="150" fill="url(#gd)" opacity="0.6"/>
  <path d="M-40,1240 L300,900 L520,900" stroke="${GOLD}" stroke-opacity="0.35" fill="none" stroke-width="2"/>
  <path d="M-40,1300 L330,930" stroke="${LIGHT_BLUE}" stroke-opacity="0.18" fill="none" stroke-width="2"/>
  <circle cx="380" cy="760" r="120" stroke="${GOLD}" stroke-opacity="0.10" fill="none" stroke-width="1.5"/>
  <circle cx="380" cy="760" r="170" stroke="${GOLD}" stroke-opacity="0.06" fill="none" stroke-width="1.5"/>
  <circle cx="220" cy="1250" r="180" fill="${GOLD}" opacity="0.07"/>
  ${motifGroup(app, 95, 1130, 1.25, '#A9D2FF', GOLD, 1, true)}
  ${motifGroup(app, 250, 480, 0.7, LIGHT_BLUE, GOLD, 0.1, false)}
  <rect y="1440" width="440" height="160" fill="url(#fade)"/>
</svg>
`;

const headerSvg = (
	app
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 150" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0.2">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#F2F6FB"/>
    </linearGradient>
    <linearGradient id="wedge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY_MID}"/>
      <stop offset="1" stop-color="${NAVY}"/>
    </linearGradient>
    ${dots('gd', GOLD, 1.8, 14)}
    ${dots('nd', '#B9C7D9', 1.6, 14, 0.5)}
  </defs>
  <rect width="1920" height="150" fill="url(#bg)"/>
  <polygon points="0,0 460,0 260,150 0,150" fill="url(#wedge)"/>
  <polygon points="460,0 500,0 300,150 260,150" fill="${GOLD}" opacity="0.9"/>
  <rect x="20" y="18" width="200" height="60" fill="url(#gd)"/>
  <rect x="1600" y="30" width="240" height="90" fill="url(#nd)"/>
  <path d="M1500,118 L1560,74 M1530,122 L1590,78" stroke="${GOLD_DIM}" stroke-width="8" stroke-linecap="round" opacity="0.85"/>
  ${motifGroup(app, 1740, 8, 0.62, NAVY, GOLD_DIM, 0.16, false)}
</svg>
`;

const mainSvg = (
	app
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="#FBFCFE"/>
      <stop offset="1" stop-color="#F2F6FA"/>
    </linearGradient>
    <linearGradient id="corner" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${NAVY_DEEP}" stop-opacity="0.9"/>
    </linearGradient>
    ${dots('gd', GOLD_DIM, 2, 18, 0.5)}
    ${dots('nd', '#C4D2E3', 1.8, 18, 0.55)}
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <rect x="40" y="30" width="260" height="170" fill="url(#nd)"/>
  <rect x="1620" y="60" width="260" height="200" fill="url(#gd)"/>
  <path d="M300,0 L760,0 L300,460 Z" fill="#E9EFF6" opacity="0.55"/>
  <circle cx="330" cy="960" r="150" stroke="${GOLD_DIM}" stroke-opacity="0.35" fill="none" stroke-width="2"/>
  <circle cx="330" cy="960" r="210" stroke="${GOLD_DIM}" stroke-opacity="0.2" fill="none" stroke-width="2"/>
  <circle cx="330" cy="960" r="90" fill="${GOLD_DIM}" opacity="0.18"/>
  <polygon points="1920,640 1920,1080 1080,1080" fill="url(#corner)"/>
  <g stroke="${GOLD}" stroke-width="2" fill="none" opacity="0.7">
    <path d="M1380,1010 h140 l60,-60 h120"/>
    <path d="M1450,1060 h190 l70,-70"/>
    <circle cx="1380" cy="1010" r="5" fill="${GOLD}"/>
    <circle cx="1450" cy="1060" r="5" fill="${GOLD}"/>
  </g>
  <rect x="1660" y="820" width="220" height="150" fill="url(#gd)" opacity="0.5"/>
  ${motifGroup(app, 1560, 690, 1.3, '#FFFFFF', GOLD, 0.22, false)}
  ${motifGroup(app, 120, 260, 1.1, NAVY, GOLD_DIM, 0.05, false)}
</svg>
`;

const apps = Object.keys(motifs);
for (const app of apps) {
	const dir = join(OUT, `${app}-LAYOUT-IMAGES`);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, 'sidebar.svg'), sidebarSvg(app));
	writeFileSync(join(dir, 'header.svg'), headerSvg(app));
	writeFileSync(join(dir, 'main.svg'), mainSvg(app));
	console.log('wrote', dir);
}
