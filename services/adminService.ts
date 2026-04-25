import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getDashboardStats = async () => {
    const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getUsers = async (page = 1, search = '', status = '', role = '') => {
    const response = await axios.get(`${API_URL}/api/admin/users`, {
        params: { page, search, status, role },
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updateUser = async (id: string, updates: any) => {
    const response = await axios.patch(`${API_URL}/api/admin/users/${id}`, updates, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getFeatureFlags = async () => {
    const response = await axios.get(`${API_URL}/api/admin/features`, {
        headers: getAuthHeaders()
    });
    return response.data;
};
export const deleteUser = async (id: string) => {
    const response = await axios.delete(`${API_URL}/api/admin/users/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const createUser = async (userData: any) => {
    const response = await axios.post(`${API_URL}/api/admin/users`, userData, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getRooms = async () => {
    const response = await axios.get(`${API_URL}/api/admin/rooms`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deleteRoom = async (id: string) => {
    const response = await axios.delete(`${API_URL}/api/admin/rooms/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getSettings = async () => {
    const response = await axios.get(`${API_URL}/api/admin/settings`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updateSettings = async (settings: any) => {
    const response = await axios.post(`${API_URL}/api/admin/settings`, settings, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getAdminLogs = async () => {
    const response = await axios.get(`${API_URL}/api/admin/logs`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getCurriculum = async () => {
    const response = await axios.get(`${API_URL}/api/admin/curriculum`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const createCurriculum = async (data: any) => {
    const response = await axios.post(`${API_URL}/api/admin/curriculum`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updateCurriculum = async (id: string, data: any) => {
    const response = await axios.patch(`${API_URL}/api/admin/curriculum/${id}`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deleteCurriculum = async (id: string) => {
    const response = await axios.delete(`${API_URL}/api/admin/curriculum/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updateFeatureFlags = async (flags: any) => {
    const response = await axios.post(`${API_URL}/api/admin/features`, flags, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updateAIConfig = async (config: any) => {
    const response = await axios.post(`${API_URL}/api/admin/ai/config`, config, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deleteContent = async (type: string, id: string) => {
    const response = await axios.delete(`${API_URL}/api/admin/content/${type}/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getContent = async (type: string) => {
    const response = await axios.get(`${API_URL}/api/admin/content/${type}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const flagContent = async (type: string, id: string, reason?: string) => {
    const response = await axios.patch(`${API_URL}/api/admin/content/${type}/${id}/flag`, { reason }, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getReports = async () => {
    const response = await axios.get(`${API_URL}/api/admin/reports`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updateReport = async (id: string, updates: any) => {
    const response = await axios.patch(`${API_URL}/api/admin/reports/${id}`, updates, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deleteReport = async (id: string) => {
    const response = await axios.delete(`${API_URL}/api/admin/reports/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};
