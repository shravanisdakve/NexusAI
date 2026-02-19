const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface PlacementDashboardPayload {
    stats: Array<{ label: string; value: string; college?: string; color?: string }>;
    trends: Array<{ collegeName: string; avgPackage: number; highestPackage: number; year?: number }>;
    startups: Array<{ name: string; sector: string; stack: string }>;
    simulators: Array<{
        slug: string;
        name: string;
        description: string;
        durationMin: number;
        sections: string[];
        questionCount: number;
        href: string;
    }>;
}

export interface PlacementQuestion {
    id: number;
    section: string;
    text: string;
    options: string[];
}

export interface PlacementSimulatorPayload {
    simulator: {
        slug: string;
        name: string;
        description: string;
        durationMin: number;
        sections: string[];
        questionCount: number;
    };
    questions: PlacementQuestion[];
}

export interface PlacementResult {
    totalQuestions: number;
    attemptedQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    scorePercent: number;
    pace: 'Fast' | 'Balanced' | 'Slow';
    timeTakenSec: number;
    sectionBreakdown: Array<{
        section: string;
        total: number;
        attempted: number;
        correct: number;
        accuracy: number;
        coverageAccuracy: number;
    }>;
    focusAreas: string[];
    readinessBand: string;
    recommendation: string;
    simulatorSlug: string;
    simulatorName: string;
}

export const getPlacementDashboard = async (): Promise<PlacementDashboardPayload | null> => {
    try {
        const response = await fetch(`${API_URL}/api/placement/dashboard`);
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.data || null;
    } catch (error) {
        console.error('Failed fetching placement dashboard:', error);
        return null;
    }
};

export const getSimulatorQuestions = async (slug: string): Promise<PlacementSimulatorPayload | null> => {
    try {
        const response = await fetch(`${API_URL}/api/placement/simulators/${encodeURIComponent(slug)}/questions`);
        if (!response.ok) return null;
        const payload = await response.json();
        if (!payload?.success) return null;
        return {
            simulator: payload.simulator,
            questions: payload.questions || [],
        };
    } catch (error) {
        console.error('Failed fetching simulator questions:', error);
        return null;
    }
};

export const submitSimulator = async (
    slug: string,
    answers: Record<number, number>,
    timeTakenSec: number
): Promise<PlacementResult | null> => {
    try {
        const response = await fetch(`${API_URL}/api/placement/simulators/${encodeURIComponent(slug)}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ answers, timeTakenSec }),
        });

        if (!response.ok) return null;
        const payload = await response.json();
        if (!payload?.success) return null;
        return payload.result || null;
    } catch (error) {
        console.error('Failed submitting simulator:', error);
        return null;
    }
};

export const getRecentPlacementAttempts = async () => {
    try {
        const response = await fetch(`${API_URL}/api/placement/attempts/recent`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) return [];
        const payload = await response.json();
        return payload?.attempts || [];
    } catch (error) {
        console.error('Failed fetching placement attempts:', error);
        return [];
    }
};
