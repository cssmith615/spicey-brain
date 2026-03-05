import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Routine, RoutineSession, ChildProfile, ParentProfile,
  PortalAccess, PortalNote,
  Reward, MedicationEntry, MoodEntry, TeacherContact, TeacherNote,
  RedemptionRequest, IntakeQuestionnaire,
} from '../types';

const STORAGE_KEY = 'spiceybrain_data';

interface AppState {
  parentProfile: ParentProfile | null;
  routines: Routine[];
  sessions: RoutineSession[];
  rewards: Reward[];
  medications: MedicationEntry[];
  moodEntries: MoodEntry[];
  teacherContacts: TeacherContact[];
  teacherNotes: TeacherNote[];
  redemptionRequests: RedemptionRequest[];
  portalAccesses: PortalAccess[];
  portalNotes: PortalNote[];
  questionnaires: IntakeQuestionnaire[];
  activeChildId: string | null;
  isParentMode: boolean;

  setParentProfile: (profile: ParentProfile) => void;

  addChildProfile: (child: ChildProfile) => void;
  updateChildProfile: (id: string, updates: Partial<ChildProfile>) => void;
  removeChildProfile: (id: string) => void;

  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  removeRoutine: (id: string) => void;

  startSession: (session: RoutineSession) => void;
  updateSession: (id: string, updates: Partial<RoutineSession>) => void;

  addReward: (reward: Reward) => void;
  removeReward: (id: string) => void;

  addMedication: (entry: MedicationEntry) => void;
  updateMedication: (id: string, updates: Partial<MedicationEntry>) => void;
  removeMedication: (id: string) => void;

  addMoodEntry: (entry: MoodEntry) => void;

  addTeacherContact: (contact: TeacherContact) => void;
  removeTeacherContact: (id: string) => void;
  addTeacherNote: (note: TeacherNote) => void;
  updateTeacherNote: (id: string, updates: Partial<TeacherNote>) => void;

  addRedemptionRequest: (req: RedemptionRequest) => void;
  updateRedemptionRequest: (id: string, updates: Partial<RedemptionRequest>) => void;

  addQuestionnaire: (q: IntakeQuestionnaire) => void;
  updateQuestionnaire: (id: string, updates: Partial<IntakeQuestionnaire>) => void;

  addPortalAccess: (access: PortalAccess) => void;
  updatePortalAccess: (id: string, updates: Partial<PortalAccess>) => void;
  removePortalAccess: (id: string) => void;
  addPortalNote: (note: PortalNote) => void;
  markPortalNoteRead: (id: string) => void;

  setParentMode: (isParent: boolean) => void;
  setActiveChild: (childId: string | null) => void;

  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
}

const simpleSet =
  <K extends keyof AppState>(key: K, get: () => AppState) =>
  (val: AppState[K]) => {
    (get() as any); // satisfy lint
    return { [key]: val };
  };

