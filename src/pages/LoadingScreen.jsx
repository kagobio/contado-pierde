export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <img src="/logo-cp2.svg" alt="Contado Pierde" className="loading-logo-img" />
      <div className="spinner" style={{ marginTop: 32 }} />
    </div>
  );
}
