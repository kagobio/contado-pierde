import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';

const DEFAULT_TARIFA = { name: '', maxBookingsPerUserPerDay: 2, maxAdvanceDays: 7, maxHoursPerUserPerWeek: 0 };

function TarifaForm({ label, value, onChange }) {
  return (
    <div className="config-section">
      <div className="config-section-title">{label}</div>
      <div className="config-row-stack">
        <div className="config-input-row">
          <label className="config-row-label">Nombre visible</label>
          <input
            className="config-name-input"
            placeholder="Ej: Socio, Externo…"
            value={value.name}
            onChange={e => onChange({ ...value, name: e.target.value })}
            maxLength={30}
          />
        </div>
        <div className="config-input-row">
          <label className="config-row-label">Reservas por día</label>
          <input type="number" min="1" max="20" className="config-num-input"
            value={value.maxBookingsPerUserPerDay}
            onChange={e => onChange({ ...value, maxBookingsPerUserPerDay: e.target.value })} />
        </div>
        <div className="config-input-row">
          <label className="config-row-label">Días de antelación</label>
          <input type="number" min="1" max="90" className="config-num-input"
            value={value.maxAdvanceDays}
            onChange={e => onChange({ ...value, maxAdvanceDays: e.target.value })} />
        </div>
        <div className="config-input-row">
          <label className="config-row-label">Horas por semana <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(0 = sin límite)</span></label>
          <input type="number" min="0" max="168" className="config-num-input"
            value={value.maxHoursPerUserPerWeek}
            onChange={e => onChange({ ...value, maxHoursPerUserPerWeek: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

export default function AdminConfigPage() {
  const appConfig       = useAppStore(s => s.appConfig);
  const adminSaveConfig = useAppStore(s => s.adminSaveConfig);

  const [maintenance,  setMaintenance]  = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [cancelHours,  setCancelHours]  = useState(2);
  const [tarifa1, setTarifa1] = useState({ ...DEFAULT_TARIFA, name: 'Tarifa 1' });
  const [tarifa2, setTarifa2] = useState({ ...DEFAULT_TARIFA, name: 'Tarifa 2', maxBookingsPerUserPerDay: 3, maxAdvanceDays: 14, maxHoursPerUserPerWeek: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appConfig) {
      setMaintenance(appConfig.maintenanceMode ?? false);
      setAnnouncement(appConfig.announcementText ?? '');
      setCancelHours(appConfig.cancellationDeadlineHours ?? 2);
      if (appConfig.tarifas?.tarifa1) setTarifa1(appConfig.tarifas.tarifa1);
      if (appConfig.tarifas?.tarifa2) setTarifa2(appConfig.tarifas.tarifa2);
    }
  }, [appConfig]);

  function toNum(t) {
    return {
      name: t.name,
      maxBookingsPerUserPerDay: Number(t.maxBookingsPerUserPerDay),
      maxAdvanceDays:           Number(t.maxAdvanceDays),
      maxHoursPerUserPerWeek:   Number(t.maxHoursPerUserPerWeek),
    };
  }

  async function handleSave() {
    setSaving(true);
    await adminSaveConfig({
      maintenanceMode:           maintenance,
      announcementText:          announcement.trim() || null,
      cancellationDeadlineHours: Number(cancelHours),
      tarifas: {
        tarifa1: toNum(tarifa1),
        tarifa2: toNum(tarifa2),
      },
    });
    setSaving(false);
  }

  if (!appConfig) {
    return (
      <div className="admin-content">
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
          Sin configuración. Usa el botón "Cargar datos iniciales" en Recursos.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content">

      {/* Maintenance toggle */}
      <div className="config-section">
        <div className="config-section-title">Estado del laboratorio</div>
        <div className="config-row" onClick={() => setMaintenance(v => !v)}>
          <div>
            <div className="config-row-label">Modo mantenimiento</div>
            <div className="config-row-hint">Bloquea todas las nuevas reservas</div>
          </div>
          <div className={`big-toggle ${maintenance ? 'on' : ''}`} />
        </div>
      </div>

      {/* Announcement */}
      <div className="config-section">
        <div className="config-section-title">Anuncio global</div>
        <div className="config-row-stack">
          <div className="config-row-hint">Se muestra en la pantalla de horario para todos los usuarios</div>
          <textarea
            className="form-input"
            style={{ minHeight: 72, resize: 'vertical', marginTop: 8 }}
            placeholder="Ej: Cerrado el lunes por festivo…  (vacío = sin anuncio)"
            value={announcement}
            onChange={e => setAnnouncement(e.target.value)}
            maxLength={200}
          />
          {announcement && (
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right', marginTop: 2 }}>
              {announcement.length}/200
            </div>
          )}
        </div>
      </div>

      {/* Cancel deadline — global */}
      <div className="config-section">
        <div className="config-section-title">Cancelaciones</div>
        <div className="config-row-stack">
          <div className="config-input-row">
            <label className="config-row-label">Horas límite para cancelar</label>
            <input type="number" min="0" max="48" className="config-num-input"
              value={cancelHours} onChange={e => setCancelHours(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tarifa 1 */}
      <TarifaForm label="Tarifa 1 — Límites" value={tarifa1} onChange={setTarifa1} />

      {/* Tarifa 2 */}
      <TarifaForm label="Tarifa 2 — Límites" value={tarifa2} onChange={setTarifa2} />

      <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
        {saving ? <><span className="spinner sm" /> Guardando…</> : 'Guardar configuración'}
      </button>
    </div>
  );
}
