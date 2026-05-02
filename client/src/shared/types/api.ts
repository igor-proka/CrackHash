export type TaskStatus = 'QUEUED' | 'IN_PROGRESS' | 'READY' | 'ERROR';

export type TaskPartStatus =
    | 'PENDING_PUBLISH'
    | 'PUBLISH_FAILED'
    | 'PUBLISHED'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED';

export type KnownStatus = TaskStatus | TaskPartStatus;

export interface CrackResponse {
    requestId: string;
}

export interface StatusResponse {
    status: TaskStatus;
    data: string[] | null;
}

export interface CrackHistoryItem {
    requestId: string;
    status: TaskStatus;
    data: string[] | null;
    hash: string;
}

export interface MonitoringRequestSummary {
    requestId: string;
    hash: string;
    maxLength: number;
    status: TaskStatus;
    results: string[];
    partCount: number;
    completedParts: number;
    lastError: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    completedAt: string | null;
    totalDurationMs: number | null;
}

export interface MonitoringTaskPart {
    id: string;
    requestId: string;
    partNumber: number;
    partCount: number;
    status: TaskPartStatus;
    workerId: string | null;
    attemptId: string | null;
    results: string[];
    publishAttempts: number;
    lastError: string | null;
    processingError: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    publishedAt: string | null;
    startedAt: string | null;
    lastHeartbeatAt: string | null;
    completedAt: string | null;
    queueWaitMs: number | null;
    runningMs: number | null;
    totalDurationMs: number | null;
}

export interface MonitoringRequestDetails extends MonitoringRequestSummary {
    parts: MonitoringTaskPart[];
}

export interface MonitoringRequestsPage {
    items: MonitoringRequestSummary[];
    page: number;
    size: number;
    totalPages: number;
    totalItems: number;
    sort: MonitoringSort;
    status: TaskStatus | null;
}

export type MonitoringSort = 'newest' | 'oldest';
export type MonitoringStatusFilter = TaskStatus | 'ALL';

export interface MonitoringRequestQuery {
    page?: number;
    size?: number;
    sort?: MonitoringSort;
    status?: MonitoringStatusFilter;
}
