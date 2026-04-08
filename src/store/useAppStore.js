import { create } from 'zustand';
import { db, auth } from '../firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'firebase/auth';
import { todayStr, getWeekStart, getWeekDates, addWeeks, bookingDocId } from '../utils';
import { INITIAL_RESOURCES, INITIAL_SCHEDULES } from '../constants';

// ── Module-level listener refs ─────────────────────────────────────────────
let _unsubResources   = null;
let _unsubSchedules   = null;
let _unsubBookings    = null;
let _unsubMyBookings  = null;
let _unsubConfig      = null;

function unsub(ref) { if (ref) { ref(); } }

// ── Store ──────────────────────────────────────────────────────────────────
export const useAppStore = create((set, get) => ({

  // ── Auth ──────────────────────────────────────────────────────────────
  authUser:    null,
  userDoc:     null,
  authLoading: true,

  // ── Screen / nav ──────────────────────────────────────────────────────
  screen:       'loading',   // 'loading' | 'login' | 'app'
  currentPage:  'schedule',  // 'schedule' | 'mybookings' | 'admin'
  adminPage:    'resources', // 'resources' | 'schedules' | 'bookings' | 'users'

  // ── Schedule view ─────────────────────────────────────────────────────
  selectedDate:     todayStr(),
  weekStart:        getWeekStart(todayStr()),
  weekDates:        getWeekDates(getWeekStart(todayStr())),
  selectedCategory: 'all',

  // ── Data ──────────────────────────────────────────────────────────────
  resources:   [],
  schedules:   [],
  bookings:    [],   // for current week window
  myBookings:  [],   // current user's all bookings
  appConfig:   null,

  // ── Booking flow ──────────────────────────────────────────────────────
  bookingModal:      false,
  selectedSlot:      null,  // { resourceId, date, startMinute, slotLabel }
  bookingMode:       'book', // 'book' | 'view'
  selectedDuration:  null,  // chosen durationMin
  bookingNotes:      '',
  bookingLoading:    false,
  bookingSuccess:    false,

  // ── Admin ─────────────────────────────────────────────────────────────
  adminBookings:       [],
  adminUsers:          [],
  adminBookingsFilter: { dateFrom: '', dateTo: '', resourceId: '', status: 'all' },
  resourceFormModal:   false,
  editingResource:     null,
  slotFormModal:       false,
  editingSlot:         null,
  editingScheduleId:   null,
  adminLoading:        false,

  // ── UI ─────────────────────────────────────────────────────────────────
  syncState:    '',   // '' | 'syncing' | 'ok' | 'error'
  toastMsg:     '',
  toastType:    '',   // '' | 'success' | 'error'
  toastVisible: false,

  // ════════════════════════════════════════════════════════════════════════
  // AUTH
  // ════════════════════════════════════════════════════════════════════════

  initAuth() {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Clean up all listeners
        unsub(_unsubResources); unsub(_unsubSchedules);
        unsub(_unsubBookings); unsub(_unsubMyBookings); unsub(_unsubConfig);
        set({ authUser: null, userDoc: null, screen: 'login', authLoading: false });
        return;
      }

      set({ authUser: user, authLoading: true });

      // Load or create user doc
      const userRef = doc(db, 'users', user.uid);
      let snap = await getDoc(userRef);
      if (!snap.exists()) {
        const newUser = {
          displayName: user.displayName || user.email.split('@')[0],
          email: user.email,
          role: 'member',
          color: '#ff6b35',
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, newUser);
        snap = await getDoc(userRef);
      }

      const userDoc = { id: user.uid, ...snap.data() };
      set({ userDoc, authLoading: false, screen: 'app' });

      // Start all real-time listeners
      get().subscribeResources();
      get().subscribeSchedules();
      get().subscribeConfig();
      get().subscribeBookingsForWeek(get().weekStart);
      get().subscribeMyBookings();
    });
  },

  async login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  },

  async logout() {
    unsub(_unsubResources); unsub(_unsubSchedules);
    unsub(_unsubBookings); unsub(_unsubMyBookings); unsub(_unsubConfig);
    await signOut(auth);
    set({
      screen: 'login', authUser: null, userDoc: null,
      resources: [], schedules: [], bookings: [], myBookings: [], appConfig: null,
    });
  },

  // ════════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ════════════════════════════════════════════════════════════════════════

  setCurrentPage(page) { set({ currentPage: page }); },
  setAdminPage(page)   { set({ adminPage: page }); },
  setSelectedCategory(cat) { set({ selectedCategory: cat }); },

  setSelectedDate(dateStr) {
    const newWeekStart = getWeekStart(dateStr);
    const { weekStart } = get();
    set({ selectedDate: dateStr, weekStart: newWeekStart, weekDates: getWeekDates(newWeekStart) });
    if (newWeekStart !== weekStart) {
      get().subscribeBookingsForWeek(newWeekStart);
    }
  },

  goNextWeek() {
    const { weekStart } = get();
    const next = addWeeks(weekStart, 1);
    set({ weekStart: next, weekDates: getWeekDates(next), selectedDate: next });
    get().subscribeBookingsForWeek(next);
  },

  goPrevWeek() {
    const { weekStart } = get();
    const prev = addWeeks(weekStart, -1);
    set({ weekStart: prev, weekDates: getWeekDates(prev), selectedDate: prev });
    get().subscribeBookingsForWeek(prev);
  },

  // ════════════════════════════════════════════════════════════════════════
  // REAL-TIME LISTENERS
  // ════════════════════════════════════════════════════════════════════════

  subscribeResources() {
    unsub(_unsubResources);
    const q = query(collection(db, 'resources'), orderBy('order'));
    _unsubResources = onSnapshot(q, snap => {
      const resources = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      set({ resources });
    }, () => get().showToast('Error al cargar recursos', 'error'));
  },

  subscribeSchedules() {
    unsub(_unsubSchedules);
    _unsubSchedules = onSnapshot(collection(db, 'schedules'), snap => {
      const schedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      set({ schedules });
    });
  },

  subscribeConfig() {
    unsub(_unsubConfig);
    _unsubConfig = onSnapshot(doc(db, 'config', 'app'), snap => {
      if (snap.exists()) set({ appConfig: snap.data() });
    });
  },

  subscribeBookingsForWeek(weekStartStr) {
    unsub(_unsubBookings);
    const weekEnd = getWeekDates(weekStartStr)[6];
    const q = query(
      collection(db, 'bookings'),
      where('date', '>=', weekStartStr),
      where('date', '<=', weekEnd)
    );
    _unsubBookings = onSnapshot(q, snap => {
      const bookings = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(b => b.status !== 'cancelled');
      set({ bookings });
    }, err => {
      console.error('subscribeBookingsForWeek error:', err);
      get().showToast('Error al cargar reservas', 'error');
    });
  },

  subscribeMyBookings() {
    unsub(_unsubMyBookings);
    const { authUser } = get();
    if (!authUser) return;
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', authUser.uid)
    );
    _unsubMyBookings = onSnapshot(q, snap => {
      const today = todayStr();
      const myBookings = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(b => b.date >= today && b.status !== 'cancelled')
        .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.startMinute - b.startMinute);
      set({ myBookings });
    }, err => {
      console.error('subscribeMyBookings error:', err);
      get().showToast('Error al cargar tus reservas', 'error');
    });
  },

  // ════════════════════════════════════════════════════════════════════════
  // BOOKING FLOW
  // ════════════════════════════════════════════════════════════════════════

  openBookingModal(slotInfo) {
    // slotInfo: { resourceId, date, startMinute, slotLabel, status }
    const mode = slotInfo.status === 'mine' ? 'view' : 'book';
    set({ bookingModal: true, selectedSlot: slotInfo, bookingMode: mode, bookingNotes: '', bookingSuccess: false, selectedDuration: null });
  },

  closeBookingModal() {
    set({ bookingModal: false, selectedSlot: null, bookingLoading: false, bookingSuccess: false, selectedDuration: null });
  },

  setBookingNotes(text) { set({ bookingNotes: text }); },
  setSelectedDuration(d) { set({ selectedDuration: d }); },

  async confirmBooking() {
    const { selectedSlot, selectedDuration, bookingNotes, authUser, userDoc } = get();
    if (!selectedSlot || !authUser || !selectedDuration) return;

    set({ bookingLoading: true, syncState: 'syncing' });
    try {
      const { resourceId, date, startMinute } = selectedSlot;
      const docId  = bookingDocId(resourceId, date, startMinute);
      const docRef = doc(db, 'bookings', docId);

      // Conflict check
      const existing = await getDoc(docRef);
      if (existing.exists() && existing.data().status !== 'cancelled') {
        get().showToast('Esta franja ya ha sido reservada', 'error');
        set({ bookingLoading: false, syncState: '' });
        return;
      }

      await setDoc(docRef, {
        resourceId,
        date,
        startMinute,
        durationMin: selectedDuration,
        userId:   authUser.uid,
        userName: userDoc?.displayName || authUser.email,
        status:   'confirmed',
        notes:    bookingNotes.trim() || null,
        createdAt: serverTimestamp(),
        notified: false,
      });

      set({ bookingLoading: false, bookingSuccess: true, syncState: 'ok' });
      setTimeout(() => get().closeBookingModal(), 3000);
    } catch (err) {
      console.error(err);
      get().showToast('Error al guardar la reserva', 'error');
      set({ bookingLoading: false, syncState: 'error' });
    }
  },

  async cancelBooking(bookingId) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    set({ syncState: 'syncing' });
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
      get().showToast('Reserva cancelada', 'success');
      set({ syncState: 'ok' });
    } catch (err) {
      get().showToast('Error al cancelar', 'error');
      set({ syncState: 'error' });
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN — RESOURCES
  // ════════════════════════════════════════════════════════════════════════

  openResourceForm(resource = null) {
    set({ resourceFormModal: true, editingResource: resource });
  },
  closeResourceForm() {
    set({ resourceFormModal: false, editingResource: null });
  },

  async saveResource(data) {
    set({ syncState: 'syncing' });
    try {
      const { editingResource, resources } = get();
      if (editingResource) {
        await updateDoc(doc(db, 'resources', editingResource.id), data);
      } else {
        const maxOrder = resources.reduce((m, r) => Math.max(m, r.order || 0), 0);
        await setDoc(doc(collection(db, 'resources')), { ...data, order: maxOrder + 1, active: true });
      }
      get().closeResourceForm();
      get().showToast(editingResource ? 'Recurso actualizado' : 'Recurso creado', 'success');
      set({ syncState: 'ok' });
    } catch (err) {
      get().showToast('Error al guardar', 'error');
      set({ syncState: 'error' });
    }
  },

  async toggleResourceActive(resourceId, current) {
    await updateDoc(doc(db, 'resources', resourceId), { active: !current });
  },

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN — SCHEDULES
  // ════════════════════════════════════════════════════════════════════════

  openSlotForm(scheduleId, slot = null) {
    set({ slotFormModal: true, editingSlot: slot, editingScheduleId: scheduleId });
  },
  closeSlotForm() {
    set({ slotFormModal: false, editingSlot: null, editingScheduleId: null });
  },

  async saveSlot(slotData) {
    const { editingScheduleId, editingSlot, schedules } = get();
    const schedule = schedules.find(s => s.id === editingScheduleId);
    if (!schedule) return;

    let newSlots;
    if (editingSlot) {
      newSlots = schedule.slots.map(s => s.id === editingSlot.id ? { ...s, ...slotData } : s);
    } else {
      const newSlot = { id: `slot_${Date.now()}`, active: true, ...slotData };
      newSlots = [...(schedule.slots || []), newSlot].sort((a, b) => a.startMinute - b.startMinute);
    }

    await updateDoc(doc(db, 'schedules', editingScheduleId), { slots: newSlots });
    get().closeSlotForm();
    get().showToast('Franja guardada', 'success');
  },

  async deleteSlot(scheduleId, slotId) {
    if (!confirm('¿Eliminar esta franja?')) return;
    const { schedules } = get();
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    const newSlots = schedule.slots.filter(s => s.id !== slotId);
    await updateDoc(doc(db, 'schedules', scheduleId), { slots: newSlots });
    get().showToast('Franja eliminada');
  },

  async toggleSlotActive(scheduleId, slotId, current) {
    const { schedules } = get();
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    const newSlots = schedule.slots.map(s => s.id === slotId ? { ...s, active: !current } : s);
    await updateDoc(doc(db, 'schedules', scheduleId), { slots: newSlots });
  },

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN — BOOKINGS
  // ════════════════════════════════════════════════════════════════════════

  setAdminBookingsFilter(filter) {
    set({ adminBookingsFilter: { ...get().adminBookingsFilter, ...filter } });
  },

  async loadAdminBookings() {
    const { adminBookingsFilter } = get();
    set({ adminLoading: true });
    try {
      let q = collection(db, 'bookings');
      const constraints = [];
      if (adminBookingsFilter.dateFrom) constraints.push(where('date', '>=', adminBookingsFilter.dateFrom));
      if (adminBookingsFilter.dateTo)   constraints.push(where('date', '<=', adminBookingsFilter.dateTo));
      if (adminBookingsFilter.resourceId) constraints.push(where('resourceId', '==', adminBookingsFilter.resourceId));
      if (adminBookingsFilter.status !== 'all') constraints.push(where('status', '==', adminBookingsFilter.status));
      constraints.push(orderBy('date', 'desc'));

      const snap = await getDocs(query(q, ...constraints));
      const adminBookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      set({ adminBookings, adminLoading: false });
    } catch {
      get().showToast('Error al cargar reservas', 'error');
      set({ adminLoading: false });
    }
  },

  async adminCancelBooking(bookingId) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
    get().showToast('Reserva cancelada', 'success');
    get().loadAdminBookings();
  },

  exportBookingsCSV() {
    const { adminBookings, resources } = get();
    const resourceMap = Object.fromEntries(resources.map(r => [r.id, r.name]));
    const rows = [
      ['Fecha', 'Recurso', 'Franja', 'Usuario', 'Estado', 'Notas', 'Creado'],
      ...adminBookings.map(b => [
        b.date, resourceMap[b.resourceId] || b.resourceId,
        b.slotId, b.userName, b.status, b.notes || '',
        b.createdAt?.toDate?.().toLocaleString('es') || '',
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `reservas_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  },

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN — USERS
  // ════════════════════════════════════════════════════════════════════════

  async loadAdminUsers() {
    set({ adminLoading: true });
    try {
      const snap = await getDocs(collection(db, 'users'));
      const adminUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      set({ adminUsers, adminLoading: false });
    } catch {
      get().showToast('Error al cargar usuarios', 'error');
      set({ adminLoading: false });
    }
  },

  async setUserRole(uid, role) {
    await updateDoc(doc(db, 'users', uid), { role });
    get().showToast(`Rol actualizado a ${role}`, 'success');
    get().loadAdminUsers();
  },

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN — SEED
  // ════════════════════════════════════════════════════════════════════════

  async seedInitialData() {
    if (!confirm('¿Cargar los recursos y horarios iniciales? Esto añadirá los 19 recursos y 2 horarios del laboratorio. No sobreescribirá datos existentes.')) return;
    set({ syncState: 'syncing' });
    try {
      const batch = writeBatch(db);

      for (const r of INITIAL_RESOURCES) {
        batch.set(doc(db, 'resources', r.id), {
          name: r.name, shortName: r.shortName, category: r.category,
          icon: r.icon, order: r.order, active: true,
          scheduleId: 'horario_comunitario', description: null,
        }, { merge: true });
      }

      for (const s of INITIAL_SCHEDULES) {
        batch.set(doc(db, 'schedules', s.id), { name: s.name, slots: s.slots }, { merge: true });
      }

      batch.set(doc(db, 'config', 'app'), {
        maxBookingsPerUserPerDay:  3,
        maxAdvanceDays:            14,
        cancellationDeadlineHours: 2,
        maintenanceMode:           false,
        labName:                   'Contado Pierde',
        announcementText:          null,
      }, { merge: true });

      await batch.commit();
      get().showToast('Datos iniciales cargados ✓', 'success');
      set({ syncState: 'ok' });
    } catch (err) {
      console.error(err);
      get().showToast('Error al cargar datos', 'error');
      set({ syncState: 'error' });
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ════════════════════════════════════════════════════════════════════════

  showToast(msg, type = '') {
    set({ toastMsg: msg, toastType: type, toastVisible: true });
    setTimeout(() => set({ toastVisible: false }), 2500);
  },

  setSyncState(s) { set({ syncState: s }); },

}));
