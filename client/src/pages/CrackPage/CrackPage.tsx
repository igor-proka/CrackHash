import type { AppTranslations } from '../../shared/types';
import { CrackForm } from './CrackForm';
import { ManualStatusCheck } from './ManualStatusCheck';
import { Md5Generator } from './Md5Generator';
import { RequestHistory } from './RequestHistory';
import { useRequestHistory } from './useRequestHistory';

interface CrackPageProps {
    t: AppTranslations;
}

export function CrackPage({ t }: CrackPageProps) {
    const { tasks, submitError, submitTask } = useRequestHistory();

    return (
        <>
            <div className="panels">
                <CrackForm text={t.crack} submitError={submitError} onSubmit={submitTask} />
                <ManualStatusCheck t={t} />
                <Md5Generator text={t.crack} />
            </div>

            <RequestHistory t={t} tasks={tasks} />
        </>
    );
}
