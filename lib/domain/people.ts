/** Users, classrooms, parent links and assignments. */
import { idOf, Role, Timestamp } from "./common";
import { named, z } from "./z";

export const User = named(
  "User",
  z.object({
    id: idOf("user"),
    role: Role,
    name: z.string(),
    email: z.string().email().optional(),
    grade: z.number().int().min(1).max(3).optional(),
    locale: z.enum(["ar-EG", "en"]),
    createdAt: Timestamp,
  }),
);
export type User = z.infer<typeof User>;

export const Classroom = named(
  "Classroom",
  z.object({
    id: idOf("classroom"),
    name: z.string(),
    teacherId: idOf("user"),
    grade: z.number().int().min(1).max(3),
    joinCode: z.string(),
    createdAt: Timestamp,
  }),
);
export type Classroom = z.infer<typeof Classroom>;

export const Enrollment = named(
  "Enrollment",
  z.object({ id: idOf("enrollment"), classroomId: idOf("classroom"), studentId: idOf("user"), joinedAt: Timestamp }),
);
export type Enrollment = z.infer<typeof Enrollment>;

export const ParentLink = named(
  "ParentLink",
  z.object({ id: idOf("parentLink"), parentId: idOf("user"), studentId: idOf("user"), relation: z.enum(["mother", "father", "guardian"]) }),
);
export type ParentLink = z.infer<typeof ParentLink>;

export const Assignment = named(
  "Assignment",
  z.object({
    id: idOf("assignment"),
    classroomId: idOf("classroom"),
    contentId: z.string(),
    contentType: z.enum(["mission", "lab", "phenomenon", "workbench", "exam"]),
    mode: z.enum(["discovery", "exam"]),
    dueAt: Timestamp.optional(),
    createdAt: Timestamp,
  }),
);
export type Assignment = z.infer<typeof Assignment>;
