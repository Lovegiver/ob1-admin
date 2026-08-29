import { useMemo, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    MemoryRouter,
    Route,
    Routes,
} from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue, type AuthStatus } from "@/auth/authContext";
import { LoginPage } from "@/pages/LoginPage";
import { RequireAuth } from "@/router/RequireAuth";

function valueFor(status: AuthStatus): AuthContextValue {
    return {
        status,
        user: status === "AUTHENTICATED"
            ? { id: 1, email: "alice@example.com", role: "USER" }
            : null,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
    };
}

function ProtectedHarness({ status, initialPath = "/private" }: {
    status: AuthStatus;
    initialPath?: string;
}) {
    return (
        <AuthContext.Provider value={valueFor(status)}>
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route path="/login" element={<p>Page connexion</p>} />
                    <Route path="/private" element={(
                        <RequireAuth><p>Contenu protégé</p></RequireAuth>
                    )} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}

function LoginFlowHarness() {
    const [status, setStatus] = useState<AuthStatus>("ANONYMOUS");
    const value = useMemo<AuthContextValue>(() => ({
        status,
        user: status === "AUTHENTICATED"
            ? { id: 1, email: "alice@example.com", role: "USER" }
            : null,
        error: null,
        login: async () => setStatus("AUTHENTICATED"),
        logout: () => setStatus("ANONYMOUS"),
        clearError: () => undefined,
    }), [status]);

    return (
        <AuthContext.Provider value={value}>
            <MemoryRouter initialEntries={["/private?tab=activity"]}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/private" element={(
                        <RequireAuth><p>Destination restaurée</p></RequireAuth>
                    )} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}

describe("RequireAuth", () => {
    it("masque le contenu protégé pendant la restauration", () => {
        render(<ProtectedHarness status="RESTORING" />);

        expect(screen.getByText("Vérification de la session…")).toBeInTheDocument();
        expect(screen.queryByText("Contenu protégé")).not.toBeInTheDocument();
    });

    it("redirige l'utilisateur anonyme vers la connexion sans boucle", () => {
        render(<ProtectedHarness status="ANONYMOUS" />);

        expect(screen.getByText("Page connexion")).toBeInTheDocument();
        expect(screen.queryByText("Contenu protégé")).not.toBeInTheDocument();
    });

    it("autorise l'utilisateur authentifié", () => {
        render(<ProtectedHarness status="AUTHENTICATED" />);

        expect(screen.getByText("Contenu protégé")).toBeInTheDocument();
    });

    it("revient à la destination demandée après connexion", async () => {
        render(<LoginFlowHarness />);

        await userEvent.type(screen.getByLabelText("Adresse e-mail"), "alice@example.com");
        await userEvent.type(screen.getByLabelText("Mot de passe"), "password");
        await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

        expect(await screen.findByText("Destination restaurée")).toBeInTheDocument();
    });
});
