import { createContext } from "react";

import type { Project } from "@/services/projectService";

export type ProjectListState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; projects: Project[] }
    | { status: "error"; message: string };

export interface ProjectContextValue {
    state: ProjectListState;
    selectedProject: Project | null;
    selectProject: (projectId: number | null) => void;
    refreshProjects: () => Promise<Project[]>;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null);
