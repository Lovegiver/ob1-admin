import { describe, expect, it } from "vitest";

import { validateMemberDraft, validateProjectDraft } from "@/project/projectValidation";

describe("validation Project et membre", () => {
    it("normalise les espaces sans neutraliser du texte utilisateur inerte", () => {
        expect(validateProjectDraft("  <script>alert(1)</script>  ", "  ' OR 1=1 --  ")).toEqual({
            value: { name: "<script>alert(1)</script>", description: "' OR 1=1 --" },
        });
    });

    it("refuse vide, longueurs excessives et caractères de contrôle", () => {
        expect(validateProjectDraft("   ", "").error).toMatch(/requis/);
        expect(validateProjectDraft("x".repeat(101), "").error).toMatch(/100/);
        expect(validateProjectDraft("valid", "x".repeat(256)).error).toMatch(/255/);
        expect(validateProjectDraft("bad\u0000name", "").error).toMatch(/contrôle/);
    });

    it("normalise l'e-mail et impose un rôle autorisé", () => {
        expect(validateMemberDraft(" Alice@Example.COM ", "DEVELOPER")).toEqual({
            value: { email: "alice@example.com", role: "DEVELOPER" },
        });
        expect(validateMemberDraft("not-an-email", "VIEWER").error).toMatch(/e-mail valide/);
        expect(validateMemberDraft("alice@example.com", "ROOT").error).toMatch(/rôle/);
    });
});
