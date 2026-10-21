/**
 * In-memory data store behind the simulated API. Collections implement a small Repository
 * interface so a Postgres implementation can replace this without touching services or routes.
 * The store lives on globalThis so it survives Next.js dev hot reloads; it resets on restart.
 */
import type {
  AIGenerationJob,
  Assignment,
  Classroom,
  Concept,
  ContentVersion,
  CurriculumOutcome,
  Enrollment,
  Equation,
  Exam,
  Lab,
  LearnerModel,
  LearningEvent,
  Misconception,
  Mission,
  ParentLink,
  Phenomenon,
  Quantity,
  Session,
  SimulationEngine,
  StudioDraft,
  SubjectRecord,
  Template,
  Unit,
  User,
  VisualComponent,
  Visualization,
  WorkbenchProblem,
} from "@/lib/domain";
import { CONCEPTS, OUTCOMES, SUBJECTS, UNITS } from "../seed/curriculum";
import { buildContentSeed } from "../seed/content";
import { ASSIGNMENTS, CLASSROOMS, ENROLLMENTS, PARENT_LINKS, TEMPLATES, USERS } from "../seed/people";

export interface Repository<T extends { id: string }> {
  list(filter?: (item: T) => boolean): T[];
  get(id: string): T | undefined;
  insert(item: T): T;
  update(id: string, patch: Partial<T>): T | undefined;
  remove(id: string): boolean;
  count(): number;
}

export class MemoryCollection<T extends { id: string }> implements Repository<T> {
  private rows = new Map<string, T>();
  constructor(seed: T[] = []) {
    for (const r of seed) this.rows.set(r.id, structuredClone(r));
  }
  list(filter?: (item: T) => boolean): T[] {
    const all = [...this.rows.values()];
    return filter ? all.filter(filter) : all;
  }
  get(id: string) {
    return this.rows.get(id);
  }
  insert(item: T) {
    this.rows.set(item.id, item);
    return item;
  }
  update(id: string, patch: Partial<T>) {
    const cur = this.rows.get(id);
    if (!cur) return undefined;
    const next = { ...cur, ...patch, id };
    this.rows.set(id, next);
    return next;
  }
  remove(id: string) {
    return this.rows.delete(id);
  }
  count() {
    return this.rows.size;
  }
}

type LearnerRow = LearnerModel & { id: string };
type EventRow = LearningEvent & { id: string; userId: string };

function createStore() {
  const c = buildContentSeed();
  return {
    users: new MemoryCollection<User>(USERS),
    classrooms: new MemoryCollection<Classroom>(CLASSROOMS),
    enrollments: new MemoryCollection<Enrollment>(ENROLLMENTS),
    parentLinks: new MemoryCollection<ParentLink>(PARENT_LINKS),
    assignments: new MemoryCollection<Assignment>(ASSIGNMENTS),
    subjects: new MemoryCollection<SubjectRecord>(SUBJECTS),
    units: new MemoryCollection<Unit>(UNITS),
    concepts: new MemoryCollection<Concept>(CONCEPTS),
    outcomes: new MemoryCollection<CurriculumOutcome>(OUTCOMES),
    quantities: new MemoryCollection<Quantity>(c.quantities),
    equations: new MemoryCollection<Equation>(c.equations),
    misconceptions: new MemoryCollection<Misconception>(c.misconceptions),
    simulations: new MemoryCollection<SimulationEngine>(c.simulations),
    visualComponents: new MemoryCollection<VisualComponent>(c.visualComponents),
    visualizations: new MemoryCollection<Visualization>([]),
    missions: new MemoryCollection<Mission>(c.missions),
    exams: new MemoryCollection<Exam>(c.exams),
    labs: new MemoryCollection<Lab>(c.labs),
    phenomena: new MemoryCollection<Phenomenon>(c.phenomena),
    workbench: new MemoryCollection<WorkbenchProblem>(c.workbench),
    templates: new MemoryCollection<Template>(TEMPLATES),
    drafts: new MemoryCollection<StudioDraft>([]),
    versions: new MemoryCollection<ContentVersion>([]),
    jobs: new MemoryCollection<AIGenerationJob>([]),
    sessions: new MemoryCollection<Session>([]),
    events: new MemoryCollection<EventRow>([]),
    learners: new MemoryCollection<LearnerRow>([]),
  };
}

export type Store = ReturnType<typeof createStore>;

const g = globalThis as unknown as { __mikhyalStore?: Store };

export function db(): Store {
  if (!g.__mikhyalStore) g.__mikhyalStore = createStore();
  return g.__mikhyalStore;
}

/** Fresh store (tests). */
export function resetDb(): Store {
  g.__mikhyalStore = createStore();
  return g.__mikhyalStore;
}

let counter = 0;
export function newId(prefix: string): string {
  counter = (counter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const nowIso = () => new Date().toISOString();
