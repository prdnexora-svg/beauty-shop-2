// Resolve image/asset imports to a stub so components can be server-rendered
// under plain Node. Vite handles these at build time; the test harness does not.
const ASSET = /\.(jpe?g|png|webp|svg|gif|avif|ico|bmp)$/i;

export async function resolve(specifier, context, next) {
  if (ASSET.test(specifier)) {
    return {
      url: 'data:text/javascript,export default ' + JSON.stringify(specifier),
      shortCircuit: true,
      format: 'module',
    };
  }
  return next(specifier, context);
}
