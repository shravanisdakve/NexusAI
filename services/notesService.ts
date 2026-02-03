import { type Note, type Flashcard } from '../types';
import { extractTextFromFile, summarizeAudioFromBase64 } from './geminiService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// Get auth token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
                return reject(new Error("Invalid file data for base64 conversion"));
            }
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

// ==================== NOTES ====================

export const getNotes = async (courseId: string): Promise<Note[]> => {
    console.log(`[notesService] Fetching notes for course ${courseId} from backend`);
    try {
        const response = await axios.get(`${API_URL}/api/notes/${courseId}`, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            console.log(`[notesService] Successfully fetched ${response.data.notes.length} notes`);
            return response.data.notes;
        }

        console.error("[notesService] API returned success: false");
        return [];
    } catch (error) {
        console.error("[notesService] Error fetching notes:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            console.error("[notesService] Unauthorized - user may not be logged in");
        }
        return [];
    }
};

export const addTextNote = async (courseId: string, title: string, content: string): Promise<Note | null> => {
    console.log(`[notesService] Adding text note "${title}" to course ${courseId}`);
    try {
        const response = await axios.post(
            `${API_URL}/api/notes/${courseId}/text`,
            { title, content },
            { headers: getAuthHeaders() }
        );

        if (response.data.success) {
            console.log("[notesService] Successfully added text note");
            return response.data.note;
        }

        throw new Error(response.data.message || "Failed to add note");
    } catch (error) {
        console.error("[notesService] Error adding text note:", error);
        throw error;
    }
};

export const uploadNoteFile = async (courseId: string, title: string, file: File): Promise<Note | null> => {
    console.log(`[notesService] Uploading file "${file.name}" to course ${courseId}`);

    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title || file.name);

        // Upload file to backend
        const response = await axios.post(
            `${API_URL}/api/notes/${courseId}/file`,
            formData,
            {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        if (response.data.success) {
            console.log("[notesService] Successfully uploaded file");
            const note = response.data.note;

            // Extract text in the background and update the note
            extractTextInBackground(courseId, note.id, file);

            return note;
        }

        throw new Error(response.data.message || "Failed to upload file");
    } catch (error) {
        console.error("[notesService] Error uploading file:", error);
        throw error;
    }
};

// Background text extraction
const extractTextInBackground = async (courseId: string, noteId: string, file: File) => {
    try {
        console.log(`[notesService] Extracting text from ${file.name} in background...`);
        const base64Data = await fileToBase64(file);

        let extractedContent = "";

        // Check if it's an audio file
        if (file.type.startsWith('audio/')) {
            console.log(`[notesService] Summarizing audio file ${file.name}...`);
            extractedContent = await summarizeAudioFromBase64(base64Data, file.type);
        } else {
            console.log(`[notesService] Extracting text from document ${file.name}...`);
            extractedContent = await extractTextFromFile(base64Data, file.type);
        }

        console.log(`[notesService] Extracted ${extractedContent.length} characters, updating note...`);

        // Update the note with extracted content
        await updateNoteContent(courseId, noteId, extractedContent);

        console.log(`[notesService] Successfully updated note ${noteId} with extracted text`);
    } catch (error) {
        console.error(`[notesService] Failed to extract text from ${file.name}:`, error);
    }
};

export const updateNoteContent = async (courseId: string, noteId: string, newContent: string): Promise<void> => {
    console.log(`[notesService] Updating content for note ${noteId}`);
    try {
        await axios.put(
            `${API_URL}/api/notes/${courseId}/${noteId}`,
            { content: newContent },
            { headers: getAuthHeaders() }
        );
        console.log("[notesService] Successfully updated note content");
    } catch (error) {
        console.error("[notesService] Error updating note:", error);
        throw error;
    }
};

export const deleteNote = async (courseId: string, note: Note): Promise<void> => {
    console.log(`[notesService] Deleting note ${note.id}`);
    try {
        await axios.delete(`${API_URL}/api/notes/${courseId}/${note.id}`, {
            headers: getAuthHeaders()
        });
        console.log("[notesService] Successfully deleted note");
    } catch (error) {
        console.error("[notesService] Error deleting note:", error);
        throw error;
    }
};

// ==================== FLASHCARDS ====================

export const getFlashcards = async (courseId: string): Promise<Flashcard[]> => {
    console.log(`[notesService] Fetching flashcards for course ${courseId}`);
    try {
        const response = await axios.get(`${API_URL}/api/notes/${courseId}/flashcards`, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            console.log(`[notesService] Successfully fetched ${response.data.flashcards.length} flashcards`);
            return response.data.flashcards;
        }

        return [];
    } catch (error) {
        console.error("[notesService] Error fetching flashcards:", error);
        return [];
    }
};

export const addFlashcards = async (courseId: string, flashcards: Flashcard[]): Promise<void> => {
    console.log(`[notesService] Adding ${flashcards.length} flashcards to course ${courseId}`);
    try {
        await axios.post(
            `${API_URL}/api/notes/${courseId}/flashcards`,
            { flashcards },
            { headers: getAuthHeaders() }
        );
        console.log("[notesService] Successfully added flashcards");
    } catch (error) {
        console.error("[notesService] Error adding flashcards:", error);
        throw error;
    }
};

export const updateFlashcard = async (courseId: string, flashcardId: string, updates: Partial<Flashcard>): Promise<void> => {
    console.log(`[notesService] Updating flashcard ${flashcardId}`);
    try {
        await axios.put(
            `${API_URL}/api/notes/${courseId}/flashcards/${flashcardId}`,
            updates,
            { headers: getAuthHeaders() }
        );
        console.log("[notesService] Successfully updated flashcard");
    } catch (error) {
        console.error("[notesService] Error updating flashcard:", error);
        throw error;
    }
};

export const deleteFlashcard = async (courseId: string, flashcardId: string): Promise<void> => {
    console.log(`[notesService] Deleting flashcard ${flashcardId}`);
    try {
        await axios.delete(`${API_URL}/api/notes/${courseId}/flashcards/${flashcardId}`, {
            headers: getAuthHeaders()
        });
        console.log("[notesService] Successfully deleted flashcard");
    } catch (error) {
        console.error("[notesService] Error deleting flashcard:", error);
        throw error;
    }
};
