import { useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';

const KITS = [
  { processType: 'c41',  name: 'Kit C41',   defaultCapacity: 12 },
  { processType: 'ecn2', name: 'Kit ECN-2',  defaultCapacity: 8  },
];

function statusColor(pct) {
  if (pct >= 1)    return '#ff453a';
  if (pct >= 0.75) return '#ff9f0a';
  return '#34c759';
}
function statusLabel(pct) {
  if (pct >= 1)    return '🔴 Cambiar ya';
  if (pct >= 0.75) return '🟡 Cambiar pronto';
  return '🟢 En buen estado';
}

export default function AdminChemicalsPage() {
  const chemicals        = useAppStore(s => s.chemicals);
  const adminSaveChemical  = useAppStore(s => s.adminSaveChemical);
  const adminResetChemical = useAppStore(s => s.adminResetChemical);
  const [capacities, setCapacities] = useState({});
  const [saving, setSaving] = useState({});

  function getKit(processType) {
    return chemicals.find(c => c.processType === processType) || null;
  }

  async function handleSave(kit) {
    const cap = capacities[kit.processType] ?? getKit(kit.processType)?.totalCapacity ?? kit.defaultCapacity;
    setSaving(s => ({ ...s, [kit.processType]: true }));
    await adminSaveChemical({ processType: kit.processType, name: kit.name, totalCapacity: cap });
    setSaving(s => ({ ...s, [kit.processType]: false }));
  }

  async function handleReset(processType) {
    if (!confirm('¿Marcar como cambiado y resetear a 0 carretes usados?')) return;
    await adminResetChemical(processType);
  }

  return (
    <div className="admin-content">
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
        Los usuarios declaran cuántos carretes revelan al reservar un puesto de película.
        El sistema acumula el uso y te avisa cuándo cambiar los químicos.
      </div>

      {KITS.map(kit => {
        const data = getKit(kit.processType);
        const used  = data?.usedCapacity ?? 0;
        const total = capacities[kit.processType] ?? data?.totalCapacity ?? kit.defaultCapacity;
        const pct   = total > 0 ? Math.min(used / total, 1) : 0;
        const color = statusColor(pct);
        const changedAt = data?.changedAt?.toDate?.();

        return (
          <div key={kit.processType} className="chem-card">
            <div className="chem-card-header">
              <div>
                <div className="chem-kit-name">{kit.name}</div>
                {changedAt && (
                  <div className="chem-changed-at">
                    Cambiado: {changedAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
              <div className="chem-status-label" style={{ color }}>{statusLabel(pct)}</div>
            </div>

            {/* Progress bar */}
            <div className="chem-bar-wrap">
              <div className="chem-bar-bg">
                <div className="chem-bar-fill" style={{ width: `${pct * 100}%`, background: color }} />
              </div>
              <div className="chem-bar-label" style={{ color }}>
                {used} / {total} carretes
              </div>
            </div>

            {/* Capacity config */}
            <div className="chem-config-row">
              <label className="config-row-label">Capacidad total del kit</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number" min="1" max="100"
                  className="config-num-input"
                  value={capacities[kit.processType] ?? data?.totalCapacity ?? kit.defaultCapacity}
                  onChange={e => setCapacities(s => ({ ...s, [kit.processType]: e.target.value }))}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>carretes</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
                onClick={() => handleSave(kit)}
                disabled={saving[kit.processType]}
              >
                {saving[kit.processType] ? <><span className="spinner sm" /> Guardando…</> : 'Guardar configuración'}
              </button>
              {data && (
                <button
                  className="btn-danger-ghost"
                  style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
                  onClick={() => handleReset(kit.processType)}
                >
                  ↺ Marcar como cambiado
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
