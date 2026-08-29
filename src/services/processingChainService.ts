import type { ProcessingChain } from "@/data/mockDashboard.ts";
import { apiRequest } from "@/services/apiClient";

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
    return apiRequest<ProcessingChain[]>("/frontend-test/processing-chains");
}
