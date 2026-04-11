/**
 * Multi-Provider AI Service
 * Priority: NVIDIA -> Groq -> OpenRouter -> Gemini -> Ollama
 * 
 * This service provides a unified interface for AI text generation
 * across multiple providers to avoid rate limits and ensure reliability.
 */

const Groq = require('groq-sdk');

// Global Mumbai University Expert Persona
const MU_IDENTITY_PROMPT = `You are an expert AI Tutor specifically for MUMBAI UNIVERSITY (MU) engineering students. 
You provide extremely precise, exam-oriented answers following the MU syllabus (Rev-2019/2024 C-Scheme) and marking scheme. 
You MUST NOT use any emojis in your responses. Maintain a professional, academic, and formal tone at all times.
Priority Topics: MU Semester Exams, Internal Assessments (IA), and Practical Viva. 
Maintain a helpful, academic, and encouraging tone. Use MU-specific academic terms where appropriate.`;

// Provider Configuration
const PROVIDERS = {
    NVIDIA: 'nvidia',   // Primary
    GROQ: 'groq',       // Secondary
    OPENROUTER: 'openrouter', // Tertiary
    GEMINI: 'gemini',   // Fallback
    OLLAMA: 'ollama',   // Local fallback
    // Virtual providers (routed via OpenRouter)
    MISTRAL: 'mistral',
    TOGETHER: 'together'
};

// Feature-to-Provider mapping (Defaulting to NVIDIA as primary for almost everything)
const FEATURE_PROVIDER_MAP = {
    'chat': PROVIDERS.NVIDIA,           
    'studyBuddy': PROVIDERS.NVIDIA,     
    'quiz': PROVIDERS.NVIDIA,           
    'flashcards': PROVIDERS.NVIDIA,     
    'code': PROVIDERS.NVIDIA,           
    'summarize': PROVIDERS.NVIDIA,   
    'viva': PROVIDERS.NVIDIA,           
    'studyPlan': PROVIDERS.NVIDIA,    
    'projectIdeas': PROVIDERS.NVIDIA,
    'mockPaper': PROVIDERS.NVIDIA,    
    'goals': PROVIDERS.NVIDIA,          
    'mood': PROVIDERS.NVIDIA,           
    'suggestions': PROVIDERS.NVIDIA,  
};

// Model configurations for each provider
const MODEL_CONFIG = {
    [PROVIDERS.NVIDIA]: {
        default: 'meta/llama-3.1-70b-instruct',
        fast: 'meta/llama-3.1-8b-instruct',
        json: 'meta/llama-3.1-70b-instruct',
    },
    [PROVIDERS.GROQ]: {
        default: 'llama-3.3-70b-versatile',
        fast: 'llama-3.1-8b-instant',
        json: 'llama-3.3-70b-versatile',
    },
    [PROVIDERS.OPENROUTER]: {
        default: 'meta-llama/llama-3.1-8b-instruct:free',
        fast: 'meta-llama/llama-3.1-8b-instruct:free',
        json: 'meta-llama/llama-3.1-8b-instruct:free',
    },
    // Virtual configurations (routed via OpenRouter)
    [PROVIDERS.MISTRAL]: {
        default: 'mistralai/mistral-large-2411', 
        fast: 'mistralai/mistral-7b-instruct',
        json: 'mistralai/mistral-large-2411',
    },
    [PROVIDERS.TOGETHER]: {
        default: 'togethercomputer/llama-2-70b-chat',
        fast: 'togethercomputer/llama-2-7b-chat',
        json: 'togethercomputer/llama-2-70b-chat',
    },
    // Local configuration
    [PROVIDERS.OLLAMA]: {
        default: 'phi3',
        fast: 'phi3',
        json: 'phi3',
    }
};

// Initialize Groq client
let groqClient = null;
const getGroqClient = () => {
    if (!groqClient && process.env.GROQ_API_KEY) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
};

/**
 * Generate text using NVIDIA API (OpenAI Compatible) - PRIMARY
 */
