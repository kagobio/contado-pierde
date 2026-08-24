export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <img src="/logo-voila.svg" alt="Voilà" className="loading-logo-img" />
      <div className="spinner" style={{ marginTop: 32 }} />
    </div>
  );
}