export const useAppStore = create<AppState>((set, get) => ({
  parentProfile: null,
  routines: [],
  sessions: [],
  rewards: [],
  medications: [],
  moodEntries: [],
  teacherContacts: [],
  teacherNotes: [],
  redemptionRequests: [],
  portalAccesses: [],
  portalNotes: [],
  questionnaires: [],
  activeChildId: null,
  isParentMode: true,

  setParentProfile: (profile) => { set({ parentProfile: profile }); get().saveData(); },

  addChildProfile: (child) => {
    set((s) => ({ parentProfile: s.parentProfile ? { ...s.parentProfile, childProfiles: [...s.parentProfile.childProfiles, child] } : null }));
    get().saveData();
  },
  updateChildProfile: (id, updates) => {
    set((s) => ({ parentProfile: s.parentProfile ? { ...s.parentProfile, childProfiles: s.parentProfile.childProfiles.map((c) => c.id === id ? { ...c, ...updates } : c) } : null }));
    get().saveData();
  },
  removeChildProfile: (id) => {
    set((s) => ({ parentProfile: s.parentProfile ? { ...s.parentProfile, childProfiles: s.parentProfile.childProfiles.filter((c) => c.id !== id) } : null }));
    get().saveData();
  },

  addRoutine: (routine) => { set((s) => ({ routines: [...s.routines, routine] })); get().saveData(); },
  updateRoutine: (id, updates) => { set((s) => ({ routines: s.routines.map((r) => r.id === id ? { ...r, ...updates } : r) })); get().saveData(); },
  removeRoutine: (id) => { set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })); get().saveData(); },

  startSession: (session) => { set((s) => ({ sessions: [...s.sessions, session] })); get().saveData(); },
  updateSession: (id, updates) => { set((s) => ({ sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, ...updates } : sess) })); get().saveData(); },

  addReward: (reward) => { set((s) => ({ rewards: [...s.rewards, reward] })); get().saveData(); },
  removeReward: (id) => { set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) })); get().saveData(); },

  addMedication: (entry) => { set((s) => ({ medications: [...s.medications, entry] })); get().saveData(); },
  updateMedication: (id, updates) => { set((s) => ({ medications: s.medications.map((m) => m.id === id ? { ...m, ...updates } : m) })); get().saveData(); },
  removeMedication: (id) => { set((s) => ({ medications: s.medications.filter((m) => m.id !== id) })); get().saveData(); },

  addMoodEntry: (entry) => { set((s) => ({ moodEntries: [...s.moodEntries, entry] })); get().saveData(); },

  addTeacherContact: (contact) => { set((s) => ({ teacherContacts: [...s.teacherContacts, contact] })); get().saveData(); },
  removeTeacherContact: (id) => { set((s) => ({ teacherContacts: s.teacherContacts.filter((c) => c.id !== id) })); get().saveData(); },
  addTeacherNote: (note) => { set((s) => ({ teacherNotes: [...s.teacherNotes, note] })); get().saveData(); },
  updateTeacherNote: (id, updates) => { set((s) => ({ teacherNotes: s.teacherNotes.map((n) => n.id === id ? { ...n, ...updates } : n) })); get().saveData(); },

  addRedemptionRequest: (req) => { set((s) => ({ redemptionRequests: [...s.redemptionRequests, req] })); get().saveData(); },
  updateRedemptionRequest: (id, updates) => { set((s) => ({ redemptionRequests: s.redemptionRequests.map((r) => r.id === id ? { ...r, ...updates } : r) })); get().saveData(); },

  addQuestionnaire: (q) => { set((s) => ({ questionnaires: [...s.questionnaires, q] })); get().saveData(); },
  updateQuestionnaire: (id, updates) => { set((s) => ({ questionnaires: s.questionnaires.map((q) => q.id === id ? { ...q, ...updates } : q) })); get().saveData(); },

  addPortalAccess: (access) => { set((s) => ({ portalAccesses: [...s.portalAccesses, access] })); get().saveData(); },
  updatePortalAccess: (id, updates) => { set((s) => ({ portalAccesses: s.portalAccesses.map((a) => a.id === id ? { ...a, ...updates } : a) })); get().saveData(); },
  removePortalAccess: (id) => { set((s) => ({ portalAccesses: s.portalAccesses.filter((a) => a.id !== id) })); get().saveData(); },
  addPortalNote: (note) => { set((s) => ({ portalNotes: [...s.portalNotes, note] })); get().saveData(); },
  markPortalNoteRead: (id) => { set((s) => ({ portalNotes: s.portalNotes.map((n) => n.id === id ? { ...n, parentRead: true } : n) })); get().saveData(); },

  setParentMode: (isParent) => set({ isParentMode: isParent }),
  setActiveChild: (childId) => set({ activeChildId: childId }),

  loadData: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        set({
          parentProfile: d.parentProfile ?? null,
          routines: d.routines ?? [],
          sessions: d.sessions ?? [],
          rewards: d.rewards ?? [],
          medications: d.medications ?? [],
          moodEntries: d.moodEntries ?? [],
          teacherContacts: d.teacherContacts ?? [],
          teacherNotes: d.teacherNotes ?? [],
          redemptionRequests: d.redemptionRequests ?? [],
          portalAccesses: d.portalAccesses ?? [],
          portalNotes: d.portalNotes ?? [],
          questionnaires: d.questionnaires ?? [],
        });
      }
    } catch (e) { console.warn('Failed to load data', e); }
  },

  saveData: async () => {
    try {
      const s = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        parentProfile: s.parentProfile,
        routines: s.routines,
        sessions: s.sessions,
        rewards: s.rewards,
        medications: s.medications,
        moodEntries: s.moodEntries,
        teacherContacts: s.teacherContacts,
        teacherNotes: s.teacherNotes,
        redemptionRequests: s.redemptionRequests,
        portalAccesses: s.portalAccesses,
        portalNotes: s.portalNotes,
        questionnaires: s.questionnaires,
      }));
    } catch (e) { console.warn('Failed to save data', e); }
  },
}));
