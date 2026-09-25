import type { APIRoute } from 'astro';
import { handleCounter } from '../../server/counter';
import { upstashFromEnv } from '../../server/upstash';

export const prerender = false;

const deps = upstashFromEnv(process.env);

const handler: APIRoute = ({ request }) =>
  handleCounter(request, { store: deps?.store ?? null, limiters: deps?.limiters ?? [], salt: process.env.COUNTER_SALT ?? '' });

export const GET = handler;
export const POST = handler;
