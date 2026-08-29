const ACCESS_TOKEN_KEY = "ob1.auth.access-token";

interface JwtPayload {
    exp?: unknown;
    typ?: unknown;
}

function decodePayload(token: string): JwtPayload | null {
    const parts = token.split(".");

    if (parts.length !== 3) {
        return null;
    }

    try {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        return JSON.parse(atob(padded)) as JwtPayload;
    } catch {
        return null;
    }
}

export function isUsableAccessToken(
    token: string,
    nowMilliseconds = Date.now(),
): boolean {
    const payload = decodePayload(token);

    return Boolean(
        payload &&
        payload.typ === "access" &&
        typeof payload.exp === "number" &&
        payload.exp * 1000 > nowMilliseconds,
    );
}

export const tokenStorage = {
    read(): string | null {
        const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);

        if (!token || !isUsableAccessToken(token)) {
            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
            return null;
        }

        return token;
    },

    write(token: string): boolean {
        if (!isUsableAccessToken(token)) {
            return false;
        }

        sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
        return true;
    },

    clear(): void {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    },
};

export const tokenStorageKey = ACCESS_TOKEN_KEY;
