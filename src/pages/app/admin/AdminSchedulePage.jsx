import { useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { minutesToTime } from '../../../utils';

export default function AdminSchedulePage() {
  const schedules        = useAppStore(s => s.schedules);
  const openSlotForm     = useAppStore(s => s.openSlotForm);
  const deleteSlot       = useAppStore(s => s.deleteSlot);
  const toggleSlotActive = useAppStore(s => s.toggleSlotActive);
  const slotFormModal    = useAppStore(s => s.slotFormModal);
  const editingSlot      = useAppStore(s => s.editingSlot);
  const editingScheduleId = useAppStore(s => s.editingScheduleId);
  const closeSlotForm    = useAppStore(s => s.closeSlotForm);
  const saveSlot         = useAppStore(s => s.saveSlot);

  const [selectedScheduleId, setSelectedScheduleId] = useState(schedules[0]?.id || '');
  const schedule = schedules.find(s => s.id === selectedScheduleId);

  return (
    <div className="admin-content">
      {schedules.length > 1 && (
        <div className="filter-bar" style={{ marginBottom: 16 }}>
          {schedules.map(s => (
            <button
              key={s.id}
              className={`cat-pill ${selectedScheduleId === s.id ? 'active' : ''}`}
              onClick={() => setSelectedScheduleId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {schedule && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
            Franjas horarias — {schedule.name}
          </div>

          {(schedule.slots || []).map(slot => (
            <div key={slot.id} className="slot-editor-row">
              <div className="slot-time-badge">{slot.label}</div>
              <div className="slot-duration">
                {minutesToTime(slot.startMinute)} → {minutesToTime(slot.startMinute + slot.durationMin)}
                <span style={{ color: 'var(--muted)', marginLeft: 6 }}>({slot.durationMin}min)</span>
              </div>
              <div className="admin-row-actions">
                <button
                  className={`toggle-btn ${slot.active ? 'on' : ''}`}
                  onClick={() => toggleSlotActive(schedule.id, slot.id, slot.active)}
                  title={slot.active ? 'Desactivar' : 'Activar'}
                />
                <button className="icon-btn" onClick={() => openSlotForm(schedule.id, slot)} title="Editar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button className="icon-btn" onClick={() => deleteSlot(schedule.id, slot.id)} title="Eliminar" style={{ '--hover': 'var(--danger)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          ))}

          <button className="admin-add-btn" onClick={() => openSlotForm(schedule.id, null)}>
            + Añadir franja horaria
          </button>
        </>
      )}

      {slotFormModal && (
        <SlotFormModal
          slot={editingSlot}
          onClose={closeSlotForm}
          onSave={saveSlot}
        />
      )}
    </div>
  );
}

function SlotFormModal({ slot, onClose, onSave }) {
  const [label, setLabel]       = useState(slot?.label || '');
  const [startH, setStartH]     = useState(slot ? Math.floor(slot.startMinute / 60) : 11);
  const [startM, setStartM]     = useState(slot ? slot.startMinute % 60 : 0);
  const [duration, setDuration] = useState(slot?.durationMin || 60);

  function handleSave() {
    const startMinute = startH * 60 + startM;
    const computedLabel = label.trim() || `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`;
    onSave({ label: computedLabel, startMinute, durationMin: Number(duration) });
  }

  const hours   = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  return (
    <div className="form-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="form-modal-sheet">
        <div className="modal-handle" style={{ margin: '8px auto 0' }} />
        <div className="form-modal-title" style={{ paddingTop: 16 }}>
          {slot ? 'Editar franja' : 'Nueva franja'}
        </div>
        <div className="form-body">
          <div className="form-field">
            <label className="form-label">Etiqueta (ej: "11:00")</label>
            <input className="form-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Auto-generada si vacío" />
          </div>
          <div className="form-field">
            <label className="form-label">Hora de inicio</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-select" style={{ flex: 1 }} value={startH} onChange={e => setStartH(Number(e.target.value))}>
                {hours.map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}h</option>)}
              </select>
              <select className="form-select" style={{ flex: 1 }} value={startM} onChange={e => setStartM(Number(e.target.value))}>
                {minutes.map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}min</option>)}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Duración (minutos)</label>
            <select className="form-select" value={duration} onChange={e => setDuration(e.target.value)}>
              {[30,45,60,90,120,150,180].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
        </div>
        <div className="form-footer">
          <button className="btn-primary" onClick={handleSave}>Guardar</button>
          <button className="btn-ghost" onClick={onClose}>cancelar</button>
        </div>
      </div>
    </div>
  );
}
