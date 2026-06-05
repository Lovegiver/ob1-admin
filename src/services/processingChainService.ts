import type { ProcessingChain } from "@/data/mockDashboard.ts";

/**
 * Base URL of the OB1 backend API.
 *
 * During local development, Vite serves the frontend on port 5173
 * while FastAPI serves the backend on port 8000.
 */
const API_BASE_URL = "http://127.0.0.1:8000";

/**
 * Fetch processing chain runtime data from the OB1 backend.
 *
 * Returns the processing chains exposed by the temporary FastAPI
 * frontend integration endpoint.
 *
 * @returns Processing chains currently known by the backend.
 * @throws Error when the backend response is not successful.
 */
export async function fetchProcessingChains(): Promise<ProcessingChain[]> {
    const response = await fetch(
        `${API_BASE_URL}/frontend-test/processing-chains`,
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch processing chains: ${response.status} ${response.statusText}`,
        );
    }

    return response.json();
}