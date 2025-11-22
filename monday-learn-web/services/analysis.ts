import { api } from '../utils/api';

export interface DailyActivity {
    date: string;
    question_count: number;
    time_spent_ms: number;
}

export interface ProgressDistribution {
    name: string;
    value: number;
}

export interface ForgettingCurvePoint {
    interval: string;
    retention: number;
}

export const analysisService = {
    getDailyActivity: async (days: number = 7): Promise<DailyActivity[]> => {
        const response = await api.get<DailyActivity[]>(`/analysis/daily-activity?days=${days}`);
        return response;
    },

    getProgressDistribution: async (): Promise<ProgressDistribution[]> => {
        const response = await api.get<ProgressDistribution[]>('/analysis/progress-distribution');
        return response;
    },

    getForgettingCurve: async (): Promise<ForgettingCurvePoint[]> => {
        const response = await api.get<ForgettingCurvePoint[]>('/analysis/forgetting-curve');
        return response;
    }
};
