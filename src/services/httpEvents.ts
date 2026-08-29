type HttpEventListener = () => void;

const unauthorizedListeners = new Set<HttpEventListener>();
const forbiddenListeners = new Set<HttpEventListener>();

function subscribe(
    listeners: Set<HttpEventListener>,
    listener: HttpEventListener,
): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function emit(listeners: Set<HttpEventListener>): void {
    listeners.forEach((listener) => listener());
}

export const httpEvents = {
    onUnauthorized(listener: HttpEventListener): () => void {
        return subscribe(unauthorizedListeners, listener);
    },
    onForbidden(listener: HttpEventListener): () => void {
        return subscribe(forbiddenListeners, listener);
    },
    unauthorized(): void {
        emit(unauthorizedListeners);
    },
    forbidden(): void {
        emit(forbiddenListeners);
    },
};
