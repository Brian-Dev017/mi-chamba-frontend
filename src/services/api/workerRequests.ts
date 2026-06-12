import { requestDetail, workerJobs, workerReviews } from "../../data/mockData";
import type { Review, ServiceRequestDetail, WorkerJob } from "../../types/domain";

export async function getWorkerRequests(): Promise<WorkerJob[]> {
  return workerJobs;
}

export async function getRequestDetail(): Promise<ServiceRequestDetail> {
  return requestDetail;
}

export async function getWorkerReviews(): Promise<Review[]> {
  return workerReviews;
}
