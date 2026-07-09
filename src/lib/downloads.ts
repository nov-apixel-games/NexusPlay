export const getDownloadsNum = (app: any): number => {
  if (!app) return 0;
  if (typeof app === 'number') return app;
  if (typeof app === 'string') return parseInt(app.replace(/[^0-9]/g, '')) || 0;
  if (typeof app.download_count === 'number') return app.download_count;
  const d = app.downloads;
  if (typeof d === 'number') return d;
  if (typeof d === 'string') return parseInt(d.replace(/[^0-9]/g, '')) || 0;
  return 0;
};
