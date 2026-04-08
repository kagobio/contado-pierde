export default function Spinner({ size = 'md' }) {
  return <div className={`spinner ${size === 'sm' ? 'sm' : ''}`} />;
}
