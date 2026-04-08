import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';

export default function AdminConfigPage() {
  const appConfig     = useAppStore(s => s.appConfig);
  const adminSaveConfig = useAppStore(s => s.adminSaveConfig);

  const [maintenance,  setMaintenance]  = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [maxPerDay,    setMaxPerDay]    = useState(3);
  const [maxAdvance,   setMaxAdvance]   = useState(14);
  const [cancelHours,  setCancelHours]  = useState(2);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appConfig) {
      setMaintenance(appConfig.maintenanceMode ?? false);
      setAnnouncement(appConfig.announcementText ?? '');
      setMaxPerDay(appConfig.maxBookingsPerUserPerDay ?? 3);
      setMaxAdvance(appConfig.maxAdvanceDays ?? 14);
      setCancelHours(appConfig.cancellationDeadlineHours ?? 2);
    }
  }, [appConfig]);

  async function handleSave() {
    setSaving(true);
    await adminSaveConfig({
      maintenanceMode:           maintenance,
      announcementText:          announcement.trim() || null,
      maxBookingsPerUserPerDay:  Number(maxPerDay),
      maxAdvanceDays:            Number(maxAdvance),
      cancellationDeadlineHours: Number(cancelHours),
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

      {/* Limits */}
      <div className="config-section">
        <div className="config-section-title">Límites de reserva</div>
        <div className="config-row-stack">
          <div className="config-input-row">
            <label className="config-row-label">Máximo de reservas por usuario / día</label>
            <input
              type="number" min="1" max="20"
              className="config-num-input"
              value={maxPerDay}
              onChange={e => setMaxPerDay(e.target.value)}
            />
          </div>
          <div className="config-input-row">
            <label className="config-row-label">Máximo de días con antelación</label>
            <input
              type="number" min="1" max="90"
              className="config-num-input"
              value={maxAdvance}
              onChange={e => setMaxAdvance(e.target.value)}
            />
          </div>
          <div className="config-input-row">
            <label className="config-row-label">Horas límite para cancelar</label>
            <input
              type="number" min="0" max="48"
              className="config-num-input"
              value={cancelHours}
              onChange={e => setCancelHours(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
        {saving ? <><span className="spinner sm" /> Guardando…</> : 'Guardar configuración'}
      </button>
    </div>
  );
}
