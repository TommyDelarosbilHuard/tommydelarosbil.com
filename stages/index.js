/* Registry: every `.stg[data-stage]` the page renders gets its world; stages that leave the page are torn down.
   route() calls Stages.attach() after each render. */
import { mountStage } from './core.js';

const LOADERS = {
  'cedar': () => import('./cedar.js'),
  'payment-gateway': () => import('./gdi.js'),
  'waitzine': () => import('./waitzine-loop.js'),             // the screenshot on a loop (2026-10-18);
  'mastering-revisions': () => import('./revisions-loop.js'),  // waitzine.js and revisions.js are the earlier rebuilds
  'compass-system': () => import('./compass-system.js'),
  'compass-intel': () => import('./compass-intel.js'),
  'beer-table': () => import('./beer.js'),
};
const live = new Map();
function attach() {
  for (const [h, inst] of live) if (!document.contains(h)) { inst.destroy(); live.delete(h); }
  document.querySelectorAll('.stg[data-stage]').forEach(h => {
    if (live.has(h) || !LOADERS[h.dataset.stage]) return;
    live.set(h, mountStage(h, LOADERS[h.dataset.stage]));
  });
}
window.Stages = { attach };
attach();
