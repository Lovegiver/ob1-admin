import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/auth/authContext";
import { LoginPage } from "@/pages/LoginPage";

function renderLogin(overrides: Partial<AuthContextValue> = {}) {
    const value: AuthContextValue = {
        status: "ANONYMOUS",
        user: null,
        error: null,
        login: vi.fn().mockResolvedValue(undefined),
        logout: vi.fn(),
        clearError: vi.fn(),
        ...overrides,
    };

    render(
        <AuthContext.Provider value={value}>
            <MemoryRouter><LoginPage /></MemoryRouter>
        </AuthContext.Provider>,
    );

    return value;
}

describe("LoginPage", () => {
    it("associe les labels et marque les champs comme requis", () => {
        renderLogin();

        expect(screen.getByLabelText("Adresse e-mail")).toBeRequired();
        expect(screen.getByLabelText("Mot de passe")).toBeRequired();
    });

    it("valide les champs vides avec un message accessible", async () => {
        const value = renderLogin();
        await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

        expect(screen.getByRole("alert")).toHaveTextContent(/sont requis/i);
        expect(value.login).not.toHaveBeenCalled();
    });

    it("soumet les identifiants réellement saisis", async () => {
        const value = renderLogin();
        await userEvent.type(screen.getByLabelText("Adresse e-mail"), " Alice@Example.COM ");
        await userEvent.type(screen.getByLabelText("Mot de passe"), "password");
        await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

        expect(value.login).toHaveBeenCalledWith({
            email: "Alice@Example.COM",
            password: "password",
        });
    });

    it("empêche une double soumission", () => {
        const login = vi.fn(() => new Promise<void>(() => undefined));
        renderLogin({ login });
        fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
            target: { value: "alice@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Mot de passe"), {
            target: { value: "password" },
        });
        const form = screen.getByRole("button", { name: "Se connecter" }).closest("form")!;

        fireEvent.submit(form);
        fireEvent.submit(form);

        expect(login).toHaveBeenCalledTimes(1);
    });

    it("affiche une erreur de connexion et désactive le formulaire en cours", () => {
        renderLogin({ status: "AUTHENTICATING", error: "Invalid credentials" });

        expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
        expect(screen.getByRole("button", { name: "Connexion…" })).toBeDisabled();
        expect(screen.getByLabelText("Adresse e-mail")).toBeDisabled();
    });
});
