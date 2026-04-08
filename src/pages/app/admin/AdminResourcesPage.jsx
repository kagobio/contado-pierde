import { useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { CATEGORY_LABELS, ICON_KEYS } from '../../../constants';
import ResourceIcon from '../../../components/shared/ResourceIcon';

export default function AdminResourcesPage() {
  const resources         = useAppStore(s => s.resources);
  const schedules         = useAppStore(s => s.schedules);
  const openResourceForm  = useAppStore(s => s.openResourceForm);
  const toggleActive      = useAppStore(s => s.toggleResourceActive);
  const seedInitialData   = useAppStore(s => s.seedInitialData);
  const resourceFormModal = useAppStore(s => s.resourceFormModal);
  const editingResource   = useAppStore(s => s.editingResource);
  const closeResourceForm = useAppStore(s => s.closeResourceForm);
  const saveResource      = useAppStore(s => s.saveResource);

  return (
    <div className="admin-content">
      {resources.length === 0 && (
        <button className="seed-btn" onClick={seedInitialData}>
          🌱 Cargar datos iniciales (19 recursos + horarios)
        </button>
      )}

      <div className="admin-list">
        {resources.map(r => (
          <div key={r.id} className={`admin-resource-row ${r.active ? '' : 'inactive'}`}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)', flexShrink: 0 }}>
              <ResourceIcon icon={r.icon} size={16} />
            </div>
            <div className="admin-resource-info">
              <div className="admin-resource-name">{r.name}</div>
              <div className="admin-resource-cat">{CATEGORY_LABELS[r.category] || r.category}</div>
            </div>
            <div className="admin-row-actions">
              <button
                className={`toggle-btn ${r.active ? 'on' : ''}`}
                onClick={() => toggleActive(r.id, r.active)}
                title={r.active ? 'Desactivar' : 'Activar'}
              />
              <button className="icon-btn" onClick={() => openResourceForm(r)} title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="admin-add-btn" onClick={() => openResourceForm(null)}>
        + Añadir recurso
      </button>

      {resourceFormModal && (
        <ResourceFormModal
          resource={editingResource}
          schedules={schedules}
          onClose={closeResourceForm}
          onSave={saveResource}
        />
      )}
    </div>
  );
}

function ResourceFormModal({ resource, schedules, onClose, onSave }) {
  const [name, setName]       = useState(resource?.name || '');
  const [shortName, setShort] = useState(resource?.shortName || '');
  const [category, setCat]    = useState(resource?.category || 'enlarger_cabin');
  const [icon, setIcon]       = useState(resource?.icon || 'enlarger');
  const [scheduleId, setSched]= useState(resource?.scheduleId || schedules[0]?.id || '');
  const [desc, setDesc]       = useState(resource?.description || '');

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), shortName: shortName.trim() || name.trim(), category, icon, scheduleId, description: desc.trim() || null });
  }

  return (
    <div className="form-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="form-modal-sheet">
        <div className="modal-handle" style={{ margin: '8px auto 0' }} />
        <div className="form-modal-title" style={{ paddingTop: 16 }}>
          {resource ? 'Editar recurso' : 'Nuevo recurso'}
        </div>
        <div className="form-body">
          <div className="form-field">
            <label className="form-label">Nombre completo</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="CABINA 1: ByN (Durst M805)" />
          </div>
          <div className="form-field">
            <label className="form-label">Nombre corto</label>
            <input className="form-input" value={shortName} onChange={e => setShort(e.target.value)} placeholder="Cab. 1 ByN" />
          </div>
          <div className="form-field">
            <label className="form-label">Categoría</label>
            <select className="form-select" value={category} onChange={e => setCat(e.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Icono</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ICON_KEYS.map(key => (
                <button
                  key={key}
                  style={{
                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: icon === key ? 'var(--accent-dim)' : 'var(--bg3)',
                    border: `1px solid ${icon === key ? 'var(--accent)' : 'var(--border)'}`,
                    color: icon === key ? 'var(--accent)' : 'var(--muted)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIcon(key)}
                >
                  <ResourceIcon icon={key} size={18} />
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Horario</label>
            <select className="form-select" value={scheduleId} onChange={e => setSched(e.target.value)}>
              {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Descripción (opcional)</label>
            <input className="form-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Notas para los usuarios…" />
          </div>
        </div>
        <div className="form-footer">
          <button className="btn-primary" onClick={handleSave} disabled={!name.trim()}>Guardar</button>
          <button className="btn-ghost" onClick={onClose}>cancelar</button>
        </div>
      </div>
    </div>
  );
}
