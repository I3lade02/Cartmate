import type { WriteBatch } from "firebase/firestore";

export type OptimisticCommitStatus = "synced" | "queued";

const OFFLINE_QUEUE_TIMEOUT_MS = 1200;

export async function commitBatchOptimistically(
  batch: WriteBatch
): Promise<OptimisticCommitStatus> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const commitPromise = batch.commit();
  const timedCommit = commitPromise.then(() => "synced" as const);
  const queuedFallback = new Promise<"queued">((resolve) => {
    timeoutId = setTimeout(() => resolve("queued"), OFFLINE_QUEUE_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([timedCommit, queuedFallback]);

    if (result === "queued") {
      commitPromise.catch((error) => {
        console.log("Queued Firestore write failed", error);
      });
    }

    return result;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
