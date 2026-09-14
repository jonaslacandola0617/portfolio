if (process.env.VERCEL_ENV === 'preview') {
  await import('./import-case-study-media.mjs');
}
