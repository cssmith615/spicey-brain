export type RoutineType = 'morning' | 'afternoon' | 'evening' | 'custom';

export interface RoutineTask {
  id: string;
  title: string;
  icon: string; // emoji
  durationMinutes?: number; // optional timed task
  isMedication: boolean;
  order: number;
}

export interface Routine {
  id: string;
  name: string;
  type: RoutineType;
  scheduledTime: string; // HH:mm format
  tasks: RoutineTask[];
  isActive: boolean;
  createdAt: string;
}

export interface RoutineSession {
  id: string;
  routineId: string;
  childProfileId: string;
  startedAt: string;
  completedAt?: string;
  taskCompletions: TaskCompletion[];
}

export interface TaskCompletion {
  taskId: string;
  completedAt: string;
  durationSeconds?: number;
}

export type AgeGroup = 'young' | 'middle' | 'teen'; // ~5-7, 8-12, 13+

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  ageGroup: AgeGroup;
  avatarEmoji: string;
  deviceAccessEnabled: boolean;
  pin?: string; // optional PIN to switch to child view
  assignedRoutineIds: string[];
}

export interface ParentProfile {
  id: string;
  name: string;
  pin: string; // PIN to access parent view
  childProfiles: ChildProfile[];
}

export type PortalRole = 'teacher' | 'therapist' | 'caregiver';

export interface PortalPermissions {
  canAddNotes: boolean;
  canViewMoodLogs: boolean;
  canViewRoutines: boolean;
  canViewProgress: boolean;
  canViewMedication: boolean;
}

export interface PortalAccess {
  id: string;
  code: string; // 6-char alphanumeric share code
  childProfileId: string;
  professionalName: string;
  role: PortalRole;
  permissions: PortalPermissions;
  createdAt: string;
  lastAccessedAt?: string;
  isActive: boolean;
}

export interface PortalNote {
  id: string;
  portalAccessId: string;
  childProfileId: string;
  authorName: string;
  authorRole: PortalRole;
  date: string;
  type: 'observation' | 'concern' | 'positive' | 'recommendation' | 'session';
  content: string;
  isPrivate: boolean; // private = only parent can see; false = shared back with portal
  parentRead: boolean;
}

// ── Rewards ──────────────────────────────────────────────────────────────────
export interface Reward {
  id: string;
  title: string;
  icon: string;
  starCost: number;
  childProfileId: string;
}

// ── Medication ───────────────────────────────────────────────────────────────
export interface MedicationLog {
  id: string;
  takenAt: string;
  scheduledTime: string;
  skipped: boolean;
  notes?: string;
}

export interface MedicationEntry {
  id: string;
  childProfileId: string;
  name: string;
  dosage: string;
  times: string[];
  notes: string;
  reminderEnabled: boolean;
  logHistory: MedicationLog[];
}

// ── Mood & Behavior ───────────────────────────────────────────────────────────
export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type FocusLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  childProfileId: string;
  recordedAt: string;
  mood: MoodLevel;
  focus: FocusLevel;
  behaviors: string[];
  notes: string;
  recordedBy: 'parent' | 'teacher';
}

// ── Teacher Log ───────────────────────────────────────────────────────────────
export interface TeacherContact {
  id: string;
  name: string;
  subject: string;
  email: string;
  phone?: string;
  childProfileId: string;
}

export interface TeacherNote {
  id: string;
  childProfileId: string;
  teacherContactId?: string;
  date: string;
  type: 'observation' | 'concern' | 'positive' | 'meeting' | 'message';
  content: string;
  followUpRequired: boolean;
  followUpDone: boolean;
}

// ── Intake Questionnaire ──────────────────────────────────────────────────────
export type QuestionType = 'text' | 'multiline' | 'scale' | 'yesno' | 'multiselect';

export interface QuestionnaireQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // for multiselect
  required: boolean;
}

export interface IntakeQuestionnaire {
  id: string;
  childProfileId: string;
  portalAccessId: string;
  professionalName: string;
  professionalRole: PortalRole;
  professionalEmail: string;
  title: string;
  description: string;
  questions: QuestionnaireQuestion[];
  createdAt: string;
  status: 'pending' | 'completed';
  completedAt?: string;
  responses: Record<string, string | string[] | number>;
}

// ── Redemption ────────────────────────────────────────────────────────────────
export interface RedemptionRequest {
  id: string;
  rewardId: string;
  rewardTitle: string;
  rewardIcon: string;
  starCost: number;
  childProfileId: string;
  childName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied';
}
