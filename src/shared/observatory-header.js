/* SPDX-License-Identifier: MIT
 * Header composition and flow rails adapted with owner permission from
 * yinweinidongle/big-screen-astra, d20e80789dee708faff031df840d03d2af8efd72.
 * See docs/licensing/astra-owner-permission.txt for artwork scope.
 */
(() => {
  'use strict';
  function rails(paths, nodes, color, duration, secondary = false) {
    const segments = [
      [132, 9, 0.1],
      [120, 2.1, 0.19],
      [78, 2.1, 0.28],
      [40, 2.1, 0.48],
      [7, 2.7, 1],
    ];
    return `<g class="ob-flow-system${secondary ? ' ob-flow-secondary' : ''}" style="--flow-color:${color};--flow-duration:${duration}s" fill="none" stroke-linecap="round">
      ${paths.map((path) => `<g><path class="ob-flow-guide" d="${path}" vector-effect="non-scaling-stroke"/><g class="ob-flow-envelope">${segments.map(([length, width, opacity]) => `<path class="ob-flow-segment" d="${path}" pathLength="1000" vector-effect="non-scaling-stroke" style="--segment-start:${length}px;--segment-end:${length - 1135}px;stroke-dasharray:${length} ${1000 - length};stroke-width:${width};opacity:${opacity}"/>`).join('')}</g></g>`).join('')}
      ${nodes.map(([x, y]) => `<g class="ob-flow-node" transform="translate(${x} ${y})"><circle class="ob-flow-ring" r="7" vector-effect="non-scaling-stroke"/><path d="M-12 0H-9M9 0H12M0 -12V-9M0 9V12" stroke-width=".6" opacity=".55" vector-effect="non-scaling-stroke"/><circle class="ob-flow-core" r="2.3"/></g>`).join('')}
    </g>`;
  }
  function create(kind, source) {
    // Source is a build-resolved local asset URL, never third-party markup.
    const image = source.replace(
      /[&"<>]/g,
      (c) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[c],
    );
    let viewBox, background, overlay;
    if (kind === 'agriculture') {
      viewBox = '0 30 2172 620';
      background = `<image href="${image}" width="2172" height="724" opacity=".9" mask="url(#ob-header-background-mask)"/>`;
      overlay = `<defs>
        <linearGradient id="ob-header-feather"><stop stop-color="white" stop-opacity="0"/><stop offset=".28" stop-color="white" stop-opacity=".2"/><stop offset=".65" stop-color="white" stop-opacity=".65"/><stop offset=".88" stop-color="white"/><stop offset=".95" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
        <linearGradient id="ob-header-fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".75" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient>
        <mask id="ob-header-background-mask"><rect x="0" y="30" width="2172" height="620" fill="url(#ob-header-fade)"/></mask>
        <path id="ob-header-vein" d="M-40 413C160 263 333 464 608 558S938 614 1090 608"/>
        <mask id="ob-header-vein-mask" maskUnits="userSpaceOnUse" x="-120" y="200" width="1350" height="450"><rect class="ob-header-vein-window" x="-360" y="200" width="340" height="450" fill="url(#ob-header-feather)"/></mask>
      </defs>
      <g class="ob-header-vein" mask="url(#ob-header-vein-mask)"><use class="ob-header-vein-halo" href="#ob-header-vein"/><use class="ob-header-vein-core" href="#ob-header-vein"/></g>
      <g transform="translate(2172 0) scale(-1 1)"><g class="ob-header-vein" mask="url(#ob-header-vein-mask)"><use class="ob-header-vein-halo" href="#ob-header-vein"/><use class="ob-header-vein-core" href="#ob-header-vein"/></g></g>
      ${rails(
        ['M28 435C241 346 383 547 714 586', 'M2144 435C1931 346 1789 547 1458 586'],
        [
          [608, 558],
          [1564, 558],
        ],
        '#c5e8a6',
        7,
        true,
      )}
      <g class="ob-header-arrival" fill="none" stroke="#e2dea2" stroke-width=".7"><path d="M1034 631Q1086 620 1138 631M1050 640Q1086 631 1122 640" vector-effect="non-scaling-stroke"/><path d="M1086 620Q1076 608 1067 614Q1074 624 1086 620Q1098 624 1105 614Q1096 608 1086 620" fill="#d1dfad" fill-opacity=".25"/></g>`;
    } else if (kind === 'industry') {
      viewBox = '0 105 2172 505';
      background = `<image href="${image}" width="2172" height="724" opacity=".85"/>`;
      overlay =
        rails(
          ['M0 498H366L426 550H655L711 606', 'M2172 205H1880L1824 183H1620'],
          [
            [366, 498],
            [1880, 205],
            [655, 550],
            [1620, 183],
          ],
          '#ffda96',
          6,
        ) +
        rails(['M0 517H350L411 570H624', 'M2172 225H1889L1834 203H1651'], [], '#d99546', 6, true) +
        `<g stroke="#e3a55e" fill="none" opacity=".55" stroke-width=".8"><path d="M753 606H909M941 606H990M1182 606H1231M1263 606H1419" vector-effect="non-scaling-stroke"/><path d="M1062 587L1086 599L1110 587"/></g><g class="ob-header-arrival" fill="#eeb97b">${Array.from({ length: 7 }, (_, i) => `<rect x="${1036 + i * 14}" y="600" width="7" height="5" opacity="${i === 3 ? 1 : 0.5}"/>`).join('')}</g>`;
    } else {
      viewBox = '0 380 1419 330';
      background = `<image href="${image}" width="1419" height="1108" opacity=".88"/>`;
      overlay =
        rails(
          ['M0 420C190 452 250 650 580 650', 'M1419 420C1229 452 1169 650 839 650'],
          [
            [580, 650],
            [839, 650],
          ],
          '#c4b2ff',
          5.8,
        ) +
        rails(
          ['M0 456C190 492 290 678 610 678', 'M1419 456C1229 492 1129 678 809 678'],
          [],
          '#91dfff',
          7,
          true,
        ) +
        '<path d="M640 650H779" stroke="#91dfff" stroke-width=".8" opacity=".45" vector-effect="non-scaling-stroke"/><g class="ob-header-arrival" fill="#d0c3ff"><circle cx="700" cy="650" r="2"/><circle cx="719" cy="650" r="2"/></g>';
    }
    return `<svg class="ob-header-art" data-header-kind="${kind}" viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${background}${overlay}</svg>`;
  }
  window.ObservatoryHeader = { create };
})();
