export function safeReturnPath(candidate: unknown): string {
    if (
        typeof candidate !== "string" ||
        !candidate.startsWith("/") ||
        candidate.startsWith("//") ||
        candidate.startsWith("/login") ||
        candidate.includes("\\")
    ) {
        return "/";
    }

    return candidate;
}
