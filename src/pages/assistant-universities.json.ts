import type { APIRoute } from 'astro';
import { universityDocs } from '../lib/assistant-unis';

// Universities for the "Ask Destiny" assistant, loaded only when a question needs them.
export const GET: APIRoute = () => new Response(JSON.stringify(universityDocs()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
