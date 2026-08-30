import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest, ApiError } from "@/services/apiClient";
import {
    createProject,
    disableProject,
    listProjects,
    projectPathSegment,
} from "@/services/projectService";

vi.mock("@/services/apiClient", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/apiClient")>();
    return { ...actual, apiRequest: vi.fn() };
});

const requestMock = vi.mocked(apiRequest);
const project = { id: 12, name: "Hermes", description: "Runtime", is_active: true };

describe("projectService", () => {
    beforeEach(() => requestMock.mockReset());

    it("liste les Projects avec le client central et valide les DTO", async () => {
        requestMock.mockResolvedValue([project]);
        await expect(listProjects()).resolves.toEqual([project]);
        expect(requestMock).toHaveBeenCalledWith("/api/admin/projects", { signal: undefined });
    });

    it("crée un Project avec les seuls champs supportés", async () => {
        requestMock.mockResolvedValue(project);
        await expect(createProject({ name: "Hermes", description: null })).resolves.toEqual(project);
        expect(requestMock).toHaveBeenCalledWith("/api/admin/projects", {
            method: "POST",
            body: { name: "Hermes", description: null },
        });
    });

    it("désactive sans transformer l'action en suppression", async () => {
        requestMock.mockResolvedValue({ ...project, is_active: false });
        await disableProject(12);
        expect(requestMock).toHaveBeenCalledWith("/api/admin/projects/12/disable", {
            method: "PATCH",
            forbidden: "local",
        });
    });

    it("valide et encode les segments d'identifiants", () => {
        expect(projectPathSegment(42)).toBe("42");
        expect(() => projectPathSegment(Number.NaN)).toThrow(ApiError);
        expect(() => projectPathSegment(-1)).toThrow("Identifiant de Project invalide");
    });

    it("rejette une réponse réseau ne respectant pas le DTO", async () => {
        requestMock.mockResolvedValue([{ id: "12", name: "bad", description: null, is_active: true }]);
        await expect(listProjects()).rejects.toThrow("Project invalide");
    });

});
