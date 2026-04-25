/**
 * Multi-Provider AI Service
 * Priority: GEMINI ONLY (Cloud-Powered)
 * 
 * Configured for Gemini API only. Local fallbacks removed.
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

// Model configurations for each provider
const MODEL_CONFIG = {
    [PROVIDERS.NVIDIA]: {
        default: 'meta/llama-3.1-70b-instruct',
        fast: 'meta/llama-3.1-8b-instruct',
        json: 'meta/llama-3.1-8b-instruct', // Faster for JSON
    },
    [PROVIDERS.GROQ]: {
        default: 'llama-3.3-70b-versatile',
        fast: 'llama-3.1-8b-instant',
        json: 'llama-3.1-8b-instant', // Faster for JSON
    },
    [PROVIDERS.OPENROUTER]: {
        default: 'meta-llama/llama-3.1-8b-instruct',
        fast: 'meta-llama/llama-3.1-8b-instruct',
        json: 'meta-llama/llama-3.1-8b-instruct',
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
    },
    [PROVIDERS.GEMINI]: {
        default: 'gemini-1.5-flash',
        fast: 'gemini-1.5-flash',
        json: 'gemini-1.5-flash',
    }
};

// Initialize Groq client with specific key
const createGroqClient = (apiKey) => {
    if (!apiKey) return null;
    return new Groq({ apiKey });
};

// Key Pooling Utilities
const getKeyPool = (provider) => {
    const envVarPool = provider === PROVIDERS.GEMINI ? 'GEMINI_API_KEYS' : 'GROQ_API_KEYS';
    const envVarSingle = provider === PROVIDERS.GEMINI ? 'GEMINI_API_KEY' : 'GROQ_API_KEY';
    
    const rawKeys = process.env[envVarPool] || process.env[envVarSingle] || '';
    // Handle comma separated or single keys
    const keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
    
    // Fallback: Check for legacy numbered keys (GEMINI_API_KEY_2, etc.)
    if (keys.length === 1 && provider === PROVIDERS.GEMINI) {
        for (let i = 2; i <= 10; i++) {
            const key = process.env[`GEMINI_API_KEY_${i}`];
            if (key) keys.push(key);
        }
    }
    
    return keys;
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
 * Generate text using Groq API with Key Pool Support
 */
async function generateWithGroq(prompt, options = {}) {
    const keys = getKeyPool(PROVIDERS.GROQ);
    if (!keys.length) throw new Error('Groq keys not configured.');

    const model = options.json
        ? MODEL_CONFIG[PROVIDERS.GROQ].json
        : (options.fast ? MODEL_CONFIG[PROVIDERS.GROQ].fast : MODEL_CONFIG[PROVIDERS.GROQ].default);

    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    let lastError = null;
    for (const key of keys) {
        try {
            const client = createGroqClient(key);
            const completion = await client.chat.completions.create({
                model: model,
                messages: messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 2048,
                response_format: options.json ? { type: 'json_object' } : undefined,
            });
            return completion.choices[0]?.message?.content || '';
        } catch (error) {
            console.error(`[AIProvider] Groq key failure:`, error.message);
            lastError = error;
            if (error.status === 429) continue; // Try next key on rate limit
            break; // Stop on other errors
        }
    }
    throw lastError || new Error('Groq generation failed');
}

/**
 * Stream text using Groq API with Key Pool Support
 */
async function* streamWithGroq(prompt, options = {}) {
    const keys = getKeyPool(PROVIDERS.GROQ);
    if (!keys.length) throw new Error('Groq keys not configured.');

    const model = options.fast ? MODEL_CONFIG[PROVIDERS.GROQ].fast : MODEL_CONFIG[PROVIDERS.GROQ].default;
    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    let lastError = null;
    for (const key of keys) {
        try {
            const client = createGroqClient(key);
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
            return; // Success
        } catch (error) {
            console.error(`[AIProvider] Groq stream key failure:`, error.message);
            lastError = error;
            if (error.status === 429) continue;
            break;
        }
    }
    throw lastError || new Error('Groq stream failed');
}

/**
 * Perform OCR using Groq Vision Models
 */
