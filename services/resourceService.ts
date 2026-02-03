import { type Resource } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface GetResourcesParams {
    branch?: string;
    year?: number;
    type?: string;
    subject?: string;
}

export const getResources = async (params: GetResourcesParams = {}): Promise<Resource[]> => {
    const query = new URLSearchParams();
    if (params.branch) query.append('branch', params.branch);
    if (params.year) query.append('year', params.year.toString());
    if (params.type) query.append('type', params.type);
    if (params.subject) query.append('subject', params.subject);

    const response = await fetch(`${API_BASE_URL}/api/resources?${query.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch resources');
    }
    return response.json();
};

type AddResourcePayload = Omit<Resource, 'id' | 'uploadedBy' | 'createdAt'>;

export const addResource = async (payload: any): Promise<Resource> => {
    const token = localStorage.getItem('token');

    let body;
    let headers: any = {
        'Authorization': `Bearer ${token}`
    };

    if (payload.file) {
        // Use FormData for file upload
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
            if (payload[key] !== undefined) {
                formData.append(key, payload[key]);
            }
        });
        body = formData;
        // Don't set Content-Type, browser will set it with boundary
    } else {
        // Use JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(payload);
    }

    const response = await fetch(`${API_BASE_URL}/api/resources`, {
        method: 'POST',
        headers,
        body,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || errorData.error || 'Failed to add resource');
    }
    return response.json();
};
