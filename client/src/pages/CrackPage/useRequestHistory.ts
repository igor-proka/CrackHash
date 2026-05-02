import { useState } from 'react';
import { crackHashRequest, getTaskStatus } from '../../shared/api';
import { useLocalStorageState, usePolling } from '../../shared/lib';
import type { CrackHistoryItem } from '../../shared/types';

const isActiveTask = (task: CrackHistoryItem) => task.status === 'QUEUED' || task.status === 'IN_PROGRESS';

export function useRequestHistory() {
    const [tasks, setTasks] = useLocalStorageState<CrackHistoryItem[]>('crackhash_tasks', []);
    const [submitError, setSubmitError] = useState<string | null>(null);

    usePolling(async () => {
        const activeTasks = tasks.filter(isActiveTask);
        for (const task of activeTasks) {
            try {
                const response = await getTaskStatus(task.requestId);
                setTasks(previous => previous.map(item => (
                    item.requestId === task.requestId
                        ? { ...item, status: response.status, data: response.data }
                        : item
                )));
            } catch {
                // Временные polling ошибки не должны ломать локальную историю запросов.
            }
        }
    }, 2000);

    const submitTask = async (hash: string, maxLength: number): Promise<boolean> => {
        const normalizedHash = hash.trim().toLowerCase();
        setSubmitError(null);

        try {
            const response = await crackHashRequest(normalizedHash, maxLength);
            if (!response.requestId) {
                return false;
            }

            setTasks(previous => [
                {
                    requestId: response.requestId,
                    status: 'QUEUED',
                    data: null,
                    hash: normalizedHash,
                },
                ...previous,
            ]);
            return true;
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Failed to submit request.');
            return false;
        }
    };

    return {
        tasks,
        submitError,
        submitTask,
    };
}
