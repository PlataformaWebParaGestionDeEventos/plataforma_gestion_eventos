/**
 * Mock completo de Firebase para testing
 * @fileoverview Proporciona implementaciones mock de Firebase Auth y Firestore
 */

import { vi } from "vitest";

// Mock de Firebase Auth
export const mockUser = {
  uid: "test-user-id",
  email: "test@upao.edu.pe",
  emailVerified: true,
  displayName: "Test User",
};

export const mockAuth = {
  currentUser: mockUser,
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendEmailVerification: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
};

export const onAuthStateChanged = vi.fn((callback) => {
  callback(mockUser);
  return vi.fn(); // unsubscribe function
});

export const getAuth = vi.fn(() => mockAuth);

// Mock de Firestore
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
};

export const mockDocumentSnapshot = {
  exists: () => true,
  data: () => ({
    uid: "test-user-id",
    nombre: "Test",
    apellido: "User",
    email: "test@upao.edu.pe",
    role: "alumno",
    fechaRegistro: new Date("2024-01-01"),
  }),
  id: "test-doc-id",
};

export const mockQuerySnapshot = {
  docs: [mockDocumentSnapshot],
  forEach: vi.fn((callback) => {
    [mockDocumentSnapshot].forEach(callback);
  }),
  size: 1,
  empty: false,
};

// Funciones de Firestore mockeadas
export const getFirestore = vi.fn(() => mockFirestore);
export const doc = vi.fn();
export const getDoc = vi.fn().mockResolvedValue(mockDocumentSnapshot);
export const setDoc = vi.fn().mockResolvedValue(undefined);
export const addDoc = vi.fn().mockResolvedValue({ id: "test-doc-id" });
export const updateDoc = vi.fn().mockResolvedValue(undefined);
export const deleteDoc = vi.fn().mockResolvedValue(undefined);
export const collection = vi.fn();
export const query = vi.fn();
export const where = vi.fn();
export const orderBy = vi.fn();
export const limit = vi.fn();
export const getDocs = vi.fn().mockResolvedValue(mockQuerySnapshot);

// Mock de Firebase App
export const mockFirebaseApp = {
  name: "test-app",
  options: {},
};

export const initializeApp = vi.fn(() => mockFirebaseApp);

// Datos mock para eventos
export const mockEvento = {
  id: "evento-test-id",
  titulo: "Conferencia de Testing",
  descripcion: "Evento de prueba para testing",
  fechaInicio: "2024-12-15",
  fechaFin: "2024-12-15",
  horaInicio: "09:00",
  horaFin: "17:00",
  ubicacion: "Aula Magna",
  capacidad: 100,
  tipoEvento: "conferencia",
  modalidad: "presencial",
  estado: "publicado",
  organizadorId: "organizador-test-id",
  participantes: [],
  expositores: [
    {
      nombre: "Dr. Test Speaker",
      correo: "speaker@upao.edu.pe",
      tema: "Testing en React",
      dia: "2024-12-15",
      hora: "10:00",
      duracion: 60,
      break: false,
    },
  ],
  asistenciasPorDia: {},
  fechaCreacion: new Date("2024-12-01"),
};

export const mockParticipante = {
  uid: "participante-test-id",
  email: "participante@upao.edu.pe",
  nombre: "Juan",
  apellido: "Pérez",
  role: "alumno",
  fechaInscripcion: new Date("2024-12-10"),
};

export default {
  mockUser,
  mockAuth,
  mockFirestore,
  mockDocumentSnapshot,
  mockQuerySnapshot,
  mockEvento,
  mockParticipante,
};