async function generateWithNvidia(prompt, options = {}) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA API key not configured.');

    const model = options.model || (options.json
        ? MODEL_CONFIG[PROVIDERS.NVIDIA].json
        : (options.fast ? MODEL_CONFIG[PROVIDERS.NVIDIA].fast : MODEL_CONFIG[PROVIDERS.NVIDIA].default));

    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2048,
            response_format: options.json ? { type: 'json_object' } : undefined,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AIProvider] NVIDIA API Error: ${response.status} - ${errorText}`);
        let errorMessage = 'Unknown error';
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorJson.message || 'Unknown error';
        } catch (e) {
            errorMessage = errorText;
        }
        throw new Error(`NVIDIA error: ${errorMessage}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

/**
 * Stream text using NVIDIA API (OpenAI Compatible)
 */
async function* streamWithNvidia(prompt, options = {}) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA API key not configured.');

    const model = options.model || (options.fast
        ? MODEL_CONFIG[PROVIDERS.NVIDIA].fast
        : MODEL_CONFIG[PROVIDERS.NVIDIA].default);

    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2048,
            stream: true,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AIProvider] NVIDIA Stream API Error: ${response.status} - ${errorText}`);
        let errorMessage = 'Unknown error';
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorJson.message || 'Unknown error';
        } catch (e) {
            errorMessage = errorText;
        }
        throw new Error(`NVIDIA error: ${errorMessage}`);
    }

    if (!response.body) {
        throw new Error('NVIDIA stream response body is null');
    }

    const decoder = new TextDecoder();
    let lineBuffer = '';

    for await (const value of response.body) {
        const chunk = decoder.decode(value, { stream: true });
        lineBuffer += chunk;

        let boundary = lineBuffer.indexOf('\n');
        while (boundary !== -1) {
            const line = lineBuffer.slice(0, boundary).trim();
            lineBuffer = lineBuffer.slice(boundary + 1);

            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content;
                    if (content) yield content;
                } catch (e) {
                    console.warn('[AIProvider] Nvidia Stream JSON parse error:', e.message);
                }
            }
            boundary = lineBuffer.indexOf('\n');
        }
    }
}

/**
 * Generate text using Groq API
 */
async function generateWithGroq(prompt, options = {}) {
    const client = getGroqClient();
    if (!client) throw new Error('Groq client not initialized.');

    const model = options.json
        ? MODEL_CONFIG[PROVIDERS.GROQ].json
        : (options.fast ? MODEL_CONFIG[PROVIDERS.GROQ].fast : MODEL_CONFIG[PROVIDERS.GROQ].default);

    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    let attempts = 0;
    while (attempts < 3) {
        try {
            const completion = await client.chat.completions.create({
                model: model,
                messages: messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 2048,
                response_format: options.json ? { type: 'json_object' } : undefined,
            });
            return completion.choices[0]?.message?.content || '';
        } catch (error) {
            attempts++;
            if (error.status === 429 && attempts < 3) {
                await new Promise(r => setTimeout(r, attempts * 2000));
                continue;
            }
            throw error;
        }
    }
}

/**
 * Stream text using Groq API
 */
async function* streamWithGroq(prompt, options = {}) {
    const client = getGroqClient();
    if (!client) throw new Error('Groq client not initialized.');

    const model = options.fast ? MODEL_CONFIG[PROVIDERS.GROQ].fast : MODEL_CONFIG[PROVIDERS.GROQ].default;
    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const stream = await client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: true,
    });

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) yield content;
    }
}

/**
 * Perform OCR using Groq Vision Models
 */
async function extractTextWithGroqVision(base64Data, mimeType, prompt = "Extract all text from this image as accurately as possible.") {
    const client = getGroqClient();
    if (!client) throw new Error('Groq not configured');

    const completion = await client.chat.completions.create({
        model: "llama-3.2-11b-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: { url: `data:${mimeType};base64,${base64Data}` },
                    },
                ],
            },
        ],
        temperature: 0.1,
    });

    return completion.choices[0]?.message?.content || '';
}

/**
 * Generate text using OpenRouter API
 */
async function generateWithOpenRouter(prompt, options = {}) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OpenRouter API key not configured.');

    const model = options.model || (options.json
        ? MODEL_CONFIG[PROVIDERS.OPENROUTER].json
        : (options.fast ? MODEL_CONFIG[PROVIDERS.OPENROUTER].fast : MODEL_CONFIG[PROVIDERS.OPENROUTER].default));

    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
            'X-Title': 'NexusAI Study Platform',
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2048,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

/**
 * Stream text using OpenRouter API
 */
async function* streamWithOpenRouter(prompt, options = {}) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OpenRouter API key not configured.');

    const model = options.model || (options.fast ? MODEL_CONFIG[PROVIDERS.OPENROUTER].fast : MODEL_CONFIG[PROVIDERS.OPENROUTER].default);
    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
            'X-Title': 'NexusAI Study Platform',
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2048,
            stream: true,
        }),
    });

    if (!response.body) {
        throw new Error('OpenRouter stream response body is null');
    }

    const decoder = new TextDecoder();
    let lineBuffer = '';

    for await (const value of response.body) {
        const chunk = decoder.decode(value, { stream: true });
        lineBuffer += chunk;

        let boundary = lineBuffer.indexOf('\n');
        while (boundary !== -1) {
            const line = lineBuffer.slice(0, boundary).trim();
            lineBuffer = lineBuffer.slice(boundary + 1);

            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content;
                    if (content) yield content;
                } catch (e) {
                    console.warn('[AIProvider] OpenRouter Stream JSON parse error:', e.message);
                }
            }
            boundary = lineBuffer.indexOf('\n');
        }
    }
}

/**
 * Get the provider for a specific feature with PRIORITY logic
 */
function getProviderForFeature(feature) {
    const preferredProvider = FEATURE_PROVIDER_MAP[feature] || PROVIDERS.NVIDIA;

    // 1. Try NVIDIA (Primary)
    if (process.env.NVIDIA_API_KEY) return PROVIDERS.NVIDIA;
    
    // 2. Try GROQ (Secondary)
    if (process.env.GROQ_API_KEY) return PROVIDERS.GROQ;
    
    // 3. Try OpenRouter (Tertiary)
    if (process.env.OPENROUTER_API_KEY) return PROVIDERS.OPENROUTER;

    // 4. Final Fallback (Gemini)
    return PROVIDERS.GEMINI; 
}

/**
 * Generate text using Gemini API with Key Pool Support
 */
async function generateWithGemini(prompt, options = {}) {
    const getGeminiKeys = () => {
        const keys = [process.env.GEMINI_API_KEY];
        for (let i = 2; i <= 10; i++) {
            const key = process.env[`GEMINI_API_KEY_${i}`];
            if (key) keys.push(key);
        }
        return keys.filter(Boolean);
    };

    const keys = getGeminiKeys();
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    let lastError = null;

    for (const key of keys) {
        try {
            const genAI = new GoogleGenerativeAI(key);
            const modelName = options.model || (options.fast ? 'gemini-1.5-flash' : 'gemini-1.5-flash-latest');
            const model = genAI.getGenerativeModel({ model: modelName });
            const content = options.systemInstruction ? `${options.systemInstruction}\n\n${prompt}` : prompt;
            const result = await model.generateContent(content);
            return result.response.text();
        } catch (error) {
            lastError = error;
            if (error.message?.includes('429')) continue;
            break;
        }
    }
    throw lastError || new Error('Gemini generation failed');
}

/**
 * Stream text using Gemini API
 */
async function* streamWithGemini(prompt, options = {}) {
    const getGeminiKeys = () => {
        const keys = [process.env.GEMINI_API_KEY];
        for (let i = 2; i <= 10; i++) {
            const key = process.env[`GEMINI_API_KEY_${i}`];
            if (key) keys.push(key);
        }
        return keys.filter(Boolean);
    };

    const keys = getGeminiKeys();
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    let lastError = null;

    for (const key of keys) {
        try {
            const genAI = new GoogleGenerativeAI(key);
            const modelName = options.model || (options.fast ? 'gemini-1.5-flash' : 'gemini-1.5-flash-latest');
            const model = genAI.getGenerativeModel({ model: modelName });
            const content = options.systemInstruction ? `${options.systemInstruction}\n\n${prompt}` : prompt;
            const result = await model.generateContentStream(content);
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) yield text;
            }
            return; 
        } catch (error) {
            lastError = error;
            if (error.message?.includes('429')) continue;
            break;
        }
    }
    throw lastError || new Error('Gemini streaming failed');
}

/**
 * Generate text using local Ollama API
 */
async function generateWithOllama(prompt, options = {}) {
    const model = options.model || MODEL_CONFIG[PROVIDERS.OLLAMA].default;
    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false })
    });

    const data = await response.json();
    let text = data.message?.content || '';
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    if (options.json) text = text.replace(/```json|```/g, '').trim();
    return text;
}

/**
 * Stream text using local Ollama API
 */
async function* streamWithOllama(prompt, options = {}) {
    const model = options.model || MODEL_CONFIG[PROVIDERS.OLLAMA].default;
    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let lineBuffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        lineBuffer += chunk;

        let boundary = lineBuffer.indexOf('\n');
        while (boundary !== -1) {
            const line = lineBuffer.slice(0, boundary).trim();
            lineBuffer = lineBuffer.slice(boundary + 1);

            if (line) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.message?.content) yield parsed.message.content;
                } catch (e) {
                    // Ollama might send partial JSON if not careful, though usually it's line-delimited
                    console.warn('[AIProvider] Ollama Stream JSON parse error:', e.message);
                }
            }
            boundary = lineBuffer.indexOf('\n');
        }
    }
}

/**
 * Main unified generation function - IMPLEMENTS NVIDIA -> GROQ -> OPENROUTER -> GEMINI
 */
async function generate(prompt, options = {}) {
    // New Priority: Gemini -> Groq -> Nvidia -> OpenRouter -> Ollama (Local)
    // Gemini is our most reliable provider with a pool of 5 keys.
    const fallbackChain = [PROVIDERS.GEMINI, PROVIDERS.GROQ, PROVIDERS.NVIDIA, PROVIDERS.OPENROUTER, PROVIDERS.OLLAMA];
    let lastError = null;

    for (const provider of fallbackChain) {
        // Skip if provider key is missing
        if (provider === PROVIDERS.NVIDIA && !process.env.NVIDIA_API_KEY) continue;
        if (provider === PROVIDERS.GROQ && !process.env.GROQ_API_KEY) continue;
        if (provider === PROVIDERS.OPENROUTER && !process.env.OPENROUTER_API_KEY) continue;
        if (provider === PROVIDERS.GEMINI && !process.env.GEMINI_API_KEY) continue;
        
        // Skip Ollama in Cloud Run (Production)
        if (provider === PROVIDERS.OLLAMA && process.env.NODE_ENV === 'production') continue;

        console.log(`[AIProvider] Attempting ${provider} for feature: ${options.feature || 'default'}`);

        // Merge MU Identity with feature-specific instructions
        const mergedOptions = { ...options };
        mergedOptions.systemInstruction = options.systemInstruction 
            ? `${MU_IDENTITY_PROMPT}\n\nAdditional Task Context: ${options.systemInstruction}`
            : MU_IDENTITY_PROMPT;

        try {
            switch (provider) {
                case PROVIDERS.NVIDIA: return await generateWithNvidia(prompt, mergedOptions);
                case PROVIDERS.GROQ: return await generateWithGroq(prompt, mergedOptions);
                case PROVIDERS.OPENROUTER: return await generateWithOpenRouter(prompt, mergedOptions);
                case PROVIDERS.GEMINI: return await generateWithGemini(prompt, mergedOptions);
                case PROVIDERS.OLLAMA: return await generateWithOllama(prompt, mergedOptions);
            }
        } catch (error) {
            console.error(`[AIProvider] Error with ${provider}:`, error.message);
            lastError = error;
            // Immediate fallback on failure
            continue;
        }
    }
    throw new Error(`All AI providers in chain failed. Last error: ${lastError?.message}`);
}

/**
 * Main unified streaming function
 */
async function* stream(prompt, options = {}) {
    // New Priority: Gemini -> Groq -> Nvidia -> OpenRouter -> Ollama
    const fallbackChain = [PROVIDERS.GEMINI, PROVIDERS.GROQ, PROVIDERS.NVIDIA, PROVIDERS.OPENROUTER, PROVIDERS.OLLAMA];
    let lastError = null;
    let anySuccess = false;

    for (const provider of fallbackChain) {
        // Skip if provider key is missing
        if (provider === PROVIDERS.NVIDIA && !process.env.NVIDIA_API_KEY) continue;
        if (provider === PROVIDERS.GROQ && !process.env.GROQ_API_KEY) continue;
        if (provider === PROVIDERS.OPENROUTER && !process.env.OPENROUTER_API_KEY) continue;
        if (provider === PROVIDERS.GEMINI && !process.env.GEMINI_API_KEY) continue;

        if (provider === PROVIDERS.OLLAMA && process.env.NODE_ENV === 'production') continue;

        console.log(`[AIProvider] Attempting stream with ${provider} for feature: ${options.feature || 'default'}`);

        // Merge MU Identity with feature-specific instructions
        const mergedOptions = { ...options };
        mergedOptions.systemInstruction = options.systemInstruction 
            ? `${MU_IDENTITY_PROMPT}\n\nAdditional Task Context: ${options.systemInstruction}`
            : MU_IDENTITY_PROMPT;

        try {
            switch (provider) {
                case PROVIDERS.NVIDIA:
                    yield* streamWithNvidia(prompt, mergedOptions);
                    anySuccess = true;
                    return;
                case PROVIDERS.GROQ:
                    yield* streamWithGroq(prompt, mergedOptions);
                    anySuccess = true;
                    return;
                case PROVIDERS.OPENROUTER:
                    yield* streamWithOpenRouter(prompt, mergedOptions);
                    anySuccess = true;
                    return;
                case PROVIDERS.GEMINI:
                    yield* streamWithGemini(prompt, mergedOptions);
                    anySuccess = true;
                    return;
                case PROVIDERS.OLLAMA:
                    yield* streamWithOllama(prompt, mergedOptions);
                    anySuccess = true;
                    return;
            }
        } catch (error) {
            console.error(`[AIProvider] Stream error with ${provider}:`, error.message);
            lastError = error;
            // Fall through to next provider in chain
            continue;
        }
    }

    if (!anySuccess) {
        throw new Error(`All AI streaming providers in chain failed. Last error: ${lastError?.message}`);
    }
}

function getAvailableProviders() {
    const available = [];
    if (process.env.NVIDIA_API_KEY) available.push(PROVIDERS.NVIDIA);
    if (process.env.GROQ_API_KEY) available.push(PROVIDERS.GROQ);
    if (process.env.OPENROUTER_API_KEY) available.push(PROVIDERS.OPENROUTER);
    if (process.env.GEMINI_API_KEY) available.push(PROVIDERS.GEMINI);
    available.push(PROVIDERS.OLLAMA); 
    return available;
}

module.exports = {
    PROVIDERS,
    generate,
    stream,
    getProviderForFeature,
    getAvailableProviders,
    generateWithGemini,
    streamWithGemini,
    generateWithGroq,
    streamWithGroq,
    extractTextWithGroqVision,
    generateWithNvidia,
    streamWithNvidia,
    generateWithOpenRouter,
    streamWithOpenRouter,
    generateWithOllama,
    streamWithOllama,
};
