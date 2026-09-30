import { useEffect, useRef, useState } from "react";
import {
  deleteNotification,
  getStateInstance,
  receiveNotification,
} from "../../shared/api/greenApiClient.js";
import {
  POLL_ERROR_DELAY_MS,
  POLL_RECEIVE_TIMEOUT_SECONDS,
  RECEIPT_CACHE_LIMIT,
} from "../../shared/config/constants.js";

function rememberReceipt(processedReceipts, id) {
  processedReceipts.add(id);
  if (processedReceipts.size > RECEIPT_CACHE_LIMIT) {
    const oldest = processedReceipts.values().next().value;
    processedReceipts.delete(oldest);
  }
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function explainPollError(message) {
  if (/webhook/i.test(message || "")) {
    return "Входящие не приходят: в личном кабинете очистите webhook URL и включите уведомления о входящих сообщениях. После сохранения подождите около минуты.";
  }
  return message || "Не удалось получить входящие сообщения";
}

export const useNotificationPolling = ({ credentials, onNotification, onInstanceState }) => {
  const [pollError, setPollError] = useState("");
  const onNotificationRef = useRef(onNotification);
  const onInstanceStateRef = useRef(onInstanceState);
  const instanceId = credentials?.idInstance ?? null;
  const [trackedInstanceId, setTrackedInstanceId] = useState(instanceId);

  if (trackedInstanceId !== instanceId) {
    setTrackedInstanceId(instanceId);
    setPollError("");
  }

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    onInstanceStateRef.current = onInstanceState;
  }, [onInstanceState]);

  useEffect(() => {
    if (!credentials) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    getStateInstance(credentials, controller.signal)
      .then((data) => {
        if (!cancelled) onInstanceStateRef.current(data?.stateInstance || "");
      })
      .catch((error) => {
        if (cancelled || error?.name === "AbortError") return;
        setPollError(error.message);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [credentials]);

  useEffect(() => {
    if (!credentials) return undefined;
    const controller = new AbortController();
    const processedReceipts = new Set();
    let stopped = false;

    const loop = async () => {
      while (!stopped) {
        try {
          const notification = await receiveNotification(
            credentials,
            POLL_RECEIVE_TIMEOUT_SECONDS,
            controller.signal,
          );
          if (stopped) return;
          setPollError("");
          if (!notification?.receiptId) continue;

          if (!processedReceipts.has(notification.receiptId)) {
            rememberReceipt(processedReceipts, notification.receiptId);
            try {
              onNotificationRef.current(notification);
            } catch (error) {
              console.error(error);
            }
          }
          await deleteNotification(credentials, notification.receiptId, controller.signal);
        } catch (error) {
          if (error?.name === "AbortError" || stopped) return;
          setPollError(explainPollError(error.message));
          try {
            await wait(POLL_ERROR_DELAY_MS, controller.signal);
          } catch {
            return;
          }
        }
      }
    };

    loop();
    return () => {
      stopped = true;
      controller.abort();
    };
  }, [credentials]);

  return { pollError };
};
