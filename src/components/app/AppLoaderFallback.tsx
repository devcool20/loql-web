export default function AppLoaderFallback() {
  return (
    <div className="app-loader-fallback" role="status" aria-label="Loading Loql">
      <div className="mitti-noise-layer" aria-hidden="true" />
      <div className="app-loader-mark" aria-hidden="true">
        <span className="font-serif">Loql</span>
        <i />
      </div>
      <p>Apna pados, apni cheezein.</p>
    </div>
  );
}
