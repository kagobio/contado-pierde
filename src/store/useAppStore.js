import { create } from 'zustand';
import { db, auth, secondaryAuth } from '../firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, updatePassword, signOut as fbSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { todayStr, getWeekStart, getWeekDates, addWeeks, bookingDocId } from '../utils';
import { INITIAL_RESOURCES, INITIAL_SCHEDULES } from '../constants';

// ── Module-level listener refs ─────────────────────────────────────────────
let _unsubResources   = null;
let _unsubSchedules   = null;
let _unsubBookings    = null;
let _unsubMyBookings  = null;
let _unsubConfig      = null;
let _unsubBlocks      = null;

function unsub(ref) { if (ref) { ref(); } }

// ── Helpers ────────────────────────────────────────────────────────────────
function compressImageToBase64(file, size = 160, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const scale = Math.min(size / img.width, size / img.height, 1);
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

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
  blocks:      [],   // lab event blocks for current week
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

  // ── Profile ───────────────────────────────────────────────────────────
  profileModal: false,

  // ── Cancel confirmation sheet ─────────────────────────────────────────
  cancelConfirmId:   null,  // bookingId pending cancel confirmation

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
        unsub(_unsubBookings); unsub(_unsubMyBookings); unsub(_unsubConfig); unsub(_unsubBlocks);
        set({ authUser: null, userDoc: null, screen: 'login', authLoading: false });
        return;
      }

      set({ authUser: user, authLoading: true });

      // Load user doc — must exist (created by admin via adminCreateUser)
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await signOut(auth);
        set({ authUser: null, userDoc: null, screen: 'login', authLoading: false });
        get().showToast('Cuenta no encontrada. Contacta con el administrador.', 'error');
        return;
      }

      const userDoc = { id: user.uid, ...snap.data() };

      if (userDoc.disabled) {
        await signOut(auth);
        set({ authUser: null, userDoc: null, screen: 'login', authLoading: false });
        get().showToast('Cuenta desactivada. Contacta con el administrador.', 'error');
        return;
      }

      const screen = userDoc.mustChangePassword ? 'changepassword' : 'app';
      set({ userDoc, authLoading: false, screen });

      // Start all real-time listeners
      get().subscribeResources();
      get().subscribeSchedules();
      get().subscribeConfig();
      get().subscribeBookingsForWeek(get().weekStart);
      get().subscribeMyBookings();
      get().subscribeBlocks(get().weekStart);
    });
  },

  async login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  },

  async changePassword(newPassword) {
    const { authUser, userDoc } = get();
    if (!authUser) return;
    set({ authLoading: true });
    try {
      await updatePassword(authUser, newPassword);
      await updateDoc(doc(db, 'users', authUser.uid), { mustChangePassword: false });
      set({ userDoc: { ...userDoc, mustChangePassword: false }, screen: 'app', authLoading: false });
      get().subscribeResources();
      get().subscribeSchedules();
      get().subscribeConfig();
      get().subscribeBookingsForWeek(get().weekStart);
      get().subscribeMyBookings();
      get().subscribeBlocks(get().weekStart);
    } catch (err) {
      console.error(err);
      set({ authLoading: false });
      throw err;
    }
  },

  async adminCreateUser({ displayName, email, password, tarifa = 'tarifa1' }) {
    const USER_COLORS = [
      '#FF6B35','#FF4757','#2ED573','#3498DB','#9B59B6',
      '#F39C12','#1ABC9C','#E91E8C','#00BCD4','#8BC34A',
    ];
    set({ syncState: 'syncing' });
    try {
      const { adminUsers } = get();
      const color = USER_COLORS[adminUsers.length % USER_COLORS.length];
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        displayName: displayName.trim(),
        email,
        role: 'member',
        color,
        tarifa,
        mustChangePassword: true,
        createdAt: serverTimestamp(),
      });
      await fbSignOut(secondaryAuth);
      get().showToast(`Usuario ${displayName} creado`, 'success');
      get().loadAdminUsers();
      set({ syncState: 'ok' });
    } catch (err) {
      console.error(err);
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Este email ya está registrado'
        : 'Error al crear usuario';
      get().showToast(msg, 'error');
      set({ syncState: 'error' });
      throw err;
    }
  },

  async adminSetUserColor(uid, color) {
    await updateDoc(doc(db, 'users', uid), { color });
    get().loadAdminUsers();
  },

  async adminDeleteUser(uid, displayName) {
    if (!confirm(`¿Eliminar completamente a ${displayName}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      get().showToast(`${displayName} eliminado`, 'success');
      get().loadAdminUsers();
    } catch {
      get().showToast('Error al eliminar usuario', 'error');
    }
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
    get().subscribeBlocks(weekStartStr);
  },

  subscribeBlocks(weekStartStr) {
    unsub(_unsubBlocks);
    const weekEnd = getWeekDates(weekStartStr)[6];
    const q = query(
      collection(db, 'blocks'),
      where('date', '>=', weekStartStr),
      where('date', '<=', weekEnd)
    );
    _unsubBlocks = onSnapshot(q, snap => {
      const blocks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      set({ blocks });
    }, err => {
      console.error('subscribeBlocks error:', err);
    });
  },

  async createBlock({ date, resourceIds, slotStartMinutes, label }) {
    set({ syncState: 'syncing' });
    try {
      const { authUser } = get();
      await setDoc(doc(collection(db, 'blocks')), {
        date,
        resourceIds:       resourceIds || [],       // [] = all resources
        slotStartMinutes:  slotStartMinutes || [],   // [] = all slots (full day)
        label:             label.trim() || 'Taller',
        createdAt:         serverTimestamp(),
        createdBy:         authUser?.uid || '',
      });
      set({ syncState: 'ok' });
      get().showToast('Bloqueo creado', 'success');
    } catch (err) {
      console.error(err);
      get().showToast('Error al crear bloqueo', 'error');
      set({ syncState: 'error' });
    }
  },

  async deleteBlock(blockId) {
    try {
      await deleteDoc(doc(db, 'blocks', blockId));
      get().showToast('Bloqueo eliminado', 'success');
    } catch (err) {
      get().showToast('Error al eliminar bloqueo', 'error');
    }
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
    const { selectedSlot, selectedDuration, bookingNotes, authUser, userDoc, appConfig, myBookings } = get();
    if (!selectedSlot || !authUser || !selectedDuration) return;

    // Maintenance mode check
    if (appConfig?.maintenanceMode) {
      get().showToast('El laboratorio está en mantenimiento. Inténtalo más tarde.', 'error');
      return;
    }

    // Max duration check
    const resource = get().resources.find(r => r.id === selectedSlot.resourceId);
    const maxDuration = resource?.maxDurationMin ?? 240;
    if (selectedDuration > maxDuration) {
      get().showToast(`La reserva no puede durar más de ${maxDuration / 60}h`, 'error');
      return;
    }

    const { date } = selectedSlot;

    // Resolve tariff limits for this user
    const tarifa = userDoc?.tarifa || 'tarifa1';
    const tarifaLimits = appConfig?.tarifas?.[tarifa] || {};

    // Max advance days check
    const maxAdvanceDays = tarifaLimits.maxAdvanceDays ?? appConfig?.maxAdvanceDays ?? 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(date + 'T00:00:00');
    const diffDays = Math.round((bookingDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays > maxAdvanceDays) {
      get().showToast(`Solo puedes reservar con ${maxAdvanceDays} día${maxAdvanceDays !== 1 ? 's' : ''} de antelación`, 'error');
      return;
    }

    set({ bookingLoading: true, syncState: 'syncing' });

    // Query all user bookings (single-field index, always works) then filter client-side
    let userBookings = [];
    try {
      const userSnap = await getDocs(query(
        collection(db, 'bookings'),
        where('userId', '==', authUser.uid)
      ));
      userBookings = userSnap.docs.map(d => d.data()).filter(b => b.status !== 'cancelled');
    } catch (err) {
      console.error('Error checking existing bookings:', err);
      get().showToast('Error al verificar reservas existentes', 'error');
      set({ bookingLoading: false, syncState: 'error' });
      return;
    }

    // No overlapping bookings across any resource on the same day
    const newStart = selectedSlot.startMinute;
    const newEnd   = newStart + selectedDuration;
    const hasOverlap = userBookings.some(b => {
      if (b.date !== date) return false;
      const bEnd = b.startMinute + b.durationMin;
      return newStart < bEnd && b.startMinute < newEnd;
    });
    if (hasOverlap) {
      get().showToast('Ya tienes una reserva en ese horario', 'error');
      set({ bookingLoading: false, syncState: '' });
      return;
    }

    // Max bookings per day check
    const maxPerDay = tarifaLimits.maxBookingsPerUserPerDay ?? appConfig?.maxBookingsPerUserPerDay ?? 3;
    const bookingsToday = userBookings.filter(b => b.date === date).length;
    if (bookingsToday >= maxPerDay) {
      get().showToast(`Límite de ${maxPerDay} reservas por día alcanzado`, 'error');
      set({ bookingLoading: false, syncState: '' });
      return;
    }

    // Max hours per week check
    const maxHoursWeek = tarifaLimits.maxHoursPerUserPerWeek ?? appConfig?.maxHoursPerUserPerWeek ?? 0; // 0 = sin límite
    if (maxHoursWeek > 0) {
      // Get Monday of the booking's week
      const bDate = new Date(date + 'T00:00:00');
      const dayOfWeek = bDate.getDay(); // 0=Sun,1=Mon…
      const monday = new Date(bDate);
      monday.setDate(bDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const weekStart = monday.toISOString().slice(0, 10);
      const weekEnd   = sunday.toISOString().slice(0, 10);
      const hoursThisWeek = userBookings
        .filter(b => b.date >= weekStart && b.date <= weekEnd)
        .reduce((sum, b) => sum + b.durationMin, 0) / 60;
      const newHours = selectedDuration / 60;
      if (hoursThisWeek + newHours > maxHoursWeek) {
        const remaining = Math.max(0, maxHoursWeek - hoursThisWeek);
        get().showToast(`Límite semanal de ${maxHoursWeek}h alcanzado (te quedan ${remaining}h esta semana)`, 'error');
        set({ bookingLoading: false, syncState: '' });
        return;
      }
    }
    try {
      const { resourceId, startMinute } = selectedSlot;
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

      if (navigator.vibrate) navigator.vibrate([10, 50, 20]);
      set({ bookingLoading: false, bookingSuccess: true, syncState: 'ok' });
      setTimeout(() => get().closeBookingModal(), 3000);
    } catch (err) {
      console.error(err);
      get().showToast('Error al guardar la reserva', 'error');
      set({ bookingLoading: false, syncState: 'error' });
    }
  },

  async updateBooking(bookingId, newDurationMin) {
    const { resources, bookings } = get();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    const resource = resources.find(r => r.id === booking.resourceId);
    const maxDuration = resource?.maxDurationMin ?? 240;
    if (newDurationMin > maxDuration) {
      get().showToast(`La reserva no puede durar más de ${maxDuration / 60}h`, 'error');
      return;
    }
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { durationMin: newDurationMin });
      get().showToast('Reserva actualizada', 'success');
      get().closeBookingModal();
    } catch (err) {
      console.error(err);
      get().showToast('Error al actualizar la reserva', 'error');
    }
  },

  // Cancel confirmation sheet flow
  requestCancelBooking(bookingId) { set({ cancelConfirmId: bookingId }); },
  dismissCancelConfirm()          { set({ cancelConfirmId: null }); },

  async cancelBooking(bookingId) {
    set({ syncState: 'syncing', cancelConfirmId: null });
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

  async setUserTarifa(uid, tarifa) {
    try {
      await updateDoc(doc(db, 'users', uid), { tarifa });
      set(s => ({ adminUsers: s.adminUsers.map(u => u.id === uid ? { ...u, tarifa } : u) }));
      get().showToast('Tarifa actualizada', 'success');
    } catch {
      get().showToast('Error al actualizar tarifa', 'error');
    }
  },

  async adminResetPassword(email) {
    if (!confirm(`¿Enviar email de recuperación de contraseña a ${email}?`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      get().showToast('Email de recuperación enviado', 'success');
    } catch (err) {
      console.error(err);
      get().showToast('Error al enviar el email', 'error');
    }
  },

  async adminDisableUser(uid, displayName) {
    if (!confirm(`¿Desactivar la cuenta de ${displayName}? No podrá acceder a la app.`)) return;
    try {
      await updateDoc(doc(db, 'users', uid), { disabled: true });
      get().showToast(`Cuenta de ${displayName} desactivada`, 'success');
      get().loadAdminUsers();
    } catch {
      get().showToast('Error al desactivar usuario', 'error');
    }
  },

  async adminEnableUser(uid, displayName) {
    try {
      await updateDoc(doc(db, 'users', uid), { disabled: false });
      get().showToast(`Cuenta de ${displayName} reactivada`, 'success');
      get().loadAdminUsers();
    } catch {
      get().showToast('Error al reactivar usuario', 'error');
    }
  },

  async adminSaveConfig(fields) {
    set({ syncState: 'syncing' });
    try {
      await updateDoc(doc(db, 'config', 'app'), fields);
      set({ syncState: 'ok' });
      get().showToast('Configuración guardada', 'success');
    } catch (err) {
      console.error(err);
      get().showToast('Error al guardar configuración', 'error');
      set({ syncState: 'error' });
    }
  },

  async adminReorderResource(id, direction) {
    const { resources } = get();
    const sorted = [...resources].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const idx = sorted.findIndex(r => r.id === id);
    if (direction === 'up'   && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    const batch = writeBatch(db);
    const orderA = sorted[idx].order ?? idx;
    const orderB = sorted[swap].order ?? swap;
    batch.update(doc(db, 'resources', sorted[idx].id), { order: orderB });
    batch.update(doc(db, 'resources', sorted[swap].id), { order: orderA });
    await batch.commit();
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

  openProfileModal()  { set({ profileModal: true }); },
  closeProfileModal() { set({ profileModal: false }); },

  async saveProfile({ displayName, color }) {
    const { authUser, userDoc } = get();
    if (!authUser) return;
    set({ syncState: 'syncing' });
    try {
      await updateDoc(doc(db, 'users', authUser.uid), { displayName, color });
      set({ userDoc: { ...userDoc, displayName, color }, syncState: 'ok' });
      get().showToast('Perfil actualizado', 'success');
    } catch {
      get().showToast('Error al guardar', 'error');
      set({ syncState: 'error' });
    }
  },

  async uploadAvatar(file) {
    const { authUser, userDoc } = get();
    if (!authUser || !file) return;
    set({ syncState: 'syncing' });
    try {
      const photoURL = await compressImageToBase64(file, 160, 0.75);
      await updateDoc(doc(db, 'users', authUser.uid), { photoURL });
      set({ userDoc: { ...userDoc, photoURL }, syncState: 'ok' });
      get().showToast('Foto actualizada', 'success');
    } catch (err) {
      console.error(err);
      get().showToast('Error al subir la foto', 'error');
      set({ syncState: 'error' });
    }
  },

  showToast(msg, type = '') {
    set({ toastMsg: msg, toastType: type, toastVisible: true });
    setTimeout(() => set({ toastVisible: false }), 2500);
  },

  setSyncState(s) { set({ syncState: s }); },

}));
