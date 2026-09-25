/**
 * Runtime for the single-file preview (scripts/build-preview-file.ts).
 * Every page of the site sits in the file as a hidden section; links to "/..." switch
 * sections through the URL hash instead of loading a new page.
 */
import { h, render } from 'preact';
import CrateApp from '../../src/components/CrateApp';
import { fitVerse } from '../../src/lib/fit-verse';
import type { CardData } from '../../src/lib/readings';

declare const __POOL__: CardData[];

document.documentElement.lang = 'vi';

const pages = [...document.querySelectorAll<HTMLElement>('[data-route]')];
const routes = new Set(pages.map((p) => p.dataset.route!));
const toToken = (route: string) => route.replace(/^\//, '').replace(/\//g, '.');
const toRoute = (token: string) => `/${token.replace(/\./g, '/')}`;

function show(route: string): void {
  const page = pages.find((p) => p.dataset.route === route) ?? pages.find((p) => p.dataset.route === '/')!;
  // A real page load would close the result popup; do the same here.
  for (const d of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) d.close();
  for (const p of pages) p.hidden = p !== page;
  document.title = page.dataset.title ?? document.title;
  window.scrollTo(0, 0);
  const body = page.querySelector<HTMLElement>('[data-reading-body]');
  if (body) fitVerse(body);
}

function onHash(): void {
  const token = decodeURIComponent(location.hash.slice(1));
  const route = token ? toRoute(token) : '/';
  if (routes.has(route)) return show(route);
  if (!token) return show('/');
  // An in-page anchor such as #hom-nay: scroll to it on the page that is showing.
  document.getElementById(token)?.scrollIntoView();
}

document.addEventListener('click', (event) => {
  const link = (event.target as Element | null)?.closest?.('a');
  const href = link?.getAttribute('href');
  if (!href || !href.startsWith('/') || href.startsWith('//')) return;
  event.preventDefault();
  const route = href.split('#')[0] || '/';
  const token = toToken(route);
  if (location.hash.slice(1) === token) show(route);
  else location.hash = token;
});

window.addEventListener('hashchange', onHash);
window.addEventListener('resize', () => {
  const body = pages.find((p) => !p.hidden)?.querySelector<HTMLElement>('[data-reading-body]');
  if (body) fitVerse(body);
});
void document.fonts?.ready.then(onHash);

const root = document.getElementById('crate-root');
if (root) render(h(CrateApp, { pool: __POOL__ }), root);
onHash();
