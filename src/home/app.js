/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.screen-card')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  let active = null;
  const timers = new WeakMap();
  function stop(card) {
    if (!card) return;
    clearTimeout(timers.get(card));
    card.querySelector('.iframe-host').replaceChildren();
    card.classList.remove('live', 'loading');
    const button = card.querySelector('.live-toggle');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<i></i>实时预览';
    if (active === card) active = null;
  }
  function size(card) {
    const frame = card.querySelector('iframe');
    if (!frame) return;
    const host = card.querySelector('.preview-wrap');
    const width = Number(card.dataset.width),
      height = Number(card.dataset.height);
    const scale = Math.min(host.clientWidth / width, host.clientHeight / height);
    Object.assign(frame.style, {
      width: width + 'px',
      height: height + 'px',
      left: (host.clientWidth - width * scale) / 2 + 'px',
      top: (host.clientHeight - height * scale) / 2 + 'px',
      transform: `scale(${scale})`,
    });
  }
  cards.forEach((card) => {
    card.querySelector('.live-toggle').onclick = () => {
      if (active === card) {
        stop(card);
        return;
      }
      stop(active);
      active = card;
      card.classList.add('live', 'loading');
      const frame = document.createElement('iframe');
      frame.title = card.dataset.title + '实时预览';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-downloads');
      frame.src = card.dataset.page;
      const fail = () => {
        if (active !== card) return;
        stop(card);
        card.querySelector('.live-toggle').textContent = '预览失败，点击重试';
      };
      frame.onerror = fail;
      frame.onload = () => {
        if (active !== card) return;
        try {
          if (!frame.contentDocument?.querySelector('canvas, svg, main')) {
            fail();
            return;
          }
        } catch {
          fail();
          return;
        }
        clearTimeout(timers.get(card));
        card.classList.remove('loading');
        size(card);
      };
      timers.set(card, setTimeout(fail, 20000));
      card.querySelector('.iframe-host').append(frame);
      size(card);
      const button = card.querySelector('.live-toggle');
      button.setAttribute('aria-pressed', 'true');
      button.innerHTML = '<i></i>关闭预览';
    };
  });
  filters.forEach(
    (button) =>
      (button.onclick = () => {
        stop(active);
        filters.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        let count = 0;
        cards.forEach((card) => {
          card.hidden =
            button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
          if (!card.hidden) count++;
        });
        document.querySelector('#collection-count').textContent = count + ' 个作品';
      }),
  );
  const resize = new ResizeObserver(() => {
    if (active) size(active);
  });
  resize.observe(document.querySelector('.screen-grid'));
  const visibility = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting && active === e.target) stop(active);
      }),
    { rootMargin: '150px' },
  );
  cards.forEach((card) => visibility.observe(card));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(active);
  });
  addEventListener('pagehide', () => {
    stop(active);
  });
  document.querySelector('footer>a:last-child').onclick = (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };
})();
