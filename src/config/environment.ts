const DEVELOPMENT_API_URL = "http://127.0.0.1:8000";
const DEVELOPMENT_WEBSOCKET_BASE_URL = "ws://127.0.0.1:8000";

function normalizeUrl(
    rawValue: string | undefined,
    allowedProtocols: readonly string[],
    variableName: string,
    developmentDefault: string,
): string {
    const value = rawValue?.trim() || (import.meta.env.DEV ? developmentDefault : "");

    if (!value) {
        throw new Error(`${variableName} must be configured.`);
    }

    let url: URL;

    try {
        url = new URL(value);
    } catch {
        throw new Error(`${variableName} must be an absolute URL.`);
    }

    if (
        !allowedProtocols.includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
    ) {
        throw new Error(`${variableName} is invalid.`);
    }

    return url.toString().replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
    return normalizeUrl(
        import.meta.env.VITE_API_BASE_URL,
        ["http:", "https:"],
        "VITE_API_BASE_URL",
        DEVELOPMENT_API_URL,
    );
}

export function getWebSocketBaseUrl(): string {
    return normalizeUrl(
        import.meta.env.VITE_WS_BASE_URL,
        ["ws:", "wss:"],
        "VITE_WS_BASE_URL",
        DEVELOPMENT_WEBSOCKET_BASE_URL,
    );
}

export const developmentEnvironment = {
    apiBaseUrl: DEVELOPMENT_API_URL,
    webSocketBaseUrl: DEVELOPMENT_WEBSOCKET_BASE_URL,
} as const;
