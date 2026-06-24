let status = 'pending';
let promise;

// Stands in for a real async asset fetch (e.g. useGLTF) so the Suspense
// loading-indicator path is exercised even though this demo's geometry
// is procedural and has nothing to actually load.
export default function getDemoLoadResource(delayMs = 600) {
  if (!promise) {
    promise = new Promise((resolve) => setTimeout(resolve, delayMs)).then(() => {
      status = 'done';
    });
  }
  if (status !== 'done') throw promise;
}
