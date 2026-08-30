import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";

import { useAuth } from "@/auth/useAuth";
import {
    ProjectContext,
    type ProjectListState,
} from "@/project/projectContext";
import { ApiError } from "@/services/apiClient";
import { listProjects, type Project } from "@/services/projectService";
import { projectPreferenceKey } from "@/project/projectPreference";

function readProjectPreference(): number | null {
    const value = sessionStorage.getItem(projectPreferenceKey);
    const projectId = value === null ? Number.NaN : Number(value);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
        sessionStorage.removeItem(projectPreferenceKey);
        return null;
    }

    return projectId;
}

interface ProjectProviderProps {
    children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
    const { status, user } = useAuth();
    const [state, setState] = useState<ProjectListState>({ status: "idle" });
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const requestSequence = useRef(0);
    const abortController = useRef<AbortController | null>(null);

    const refreshProjects = useCallback(async () => {
        const sequence = ++requestSequence.current;
        abortController.current?.abort();
        const nextAbortController = new AbortController();
        abortController.current = nextAbortController;
        setState({ status: "loading" });

        try {
            const projects = await listProjects(nextAbortController.signal);

            if (sequence !== requestSequence.current) {
                return projects;
            }

            setState({ status: "ready", projects });
            setSelectedProjectId((currentId) => {
                const candidate = currentId ?? readProjectPreference();
                const remainsAccessible = projects.some((project) => project.id === candidate);

                if (!remainsAccessible) {
                    sessionStorage.removeItem(projectPreferenceKey);
                    return null;
                }

                return candidate;
            });
            return projects;
        } catch (caught) {
            if (caught instanceof DOMException && caught.name === "AbortError") {
                return [];
            }

            if (sequence === requestSequence.current) {
                const message = caught instanceof ApiError
                    ? caught.message
                    : "Impossible de charger les Projects.";
                setState({ status: "error", message });
            }
            throw caught;
        }
    }, []);

    const selectProject = useCallback((projectId: number | null) => {
        if (projectId === null) {
            sessionStorage.removeItem(projectPreferenceKey);
            setSelectedProjectId(null);
            return;
        }

        sessionStorage.setItem(projectPreferenceKey, String(projectId));
        setSelectedProjectId(projectId);
    }, []);

    useEffect(() => {
        let timeoutId: number | undefined;

        if (status === "AUTHENTICATED" && user) {
            timeoutId = window.setTimeout(() => {
                void refreshProjects().catch(() => undefined);
            }, 0);
        } else if (status === "ANONYMOUS") {
            abortController.current?.abort();
            requestSequence.current += 1;
            sessionStorage.removeItem(projectPreferenceKey);
            timeoutId = window.setTimeout(() => {
                setSelectedProjectId(null);
                setState({ status: "idle" });
            }, 0);
        }

        return () => {
            if (timeoutId !== undefined) window.clearTimeout(timeoutId);
            abortController.current?.abort();
        };
    }, [refreshProjects, status, user]);

    const selectedProject = useMemo((): Project | null => {
        if (state.status !== "ready" || selectedProjectId === null) {
            return null;
        }

        return state.projects.find((project) => project.id === selectedProjectId) ?? null;
    }, [selectedProjectId, state]);

    const value = useMemo(() => ({
        state,
        selectedProject,
        selectProject,
        refreshProjects,
    }), [refreshProjects, selectProject, selectedProject, state]);

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
