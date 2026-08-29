import type {RuntimeEvent} from "@/components/runtime/RuntimeEvent.ts";
import { getWebSocketBaseUrl } from "@/config/environment";

interface RuntimeEventStreamOptions {
    onMessage: (message: RuntimeEvent) => void;
    onOpen?: () => void;
    onClose?: () => void;
    reconnectDelayMs?: number;
}

/**
 * Opens the OB1 runtime WebSocket stream with automatic reconnection.
 *
 * @param options Runtime stream callbacks and reconnection options.
 * @returns Cleanup function that permanently closes the stream.
 */
export function connectRuntimeEventStream({
                                              onMessage,
                                              onOpen,
                                              onClose,
                                              reconnectDelayMs = 3000,
                                          }: RuntimeEventStreamOptions): () => void {
    let websocket: WebSocket | null = null;
    let shouldReconnect = true;
    let reconnectTimer: number | undefined;

    function connect() {
        websocket = new WebSocket(`${getWebSocketBaseUrl()}/runtime/events`);

        websocket.onopen = () => {
            onOpen?.();
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data) as RuntimeEvent;
            onMessage(data);
        };

        websocket.onclose = () => {
            onClose?.();

            if (shouldReconnect) {
                reconnectTimer = window.setTimeout(connect, reconnectDelayMs);
            }
        };

        websocket.onerror = () => {
            websocket?.close();
        };
    }

    connect();

    return () => {
        shouldReconnect = false;

        if (reconnectTimer !== undefined) {
            window.clearTimeout(reconnectTimer);
        }

        websocket?.close();
    };
}
