import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest, ApiError } from "@/services/apiClient";
import {
    addProjectMember,
    isProjectMemberRole,
    listProjectMembers,
    removeProjectMember,
    updateProjectMemberRole,
} from "@/services/projectMemberService";

vi.mock("@/services/apiClient", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/apiClient")>();
    return { ...actual, apiRequest: vi.fn() };
});

const requestMock = vi.mocked(apiRequest);
const member = { user_id: 7, email: "alice@example.com", role: "OWNER" as const };

describe("projectMemberService", () => {
    beforeEach(() => requestMock.mockReset());

    it("liste les membres", async () => {
        requestMock.mockResolvedValue([member]);
        await expect(listProjectMembers(12)).resolves.toEqual([member]);
        expect(requestMock).toHaveBeenCalledWith("/api/admin/projects/12/members", { signal: undefined });
    });

    it("ajoute un utilisateur existant", async () => {
        requestMock.mockResolvedValue(member);
        await addProjectMember(12, { email: member.email, role: "OWNER" });
        expect(requestMock).toHaveBeenCalledWith("/api/admin/projects/12/members", {
            method: "POST",
            body: { email: member.email, role: "OWNER" },
            forbidden: "local",
        });
    });

    it("change le rôle avec des identifiants numériques sûrs", async () => {
        requestMock.mockResolvedValue({ ...member, role: "DEVELOPER" });
        await updateProjectMemberRole(12, 7, "DEVELOPER");
        expect(requestMock).toHaveBeenCalledWith("/api/admin/projects/12/members/7/role", {
            method: "PATCH",
            body: { role: "DEVELOPER" },
            forbidden: "local",
        });
    });

    it("retire un membre et accepte la réponse 204", async () => {
        requestMock.mockResolvedValue(undefined);
        await removeProjectMember(12, 7);
        expect(requestMock).toHaveBeenCalledWith("/api/admin/projects/12/members/7", {
            method: "DELETE",
            forbidden: "local",
        });
    });

    it("ferme l'allowlist des rôles et refuse les identifiants invalides", async () => {
        expect(isProjectMemberRole("VIEWER")).toBe(true);
        expect(isProjectMemberRole("ROOT")).toBe(false);
        await expect(updateProjectMemberRole(12, -1, "VIEWER")).rejects.toBeInstanceOf(ApiError);
    });

    it("rejette les membres mal formés reçus du réseau", async () => {
        requestMock.mockResolvedValue([{ ...member, role: "ROOT" }]);
        await expect(listProjectMembers(12)).rejects.toThrow("membre invalide");
    });
});