async function extractTextWithGroqVision(base64Data, mimeType, prompt = "Extract all text from this image as accurately as possible.") {
    const keys = getKeyPool(PROVIDERS.GROQ);
    if (!keys.length) throw new Error('Groq not configured');

    let lastError = null;
    for (const key of keys) {
        try {
            const client = createGroqClient(key);
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
        } catch (error) {
            lastError = error;
            if (error.status === 429) continue;
            break;
        }
    }
    throw lastError || new Error('Groq vision failed');
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
 * Generate text using Gemini API with Key Pool Support
 */
async function generateWithGemini(prompt, options = {}) {
    const keys = getKeyPool(PROVIDERS.GEMINI);
    if (!keys.length) throw new Error('Gemini keys not configured.');

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    let lastError = null;

    for (const key of keys) {
        try {
            const genAI = new GoogleGenerativeAI(key, { apiVersion: 'v1' });
            const modelName = options.model || (options.json 
                ? MODEL_CONFIG[PROVIDERS.GEMINI].json 
                : (options.fast ? MODEL_CONFIG[PROVIDERS.GEMINI].fast : MODEL_CONFIG[PROVIDERS.GEMINI].default));
            const model = genAI.getGenerativeModel({ model: modelName });
            const content = options.systemInstruction ? `${options.systemInstruction}\n\n${prompt}` : prompt;
            const result = await model.generateContent(content);
            return result.response.text();
        } catch (error) {
            console.error(`[AIProvider] Gemini key failure:`, error.message);
            lastError = error;
            if (error.message?.includes('429')) continue;
            break;
        }
    }
    throw lastError || new Error('Gemini generation failed');
}

/**
 * Stream text using Gemini API with Key Pool Support
 */
async function* streamWithGemini(prompt, options = {}) {
    const keys = getKeyPool(PROVIDERS.GEMINI);
    if (!keys.length) throw new Error('Gemini keys not configured.');

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    let lastError = null;

    for (const key of keys) {
        try {
            const genAI = new GoogleGenerativeAI(key, { apiVersion: 'v1' });
            const modelName = options.model || (options.json 
                ? MODEL_CONFIG[PROVIDERS.GEMINI].json 
                : (options.fast ? MODEL_CONFIG[PROVIDERS.GEMINI].fast : MODEL_CONFIG[PROVIDERS.GEMINI].default));
            const model = genAI.getGenerativeModel({ model: modelName });
            const content = options.systemInstruction ? `${options.systemInstruction}\n\n${prompt}` : prompt;
            const result = await model.generateContentStream(content);
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) yield text;
            }
            return; // Success
        } catch (error) {
            console.error(`[AIProvider] Gemini stream key failure:`, error.message);
            lastError = error;
            if (error.message?.includes('429')) continue;
            break;
        }
    }
    throw lastError || new Error('Gemini stream failed');
}

/**
 * Generate text using local Ollama API
 */
async function generateWithOllama(prompt, options = {}) {
    const model = options.model || MODEL_CONFIG[PROVIDERS.OLLAMA].default;
    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    // Use a short timeout (2s) because if Ollama isn't there, it should fail fast on deployed sites
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 120000);

    try {
        const response = await fetch('http://127.0.0.1:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                options: {
                    temperature: options.temperature ?? 0.2,
                    num_predict: options.maxTokens || 512,
                },
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Ollama Error (${response.status}): ${err}`);
        }

        const data = await response.json();
        let text = data.message?.content || '';
        text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        
        if (options.json) {
            // Aggressive JSON extraction for local models
            text = text.replace(/```json|```/g, '').trim();
            const firstBracket = text.indexOf('{');
            const firstSquare = text.indexOf('[');
            let start = -1;
            
            if (firstBracket !== -1 && firstSquare !== -1) start = Math.min(firstBracket, firstSquare);
            else if (firstBracket !== -1) start = firstBracket;
            else if (firstSquare !== -1) start = firstSquare;

            if (start !== -1) {
                const end = text.lastIndexOf(text[start] === '{' ? '}' : ']');
                if (end !== -1) text = text.substring(start, end + 1);
            }
        }
        return text;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Stream text using local Ollama API
 */
async function* streamWithOllama(prompt, options = {}) {
    const model = options.model || MODEL_CONFIG[PROVIDERS.OLLAMA].default;
    const messages = [];
    if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); // 300s (5min) for local Ollama stream initialization

    try {
        const response = await fetch('http://127.0.0.1:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, stream: true }),
            signal: controller.signal
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Ollama Stream Error (${response.status}): ${err}`);
        }

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
                        console.warn('[AIProvider] Ollama Stream JSON parse error:', e.message);
                    }
                }
                boundary = lineBuffer.indexOf('\n');
            }
        }
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Main unified generation function - PRIORITIZES OLLAMA (Local)
 */
