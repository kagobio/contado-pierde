import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { formatDateFull, todayStr } from '../../../utils';
import { db } from '../../../firebase';
import { getDocs, query, collection, where, orderBy } from 'firebase/firestore';

export default function AdminBlocksPage() {
  const resources    = useAppStore(s => s.resources);
  const schedules    = useAppStore(s => s.schedules);
  const createBlock  = useAppStore(s => s.createBlock);
  const deleteBlock  = useAppStore(s => s.deleteBlock);
  const blocks       = useAppStore(s => s.blocks);   // current week, live
  const subscribeBlocks = useAppStore(s => s.subscribeBlocks);

  // Load a wider range (next 60 days) for admin view
  const [allBlocks, setAllBlocks]   = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showForm, setShowForm]     = useState(false);

  // Form state
  const [date, setDate]             = useState(todayStr());
  const [label, setLabel]           = useState('');
  const [scope, setScope]           = useState('all');   // 'all' | 'resources' | 'slots'
  const [selResources, setSelRes]   = useState([]);
  const [selSlots, setSelSlots]     = useState([]);
  const [saving, setSaving]         = useState(false);

  // Use the live blocks from store (current week) plus fetch all future blocks
  useEffect(() => {
    loadAllBlocks();
  }, []);

  async function loadAllBlocks() {
    setLoadingAll(true);
    const today = todayStr();
    const q = query(
      collection(db, 'blocks'),
      where('date', '>=', today),
      orderBy('date', 'asc')
    );
    const snap = await getDocs(q);
    setAllBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoadingAll(false);
  }

  const allSlots = schedules[0]?.slots?.filter(s => s.active) || [];
  const resourceMap = Object.fromEntries(resources.map(r => [r.id, r.shortName || r.name]));

  function toggleRes(id) {
    setSelRes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function toggleSlot(min) {
    setSelSlots(prev => prev.includes(min) ? prev.filter(x => x !== min) : [...prev, min]);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!label.trim() || !date) return;
    setSaving(true);
    await createBlock({
      date,
      resourceIds:      scope === 'resources' ? selResources : [],
      slotStartMinutes: scope === 'slots'     ? selSlots     : [],
      label,
    });
    setSaving(false);
    setShowForm(false);
    setLabel('');
    setSelRes([]);
    setSelSlots([]);
    setScope('all');
    loadAllBlocks();
  }

  async function handleDelete(blockId) {
    await deleteBlock(blockId);
    setAllBlocks(prev => prev.filter(b => b.id !== blockId));
  }

  function blockScopeLabel(b) {
    if (b.resourceIds.length === 0 && b.slotStartMinutes.length === 0) return 'Todos los recursos · Todas las franjas';
    const res = b.resourceIds.length > 0
      ? b.resourceIds.map(id => resourceMap[id] || id).join(', ')
      : 'Todos los recursos';
    const slots = b.slotStartMinutes.length > 0
      ? b.slotStartMinutes.map(m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`).join(', ')
      : 'Todas las franjas';
    return `${res} · ${slots}`;
  }

  return (
    <div className="admin-content">
      {!showForm && (
        <button className="admin-add-btn" style={{ marginBottom: 16 }} onClick={() => setShowForm(true)}>
          + Añadir bloqueo
        </button>
      )}

      {showForm && (
        <form className="block-form" onSubmit={handleCreate}>
          <div className="block-form-title">Nuevo bloqueo</div>

          <div className="form-field">
            <label className="form-label">Etiqueta del evento</label>
            <input className="form-input" placeholder="Ej: Taller revelado ByN" value={label}
              onChange={e => setLabel(e.target.value)} autoFocus maxLength={40} />
          </div>

          <div className="form-field">
            <label className="form-label">Fecha</label>
            <input type="date" className="form-input" value={date} min={todayStr()}
              onChange={e => setDate(e.target.value)} />
          </div>

          <div className="form-field">
            <label className="form-label">Alcance</label>
            <div className="scope-pills">
              {[['all','Todos los recursos'], ['resources','Recursos concretos'], ['slots','Franjas concretas']].map(([v, l]) => (
                <button type="button" key={v} className={`cat-pill ${scope === v ? 'active' : ''}`}
                  onClick={() => setScope(v)}>{l}</button>
              ))}
            </div>
          </div>

          {scope === 'resources' && (
            <div className="form-field">
              <label className="form-label">Recursos a bloquear</label>
              <div className="block-select-grid">
                {resources.filter(r => r.active).map(r => (
                  <button type="button" key={r.id}
                    className={`block-select-item ${selResources.includes(r.id) ? 'active' : ''}`}
                    onClick={() => toggleRes(r.id)}>
                    {r.shortName || r.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scope === 'slots' && (
            <div className="form-field">
              <label className="form-label">Franjas a bloquear</label>
              <div className="block-select-grid">
                {allSlots.map(s => (
                  <button type="button" key={s.startMinute}
                    className={`block-select-item ${selSlots.includes(s.startMinute) ? 'active' : ''}`}
                    onClick={() => toggleSlot(s.startMinute)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn-primary" type="submit" disabled={saving || !label.trim()} style={{ flex: 1 }}>
              {saving ? <><span className="spinner sm" /> Creando…</> : 'Crear bloqueo'}
            </button>
            <button type="button" className="btn-ghost" style={{ flex: 1 }}
              onClick={() => { setShowForm(false); setLabel(''); setSelRes([]); setSelSlots([]); }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
        {allBlocks.length} bloqueo{allBlocks.length !== 1 ? 's' : ''} próximos
      </div>

      {loadingAll && <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {allBlocks.map(b => (
        <div key={b.id} className="block-row">
          <div className="block-row-icon">🔒</div>
          <div className="block-row-body">
            <div className="block-row-label">{b.label}</div>
            <div className="block-row-date">{formatDateFull(b.date)}</div>
            <div className="block-row-scope">{blockScopeLabel(b)}</div>
          </div>
          <button className="user-action-btn danger" onClick={() => handleDelete(b.id)}>
            ✕ Eliminar
          </button>
        </div>
      ))}

      {!loadingAll && allBlocks.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔓</div>
          <div className="empty-state-text">Sin bloqueos programados</div>
        </div>
      )}
    </div>
  );
}
