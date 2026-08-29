import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/auth/AuthProvider";
import { tokenStorage } from "@/auth/tokenStorage";
import { useAuth } from "@/auth/useAuth";
import { ApiError } from "@/services/apiClient";
import { authenticate, fetchCurrentUser } from "@/services/authService";
import { createAccessToken } from "@/test/jwtFixture";

vi.mock("@/services/authService", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/authService")>();
    return {
        ...actual,
        authenticate: vi.fn(),
        fetchCurrentUser: vi.fn(),
    };
});

const authenticateMock = vi.mocked(authenticate);
const fetchCurrentUserMock = vi.mocked(fetchCurrentUser);
const currentUser = { id: 7, email: "alice@example.com", role: "USER" };

function Probe() {
    const auth = useAuth();

    return (
        <div>
            <span data-testid="status">{auth.status}</span>
            <span data-testid="user">{auth.user?.email ?? "none"}</span>
            <span data-testid="error">{auth.error ?? "none"}</span>
            <button onClick={() => void auth.login({
                email: "alice@example.com",
                password: "correct-password",
            }).catch(() => undefined)}>login</button>
            <button onClick={auth.logout}>logout</button>
        </div>
    );
}

describe("AuthProvider", () => {
    beforeEach(() => {
        authenticateMock.mockReset();
        fetchCurrentUserMock.mockReset();
    });

    it("démarre anonyme lorsqu'aucune session n'existe", () => {
        render(<AuthProvider><Probe /></AuthProvider>);

        expect(screen.getByTestId("status")).toHaveTextContent("ANONYMOUS");
        expect(fetchCurrentUserMock).not.toHaveBeenCalled();
    });

    it("restaure une session valide avec l'identité réelle", async () => {
        tokenStorage.write(createAccessToken());
        fetchCurrentUserMock.mockResolvedValue(currentUser);

        render(<AuthProvider><Probe /></AuthProvider>);

        expect(screen.getByTestId("status")).toHaveTextContent("RESTORING");
        await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("AUTHENTICATED"));
        expect(screen.getByTestId("user")).toHaveTextContent("alice@example.com");
    });

    it("rejette une session expirée sans appeler le backend", () => {
        sessionStorage.setItem("ob1.auth.access-token", createAccessToken(Date.now() / 1000 - 10));

        render(<AuthProvider><Probe /></AuthProvider>);

        expect(screen.getByTestId("status")).toHaveTextContent("ANONYMOUS");
        expect(sessionStorage.length).toBe(0);
        expect(fetchCurrentUserMock).not.toHaveBeenCalled();
    });

    it("établit une session seulement après login et /auth/me réussis", async () => {
        const token = createAccessToken();
        authenticateMock.mockResolvedValue({ access_token: token, token_type: "bearer" });
        fetchCurrentUserMock.mockResolvedValue(currentUser);

        render(<AuthProvider><Probe /></AuthProvider>);
        await userEvent.click(screen.getByRole("button", { name: "login" }));

        await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("AUTHENTICATED"));
        expect(tokenStorage.read()).toBe(token);
        expect(screen.getByTestId("user")).toHaveTextContent(currentUser.email);
    });

    it("reste anonyme et présente une erreur publique si le login échoue", async () => {
        authenticateMock.mockRejectedValue(new ApiError({
            status: 401,
            message: "Invalid credentials",
            isNetworkError: false,
        }));

        render(<AuthProvider><Probe /></AuthProvider>);
        await userEvent.click(screen.getByRole("button", { name: "login" }));

        await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("Invalid credentials"));
        expect(screen.getByTestId("status")).toHaveTextContent("ANONYMOUS");
        expect(tokenStorage.read()).toBeNull();
    });

    it("déconnecte, oublie l'utilisateur et nettoie le token", async () => {
        tokenStorage.write(createAccessToken());
        fetchCurrentUserMock.mockResolvedValue(currentUser);

        render(<AuthProvider><Probe /></AuthProvider>);
        await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("AUTHENTICATED"));
        await userEvent.click(screen.getByRole("button", { name: "logout" }));

        expect(screen.getByTestId("status")).toHaveTextContent("ANONYMOUS");
        expect(screen.getByTestId("user")).toHaveTextContent("none");
        expect(tokenStorage.read()).toBeNull();
    });
});
