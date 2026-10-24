/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';
  const cleanups = new Set();
  function onDispose(callback) {
    cleanups.add(callback);
    return () => cleanups.delete(callback);
  }
  addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    for (const callback of cleanups) callback();
    cleanups.clear();
  });
  function mountStage(element, width, height, onResize = () => {}) {
    if (!element || width <= 0 || height <= 0) throw new Error('Invalid stage dimensions');
    const fit = () => {
      const scale = Math.min(innerWidth / width, innerHeight / height);
      element.style.transform = `translate(-50%, -50%) scale(${scale})`;
      onResize(scale);
    };
    addEventListener('resize', fit, { passive: true });
    fit();
    const dispose = () => removeEventListener('resize', fit);
    onDispose(dispose);
    return { fit, dispose };
  }
  window.VizLabRuntime = Object.freeze({ mountStage, onDispose });
})();
