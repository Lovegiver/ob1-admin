import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

describe("pages de statut", () => {
    it("présente un accès interdit sans annoncer de déconnexion", () => {
        render(<MemoryRouter><ForbiddenPage /></MemoryRouter>);

        expect(screen.getByRole("heading", { name: "Accès interdit" })).toBeInTheDocument();
        expect(screen.getByText(/session reste active/i)).toBeInTheDocument();
    });

    it("présente une route inconnue", () => {
        render(
            <MemoryRouter initialEntries={["/missing"]}>
                <Routes>
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByRole("heading", { name: "Page introuvable" })).toBeInTheDocument();
    });
});
