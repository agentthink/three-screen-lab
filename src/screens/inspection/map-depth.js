/* Geographic extrusion and light treatment for the China dashboard map. */
function drawMapDepth(parent, defs, outlinePath) {
  const depth = 32;
  const sideShift = 6;
  const outlineId = 'china-national-outline';
  defs.append('path').attr('id', outlineId).attr('d', outlinePath);

  const gradient = (id, stops, x2 = '15%', y2 = '100%') => {
    const g = defs
      .append('linearGradient')
      .attr('id', id)
      .attr('x1', '10%')
      .attr('y1', '0%')
      .attr('x2', x2)
      .attr('y2', y2);
    stops.forEach(([offset, color, opacity = 1]) => {
      g.append('stop')
        .attr('offset', offset)
        .attr('stop-color', color)
        .attr('stop-opacity', opacity);
    });
  };
  gradient(
    'map-edge-light',
    [
      ['0%', '#ecffff'],
      ['32%', '#9af1ff'],
      ['66%', '#49dfff'],
      ['100%', '#1ebcf1'],
    ],
    '75%',
    '100%',
  );
  gradient(
    'map-surface-light',
    [
      ['0%', '#ddfaff', 0.32],
      ['30%', '#9ce9ff', 0.12],
      ['65%', '#0872b8', 0.04],
      ['100%', '#001d48', 0.29],
    ],
    '45%',
    '100%',
  );
  gradient('map-base-rim', [
    ['0%', '#0f4b7e'],
    ['50%', '#238db6'],
    ['100%', '#1ad0ed'],
  ]);
  const blur = (id, amount) =>
    defs
      .append('filter')
      .attr('id', id)
      .attr('x', '-25%')
      .attr('y', '-25%')
      .attr('width', '150%')
      .attr('height', '160%')
      .append('feGaussianBlur')
      .attr('stdDeviation', amount);
  blur('map-ground-shadow', 12);
  blur('map-wide-aura', 10);
  blur('map-edge-aura', 3.4);
  blur('map-bevel-soften', 1.2);

  const useOutline = (group) => group.append('use').attr('href', `#${outlineId}`);
  const base = parent
    .append('g')
    .attr('class', 'map-solid-base')
    .attr('aria-hidden', 'true')
    .attr('pointer-events', 'none');

  // A displaced, opaque shadow separates the solid map from the basemap.
  useOutline(base)
    .attr('transform', `translate(12 ${depth + 13})`)
    .attr('fill', '#000711')
    .attr('stroke', '#000711')
    .attr('stroke-width', 13)
    .attr('filter', 'url(#map-ground-shadow)')
    .attr('opacity', 0.96);
  useOutline(base)
    .attr('transform', `translate(${sideShift} ${depth + 2})`)
    .attr('fill', 'none')
    .attr('stroke', '#0080ba')
    .attr('stroke-width', 12)
    .attr('filter', 'url(#map-wide-aura)')
    .attr('opacity', 0.4);

  // Render the whole country's silhouette at each elevation, avoiding seams
  // and vertical walls along internal province borders.
  const layers = base.append('g').attr('class', 'map-extrusion');
  for (let z = depth; z >= 1; z--) {
    const elevation = 1 - z / depth;
    const color = d3.interpolateRgb('#042d4e', '#1489b5')(elevation);
    useOutline(layers)
      .attr('transform', `translate(${(sideShift * z) / depth} ${z})`)
      .attr('fill', color)
      .attr('stroke', color)
      .attr('stroke-width', 0.7);
  }

  // The thin bottom rim reads as the lower edge of the extruded block.
  useOutline(base)
    .attr('transform', `translate(${sideShift} ${depth})`)
    .attr('fill', 'none')
    .attr('stroke', 'url(#map-base-rim)')
    .attr('stroke-width', 1.3)
    .attr('opacity', 0.88);

  // The aura uses the national boundary only, keeping internal borders clear.
  const aura = parent
    .append('g')
    .attr('class', 'map-outer-aura')
    .attr('aria-hidden', 'true')
    .attr('pointer-events', 'none');
  useOutline(aura)
    .attr('fill', 'none')
    .attr('stroke', '#00baff')
    .attr('stroke-width', 16)
    .attr('filter', 'url(#map-wide-aura)')
    .attr('opacity', 0.68);
  useOutline(aura)
    .attr('fill', '#62b9e6')
    .attr('stroke', '#56ddff')
    .attr('stroke-width', 6)
    .attr('filter', 'url(#map-edge-aura)')
    .attr('opacity', 0.78);
}

function finishMapSurface(parent) {
  const surface = parent
    .append('g')
    .attr('class', 'map-top-bevel')
    .attr('pointer-events', 'none')
    .attr('aria-hidden', 'true');
  const useOutline = () => surface.append('use').attr('href', '#china-national-outline');
  // A broad inward highlight makes the top edge look beveled instead of flat.
  const inset = surface.append('g').attr('clip-path', 'url(#china-clip)');
  inset
    .append('use')
    .attr('href', '#china-national-outline')
    .attr('fill', 'url(#map-surface-light)');
  inset
    .append('use')
    .attr('href', '#china-national-outline')
    .attr('fill', 'none')
    .attr('stroke', '#b1efff')
    .attr('stroke-width', 10)
    .attr('filter', 'url(#map-bevel-soften)')
    .attr('opacity', 0.43);
  useOutline()
    .attr('fill', 'none')
    .attr('stroke', '#03b6f3')
    .attr('stroke-width', 5)
    .attr('filter', 'url(#map-edge-aura)')
    .attr('opacity', 0.88);
  useOutline()
    .attr('fill', 'none')
    .attr('stroke', 'url(#map-edge-light)')
    .attr('stroke-width', 2.2)
    .attr('stroke-linejoin', 'round');
  useOutline()
    .attr('transform', 'translate(-.4 -.7)')
    .attr('fill', 'none')
    .attr('stroke', '#e1fbff')
    .attr('stroke-width', 0.65)
    .attr('opacity', 0.85);
}
