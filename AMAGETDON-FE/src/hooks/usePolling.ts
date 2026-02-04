import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
    interval: number;
    enabled?: boolean;
    immediate?: boolean;
}

/**
 * 일정 간격으로 콜백 함수를 실행하는 폴링 훅
 * @param callback - 실행할 콜백 함수
 * @param options - 폴링 옵션
 */
export const usePolling = (
    callback: () => void | Promise<void>,
    { interval, enabled = true, immediate = false }: UsePollingOptions
) => {
    const savedCallback = useRef(callback);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const start = useCallback(() => {
        stop();
        if (enabled && interval > 0) {
            intervalRef.current = setInterval(() => {
                savedCallback.current();
            }, interval);
        }
    }, [enabled, interval, stop]);

    useEffect(() => {
        if (!enabled) {
            stop();
            return;
        }

        if (immediate) {
            savedCallback.current();
        }

        start();

        return stop;
    }, [enabled, immediate, start, stop]);

    return { start, stop };
};
