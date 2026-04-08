import { useAppStore } from '../store/useAppStore';

export default function Toast() {
  const toastMsg     = useAppStore(s => s.toastMsg);
  const toastType    = useAppStore(s => s.toastType);
  const toastVisible = useAppStore(s => s.toastVisible);

  if (!toastVisible || !toastMsg) return null;

  return (
    <div className={`toast ${toastType}`}>
      {toastMsg}
    </div>
  );
}
