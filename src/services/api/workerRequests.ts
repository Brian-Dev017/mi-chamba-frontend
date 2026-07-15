import { workerRequests, workerReviews } from "../../data/mockData";
import type { Review, ServiceRequestDetail, WorkerJob } from "../../types/domain";

export async function getWorkerRequests(): Promise<WorkerJob[]> {
  return workerRequests;
}

export async function getRequestDetail(jobId: string): Promise<ServiceRequestDetail | null> {
  return workerRequests.find((job) => job.id === jobId)?.detail ?? null;
}

export async function getWorkerReviews(): Promise<Review[]> {
  return workerReviews;
}
