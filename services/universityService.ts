const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface UniversityCircular {
    id: string;
    title: string;
    category: string;
    urgent: boolean;
    publishedAt: string;
    dateLabel: string;
    link: string;
}

export interface UniversityScheduleItem {
    subject: string;
    date: string;
    dateLabel: string;
    time: string;
    status: string;
    daysRemaining: number | null;
}

export interface UniversityDashboardPayload {
    circulars: UniversityCircular[];
    schedule: UniversityScheduleItem[];
    forecast: {
        startDate: string;
        endDate: string;
        startDateLabel: string;
        endDateLabel: string;
        confidencePercent: number;
        basedOnDelays: number[];
    } | null;
    samarthStatus: {
        sessionActive: boolean;
        lastSyncedAt: string | null;
    };
    links: Array<{ name: string; href: string; kind: string }>;
}

export const getUniversityDashboard = async (params?: { query?: string; category?: string }) => {
    try {
        const searchParams = new URLSearchParams();
        if (params?.query) searchParams.set('query', params.query);
        if (params?.category) searchParams.set('category', params.category);

        const qs = searchParams.toString();
        const url = `${API_URL}/api/university/dashboard${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, { headers: getAuthHeaders() });
        if (!response.ok) return null;

        const payload = await response.json();
        return payload?.data as UniversityDashboardPayload;
    } catch (error) {
        console.error('Failed fetching university dashboard:', error);
        return null;
    }
};

export const syncUniversityPortal = async () => {
    try {
        const response = await fetch(`${API_URL}/api/university/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
        });
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.data as UniversityDashboardPayload;
    } catch (error) {
        console.error('Failed syncing university portal:', error);
        return null;
    }
};
