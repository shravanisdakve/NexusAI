import axios from 'axios';
import { Resource } from '../types';
import { VideoResource, RESOURCE_CATEGORIES } from '../pages/LearningResources';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'resource' | 'event' | 'achievement';
    timestamp: Date;
    read: boolean;
    link?: string;
}

export const getRecommendedResources = (userBranch: string): VideoResource[] => {
    const recommendations: VideoResource[] = [];
    
    // Logic to pick high-priority videos across categories
    RESOURCE_CATEGORIES.forEach(cat => {
        const branchRelevant = cat.branches.includes('all') || cat.branches.includes(userBranch);
        if (branchRelevant) {
            const highValue = cat.videos.filter(v => v.recommended).slice(0, 1);
            recommendations.push(...highValue);
        }
    });

    return recommendations.slice(0, 4); // Limit to 4 cards
};

/**
 * Returns a selection of videos not already in the recommended list.
 * These are surfaced as "discovery" content — not falsely labeled as "new".
 */
export const getDiscoveryVideos = (userBranch: string): VideoResource[] => {
    const results: VideoResource[] = [];
    RESOURCE_CATEGORIES.forEach(cat => {
        const branchRelevant =
            cat.branches.includes('all') || cat.branches.includes(userBranch);
        if (branchRelevant) {
            // Pick first non-recommended video from each relevant category
            const nonRecommended = cat.videos.find(v => !v.recommended);
            if (nonRecommended) results.push(nonRecommended);
        }
    });
    return results.slice(0, 4);
};

/** @deprecated use getDiscoveryVideos instead */
export const getNewArrivals = (userBranch = ''): VideoResource[] => getDiscoveryVideos(userBranch);

export const addResource = async (data: {
    title: string;
    description?: string;
    type: string;
    branch: string;
    year: number;
    subject: string;
    link?: string;
    file?: File | null;
}): Promise<Resource> => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('type', data.type);
    formData.append('branch', data.branch);
    formData.append('year', data.year.toString());
    formData.append('subject', data.subject);
    if (data.link) formData.append('link', data.link);
    if (data.file) formData.append('file', data.file);

    const response = await axios.post(`${API_URL}/api/resources`, formData, {
        headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
        }
    });

    return response.data;
};

export const getResources = async (filters: { 
    branch?: string; 
    year?: number; 
    type?: string; 
    subject?: string;
}): Promise<any> => {
    // 1. Check if we're looking for YouTube video resources (Discovery logic)
    if (filters.subject && !filters.branch && !filters.year) {
        const subjectLower = filters.subject.toLowerCase();
        const category = RESOURCE_CATEGORIES.find(cat => 
            cat.id.toLowerCase() === subjectLower || 
            cat.label.toLowerCase().includes(subjectLower)
        );
        return category ? category.videos : [];
    }

    // 2. Otherwise, fetch from the general backend Resource library
    try {
        const response = await axios.get(`${API_URL}/api/resources`, {
            params: filters,
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching resources from backend:', error);
        return [];
    }
};

