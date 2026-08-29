import { describe, expect, it } from "vitest";

import {
    isUsableAccessToken,
    tokenStorage,
    tokenStorageKey,
} from "@/auth/tokenStorage";
import { createAccessToken } from "@/test/jwtFixture";

describe("tokenStorage", () => {
    it("conserve uniquement un bearer d'accès valide dans sessionStorage", () => {
        const token = createAccessToken();

        expect(tokenStorage.write(token)).toBe(true);
        expect(tokenStorage.read()).toBe(token);
        expect(sessionStorage.getItem(tokenStorageKey)).toBe(token);
        expect(localStorage.length).toBe(0);
    });

    it("rejette et nettoie une session expirée ou invalide", () => {
        const expired = createAccessToken(Date.now() / 1000 - 1);
        sessionStorage.setItem(tokenStorageKey, expired);

        expect(isUsableAccessToken("not-a-jwt")).toBe(false);
        expect(tokenStorage.read()).toBeNull();
        expect(sessionStorage.getItem(tokenStorageKey)).toBeNull();
        expect(tokenStorage.write("arbitrary-value")).toBe(false);
    });

    it("nettoie explicitement le token à la déconnexion", () => {
        tokenStorage.write(createAccessToken());
        tokenStorage.clear();

        expect(tokenStorage.read()).toBeNull();
    });

    it("ignore un ancien JWT placé dans localStorage", () => {
        localStorage.setItem("access_token", createAccessToken());

        expect(tokenStorage.read()).toBeNull();
        expect(sessionStorage.getItem(tokenStorageKey)).toBeNull();
    });
});