async function generate(prompt, options = {}) {
    // Priority: GEMINI ONLY as requested.
    const fallbackChain = [PROVIDERS.GEMINI];
    let lastError = null;

    for (const provider of fallbackChain) {
        // Skip if provider key is missing (except for Ollama)
        if (provider === PROVIDERS.NVIDIA && !process.env.NVIDIA_API_KEY) continue;
        if (provider === PROVIDERS.GROQ && !process.env.GROQ_API_KEY) continue;
        if (provider === PROVIDERS.OPENROUTER && !process.env.OPENROUTER_API_KEY) continue;
        if (provider === PROVIDERS.GEMINI && !process.env.GEMINI_API_KEY) continue;
        
        // Use MU Identity only for relevant features, otherwise just use systemInstruction
        // Study Buddy and Chat are allowed personality/emojis, formal MU rigor kept for exam tasks
        const isAcademicStrict = ['mockPaper', 'studyPlan', 'topicPredictor'].includes(options.feature);
        const isMood = options.feature === 'mood';
        
        let baseIdentity = '';
        if (isMood) {
            baseIdentity = 'You are a concise academic coach. Give one-sentence responses.';
        } else if (isAcademicStrict) {
            baseIdentity = MU_IDENTITY_PROMPT;
        } else {
            baseIdentity = MU_IDENTITY_PROMPT.replace('You MUST NOT use any emojis in your responses. Maintain a professional, academic, and formal tone at all times.', 'Maintain a helpful, academic, and encouraging tone. Use MU-specific academic terms where appropriate.');
        }

        const mergedOptions = { ...options };
        if (options.systemInstruction && baseIdentity && !isMood) {
            mergedOptions.systemInstruction = `${baseIdentity}\n\nAdditional Task Context: ${options.systemInstruction}`;
        } else {
            mergedOptions.systemInstruction = options.systemInstruction || baseIdentity;
        }

        try {
            let resultText = '';
            switch (provider) {
                case PROVIDERS.NVIDIA: resultText = await generateWithNvidia(prompt, mergedOptions); break;
                case PROVIDERS.GROQ: resultText = await generateWithGroq(prompt, mergedOptions); break;
                case PROVIDERS.OPENROUTER: resultText = await generateWithOpenRouter(prompt, mergedOptions); break;
                case PROVIDERS.GEMINI: resultText = await generateWithGemini(prompt, mergedOptions); break;
                case PROVIDERS.OLLAMA: resultText = await generateWithOllama(prompt, mergedOptions); break;
            }
            if (options.json && typeof resultText === 'string') {
                // Remove potential markdown blocks first
                resultText = resultText.replace(/```json|```/g, '').trim();
                
                // Then try to extract the outermost JSON array or object
                const jsonMatch = resultText.match(/[\{\[][\s\S]*[\}\]]/);
                if (jsonMatch) {
                    resultText = jsonMatch[0];
                }
            }
            console.log(`[AIProvider] Success with ${provider}. Result length: ${resultText?.length || 0}`);
            return resultText;
        } catch (error) {
            console.error(`[AIProvider] Error with ${provider}:`, error.message);
            lastError = error;
            // Immediate fallback on failure
            continue;
        }
    }
    
    // FINAL SAFETY FALLBACK: Instead of crashing, return a helpful static message if all models fail
    console.error("CRITICAL: All AI providers failed. Returning emergency fallback response.");
    if (options.json) return JSON.stringify({ error: "System temporarily overloaded. Please try again in a moment." });
    return "I'm experiencing a high volume of student queries and my intelligence modules are currently syncing. Please take a 5-minute break and try again—your focus is valuable! 🚀";
}

/**
 * Main unified streaming function
 */
async function* stream(prompt, options = {}) {
    // Priority Chain: GEMINI ONLY
    const fallbackChain = [PROVIDERS.GEMINI];
    let lastError = null;
    let anySuccess = false;

    for (const provider of fallbackChain) {
        // Skip if provider key is missing
        if (provider === PROVIDERS.NVIDIA && !process.env.NVIDIA_API_KEY) continue;
        if (provider === PROVIDERS.GROQ && !process.env.GROQ_API_KEY) continue;
        if (provider === PROVIDERS.OPENROUTER && !process.env.OPENROUTER_API_KEY) continue;
        if (provider === PROVIDERS.GEMINI && !process.env.GEMINI_API_KEY) continue;
        
        if (provider === PROVIDERS.OLLAMA && !options.useOllama && process.env.NODE_ENV === 'production') {
            // Keep a tiny check: if Ollama is specifically requested, allow it, otherwise skip in prod
            // Actually, user wants it ALWAYS, so let's just comment this out.
            // continue; 
        }

        console.log(`[AIProvider] Attempting stream with ${provider} for feature: ${options.feature || 'default'}`);

        // Use MU Identity only for relevant features, otherwise just use systemInstruction
        const isAcademicStrict = ['mockPaper', 'studyPlan', 'topicPredictor'].includes(options.feature);
        const baseIdentity = isAcademicStrict ? MU_IDENTITY_PROMPT : MU_IDENTITY_PROMPT.replace('You MUST NOT use any emojis in your responses. Maintain a professional, academic, and formal tone at all times.', 'Maintain a helpful, academic, and encouraging tone. Use MU-specific academic terms where appropriate.');

        const mergedOptions = { ...options };
        if (options.systemInstruction && baseIdentity) {
            mergedOptions.systemInstruction = `${baseIdentity}\n\nAdditional Task Context: ${options.systemInstruction}`;
        } else {
            mergedOptions.systemInstruction = options.systemInstruction || baseIdentity;
        }

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
            console.error(`[AIProvider] Stream error with provider [${provider}]:`, error.message);
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
    available.push(PROVIDERS.GEMINI); 
    return available;
}

module.exports = {
    PROVIDERS,
    generate,
    stream,
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
