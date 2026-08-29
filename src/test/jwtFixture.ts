export function createAccessToken(expirationSeconds = Date.now() / 1000 + 3600): string {
    const encode = (value: object) => btoa(JSON.stringify(value))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
        typ: "access",
        sub: "1",
        exp: Math.floor(expirationSeconds),
    })}.fixture-signature`;
}
