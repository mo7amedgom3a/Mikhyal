"use client";
/** TanStack Query hooks over the service layer (cache keys mirror the endpoint paths). */
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LearnerModel, LearningEvent, ListQuery } from "@/lib/domain";
import { actAs } from "./client";
import { classroomService, contentService, learnerService, parentService } from "./services";

export const keys = {
  catalog: (q?: ListQuery) => ["catalog", q ?? {}] as const,
  mission: (id: string) => ["missions", id] as const,
  lab: (id: string) => ["labs", id] as const,
  phenomenon: (id: string) => ["phenomena", id] as const,
  workbench: (id: string) => ["workbench", id] as const,
  learner: ["me", "learner-model"] as const,
  progress: ["me", "progress"] as const,
  classReport: (id: string) => ["classes", id, "report"] as const,
  childReport: (id: string) => ["children", id, "report"] as const,
};

export const useCatalog = (q?: ListQuery) => useQuery({ queryKey: keys.catalog(q), queryFn: () => contentService.catalog(q) });
export const useMission = (id: string) => useQuery({ queryKey: keys.mission(id), queryFn: () => contentService.mission(id), staleTime: 5 * 60_000 });
export const useLab = (id: string) => useQuery({ queryKey: keys.lab(id), queryFn: () => contentService.lab(id), staleTime: 5 * 60_000 });
export const usePhenomenon = (id: string) => useQuery({ queryKey: keys.phenomenon(id), queryFn: () => contentService.phenomenon(id), staleTime: 5 * 60_000 });
export const useWorkbenchProblem = (id: string) => useQuery({ queryKey: keys.workbench(id), queryFn: () => contentService.workbenchProblem(id), staleTime: 5 * 60_000 });
export const useLearnerModel = () => useQuery({ queryKey: keys.learner, queryFn: learnerService.model });
export const useProgress = () => useQuery({ queryKey: keys.progress, queryFn: learnerService.progress });
export const useClassReport = (id: string, enabled = true) => useQuery({ queryKey: keys.classReport(id), queryFn: () => classroomService.report(id), enabled });
export const useChildReport = (id: string, enabled = true) => useQuery({ queryKey: keys.childReport(id), queryFn: () => parentService.report(id), enabled });

/** Post learning events; the server's updated learner model replaces the cached one. */
export function useRecordEvents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (events: LearningEvent[]) => learnerService.events(events),
    onSuccess: ({ learner }) => {
      qc.setQueryData<LearnerModel>(keys.learner, learner);
      qc.invalidateQueries({ queryKey: keys.progress });
    },
  });
}

/** Act as a demo identity while this component is mounted (teacher / parent pages). */
export function useActAs(userId: string) {
  // Set synchronously so the first queries of the page already carry the identity.
  actAs(userId);
  useEffect(() => () => actAs(undefined), []);
}
