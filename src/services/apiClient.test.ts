import { beforeEach, describe, expect, it, vi } from "vitest";

import { tokenStorage } from "@/auth/tokenStorage";
import { getApiBaseUrl } from "@/config/environment";
import { ApiError, apiRequest } from "@/services/apiClient";
import { httpEvents } from "@/services/httpEvents";
import { createAccessToken } from "@/test/jwtFixture";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

describe("apiRequest", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", fetchMock);
        vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test/root");
    });

    it("utilise et normalise la base URL configurable", async () => {
        vi.stubEnv("VITE_API_BASE_URL", "https://other.example.test/");
        fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

        await apiRequest("/health");

        expect(getApiBaseUrl()).toBe("https://other.example.test");
        expect(fetchMock).toHaveBeenCalledWith(
            "https://other.example.test/health",
            expect.any(Object),
        );
    });

    it("ajoute le bearer lorsqu'une session existe", async () => {
        const token = createAccessToken();
        tokenStorage.write(token);
        fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

        await apiRequest("/private");

        const request = fetchMock.mock.calls[0][1];
        expect(new Headers(request?.headers).get("Authorization")).toBe(`Bearer ${token}`);
    });

    it("omet Authorization sans session", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

        await apiRequest("/public");

        const request = fetchMock.mock.calls[0][1];
        expect(new Headers(request?.headers).has("Authorization")).toBe(false);
    });

    it("parse une réponse JSON et une réponse sans body", async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse({ value: 42 }))
            .mockResolvedValueOnce(new Response(null, { status: 204 }));

        await expect(apiRequest<{ value: number }>("/json")).resolves.toEqual({ value: 42 });
        await expect(apiRequest("/empty")).resolves.toBeUndefined();
    });

    it("expose une erreur réseau publique", async () => {
        fetchMock.mockRejectedValue(new TypeError("socket details"));

        await expect(apiRequest("/offline")).rejects.toMatchObject({
            isNetworkError: true,
            message: "Impossible de joindre le service. Vérifiez votre connexion.",
        });
    });

    it("structure une erreur backend sans exposer de réponse brute", async () => {
        fetchMock.mockResolvedValue(jsonResponse({
            code: "INVALID_INPUT",
            detail: [{ loc: ["body", "email"], msg: "invalid" }],
        }, 422));

        await expect(apiRequest("/invalid")).rejects.toMatchObject({
            status: 422,
            code: "INVALID_INPUT",
            details: [{ loc: ["body", "email"], msg: "invalid" }],
            isNetworkError: false,
        });
    });

    it("un 401 nettoie la session et notifie une seule invalidation par réponse", async () => {
        const listener = vi.fn();
        const unsubscribe = httpEvents.onUnauthorized(listener);
        tokenStorage.write(createAccessToken());
        fetchMock.mockResolvedValue(jsonResponse({ detail: "Token expired" }, 401));

        await expect(apiRequest("/private")).rejects.toBeInstanceOf(ApiError);

        expect(tokenStorage.read()).toBeNull();
        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
    });

    it("un 403 conserve la session et notifie l'accès interdit", async () => {
        const listener = vi.fn();
        const unsubscribe = httpEvents.onForbidden(listener);
        const token = createAccessToken();
        tokenStorage.write(token);
        fetchMock.mockResolvedValue(jsonResponse({ detail: "Forbidden" }, 403));

        await expect(apiRequest("/restricted")).rejects.toMatchObject({ status: 403 });

        expect(tokenStorage.read()).toBe(token);
        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
    });

    it("retire les JWT et champs sensibles des erreurs publiques", async () => {
        const token = createAccessToken();
        fetchMock.mockResolvedValue(jsonResponse({
            detail: `Rejected ${token}`,
            access_token: token,
        }, 400));

        const error = await apiRequest("/unsafe").catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect(JSON.stringify(error)).not.toContain(token);
        expect((error as ApiError).message).toContain("[REDACTED]");
    });
});
