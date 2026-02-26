/**
 * Multi-Provider AI Service
 * Supports: Groq (primary), OpenRouter, and Gemini (fallback)
 * 
 * This service provides a unified interface for AI text generation
 * across multiple providers to avoid rate limits and ensure reliability.
 */

const Groq = require('groq-sdk');

// Provider Configuration
const PROVIDERS = {
    GROQ: 'groq',
    OPENROUTER: 'openrouter',
    GEMINI: 'gemini',
    OLLAMA: 'ollama', // Local fallback
    // Virtual providers (routed via OpenRouter)
    MISTRAL: 'mistral',
    TOGETHER: 'together'
};

// Feature-to-Provider mapping (customize based on your needs)
const FEATURE_PROVIDER_MAP = {
    'chat': PROVIDERS.GROQ,           // AI Tutor - requires speed
    'studyBuddy': PROVIDERS.GROQ,     // Study Buddy - high volume
    'quiz': PROVIDERS.GROQ,           // Quiz generation - JSON needs
    'flashcards': PROVIDERS.GROQ,     // Flashcard generation
    'code': PROVIDERS.GROQ,           // Code helper - Llama is great at code
    'summarize': PROVIDERS.MISTRAL,   // Text summarization - Mistral is concise
    'viva': PROVIDERS.GROQ,           // Viva simulator - speed matters
    'studyPlan': PROVIDERS.MISTRAL,   // Study plan - reasoning matters
    'projectIdeas': PROVIDERS.MISTRAL,// Project ideas - creativity
    'mockPaper': PROVIDERS.MISTRAL,   // Mock paper - complex structure
    'goals': PROVIDERS.GROQ,          // Goal breakdown
    'mood': PROVIDERS.GROQ,           // Mood suggestions
    'suggestions': PROVIDERS.MISTRAL, // Study suggestions
};

// Model configurations for each provider
const MODEL_CONFIG = {
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
        default: 'mistralai/mistral-large-2411', // Often free/cheap on OpenRouter
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
 * Generate text using Groq API
 */
async function generateWithGroq(prompt, options = {}) {
    const client = getGroqClient();
    if (!client) {
        throw new Error('Groq client not initialized. Check GROQ_API_KEY.');
    }

    const model = options.json
        ? MODEL_CONFIG[PROVIDERS.GROQ].json
        : (options.fast ? MODEL_CONFIG[PROVIDERS.GROQ].fast : MODEL_CONFIG[PROVIDERS.GROQ].default);

    const messages = [];

    if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await client.chat.completions.create({
        model: model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        response_format: options.json ? { type: 'json_object' } : undefined,
    });

    return completion.choices[0]?.message?.content || '';
}

/**
 * Stream text using Groq API
 */
async function* streamWithGroq(prompt, options = {}) {
    const client = getGroqClient();
    if (!client) {
        throw new Error('Groq client not initialized. Check GROQ_API_KEY.');
    }

    const model = options.fast
        ? MODEL_CONFIG[PROVIDERS.GROQ].fast
        : MODEL_CONFIG[PROVIDERS.GROQ].default;

    const messages = [];

    if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
    }

    messages.push({ role: 'user', content: prompt });

    const stream = await client.chat.completions.create({
        model: model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: true,
    });

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
            yield content;
        }
    }
}

/**
 * Generate text using OpenRouter API
 */
async function generateWithOpenRouter(prompt, options = {}) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OpenRouter API key not configured. Check OPENROUTER_API_KEY.');
    }

    // Use passed model OR fallback to OpenRouter config
    const model = options.model || (options.json
        ? MODEL_CONFIG[PROVIDERS.OPENROUTER].json
        : (options.fast ? MODEL_CONFIG[PROVIDERS.OPENROUTER].fast : MODEL_CONFIG[PROVIDERS.OPENROUTER].default));

    const messages = [];

    if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
    }

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
            model: model,
            messages: messages,
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
    if (!apiKey) {
        throw new Error('OpenRouter API key not configured.');
    }

    const model = options.model || (options.fast
        ? MODEL_CONFIG[PROVIDERS.OPENROUTER].fast
        : MODEL_CONFIG[PROVIDERS.OPENROUTER].default);

    const messages = [];

    if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
    }

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
            model: model,
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2048,
            stream: true,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter error: ${error.error?.message || 'Unknown error'}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                    yield content;
                }
            } catch (e) {
                // Skip non-JSON lines
            }
        }
    }
}

/**
 * Get the provider for a specific feature
 */
function getProviderForFeature(feature) {
    // Check if we have API keys configured and fallback accordingly
    const preferredProvider = FEATURE_PROVIDER_MAP[feature] || PROVIDERS.GROQ;

    // Direct Groq Support
    if (preferredProvider === PROVIDERS.GROQ && process.env.GROQ_API_KEY) {
        return PROVIDERS.GROQ;
    }

    // OpenRouter handling (supports generic OpenRouter, plus Mistral/Together routing)
    if ((preferredProvider === PROVIDERS.OPENROUTER ||
        preferredProvider === PROVIDERS.MISTRAL ||
        preferredProvider === PROVIDERS.TOGETHER) && process.env.OPENROUTER_API_KEY) {
        return preferredProvider;
    }

    // Fallback chain: GROQ -> OpenRouter -> Gemini
    if (process.env.GROQ_API_KEY) return PROVIDERS.GROQ;
    if (process.env.OPENROUTER_API_KEY) return PROVIDERS.OPENROUTER;

    return PROVIDERS.GEMINI; // Fallback to Gemini if no other keys
}

/**
 * Generate text using Gemini API
 */
async function generateWithGemini(prompt, options = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key not configured. Check GEMINI_API_KEY.');
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = options.model || (options.fast ? 'gemini-1.5-flash' : 'gemini-1.5-pro');

    const config = {
        model: modelName,
        generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 2048,
            responseMimeType: options.json ? "application/json" : "text/plain"
        }
    };

    if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
    }

    const model = genAI.getGenerativeModel(config);
    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Stream text using Gemini API
 */
async function* streamWithGemini(prompt, options = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key not configured.');
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = options.model || (options.fast ? 'gemini-1.5-flash' : 'gemini-1.5-pro');

    const config = {
        model: modelName,
        generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 2048
        }
    };

    if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
    }

    const model = genAI.getGenerativeModel(config);
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
    }
}

/**
 * Generate text using local Ollama API
 */
async function generateWithOllama(prompt, options = {}) {
    const model = options.model || MODEL_CONFIG[PROVIDERS.OLLAMA].default;

    const messages = [];
    if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            messages: messages,
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.message?.content || '';

    // Remove thinking tags if present
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    if (options.json) {
        text = text.replace(/```json|```/g, '').trim();
    }
    return text;
}

/**
 * Stream text using local Ollama API
 */
async function* streamWithOllama(prompt, options = {}) {
    const model = options.model || MODEL_CONFIG[PROVIDERS.OLLAMA].default;

    const messages = [];
    if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            messages: messages,
            stream: true
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
            const line = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 1);
            if (line) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.message?.content) {
                        yield parsed.message.content;
                    }
                } catch (e) {
                    // Ignore parse errors from partial JSON
                }
            }
            boundary = buffer.indexOf('\n');
        }
    }
}

/**
 * Main unified generation function
 */
async function generate(prompt, options = {}) {
    const provider = options.provider || getProviderForFeature(options.feature);

    console.log(`[AIProvider] Using ${provider} for feature: ${options.feature || 'default'}`);

    try {
        switch (provider) {
            case PROVIDERS.GROQ:
                return await generateWithGroq(prompt, options);
            case PROVIDERS.OPENROUTER:
            case PROVIDERS.MISTRAL:
            case PROVIDERS.TOGETHER:
                const modelConfig = MODEL_CONFIG[provider];
                if (!options.model && modelConfig) {
                    options.model = options.json ? modelConfig.json : (options.fast ? modelConfig.fast : modelConfig.default);
                }
                return await generateWithOpenRouter(prompt, options);
            case PROVIDERS.GEMINI:
                return await generateWithGemini(prompt, options);
            case PROVIDERS.OLLAMA:
                return await generateWithOllama(prompt, options);
            default:
                throw new Error(`Provider ${provider} not supported.`);
        }
    } catch (error) {
        console.error(`[AIProvider] Error with ${provider}:`, error.message);

        // Fallback chain: Gemini -> Ollama
        if (provider !== PROVIDERS.GEMINI && process.env.GEMINI_API_KEY) {
            console.log(`[AIProvider] Falling back to Gemini...`);
            try {
                return await generateWithGemini(prompt, options);
            } catch (geminiError) {
                console.error(`[AIProvider] Gemini fallback failed:`, geminiError.message);
            }
        }

        console.log(`[AIProvider] Final fallback to local Ollama...`);
        try {
            return await generateWithOllama(prompt, options);
        } catch (ollamaError) {
            console.error(`[AIProvider] Ollama fallback failed:`, ollamaError.message);
            throw new Error(`All AI providers failed. Last error: ${error.message}`);
        }
    }
}

/**
 * Main unified streaming function
 */
async function* stream(prompt, options = {}) {
    const provider = options.provider || getProviderForFeature(options.feature);

    console.log(`[AIProvider] Streaming with ${provider} for feature: ${options.feature || 'default'}`);

    try {
        switch (provider) {
            case PROVIDERS.GROQ:
                yield* streamWithGroq(prompt, options);
                return;
            case PROVIDERS.OPENROUTER:
            case PROVIDERS.MISTRAL:
            case PROVIDERS.TOGETHER:
                const modelConfig = MODEL_CONFIG[provider];
                if (!options.model && modelConfig) {
                    options.model = options.json ? modelConfig.json : (options.fast ? modelConfig.fast : modelConfig.default);
                }
                yield* streamWithOpenRouter(prompt, options);
                return;
            case PROVIDERS.GEMINI:
                yield* streamWithGemini(prompt, options);
                return;
            case PROVIDERS.OLLAMA:
                yield* streamWithOllama(prompt, options);
                return;
            default:
                throw new Error(`Streaming with ${provider} not supported.`);
        }
    } catch (error) {
        console.error(`[AIProvider] Stream error with ${provider}:`, error.message);

        // Fallback chain: Gemini -> Ollama
        if (provider !== PROVIDERS.GEMINI && process.env.GEMINI_API_KEY) {
            console.log(`[AIProvider] Falling back to Gemini for stream...`);
            try {
                const geminiStream = streamWithGemini(prompt, options);
                for await (const chunk of geminiStream) {
                    yield chunk;
                }
                return;
            } catch (geminiError) {
                console.error(`[AIProvider] Gemini stream fallback failed:`, geminiError.message);
            }
        }

        console.log(`[AIProvider] Final fallback to local Ollama for stream...`);
        try {
            const ollamaStream = streamWithOllama(prompt, options);
            for await (const chunk of ollamaStream) {
                yield chunk;
            }
        } catch (ollamaError) {
            console.error(`[AIProvider] Ollama stream fallback failed:`, ollamaError.message);
            throw new Error(`All AI streaming providers failed. Last error: ${error.message}`);
        }
    }
}

/**
 * Check which providers are available
 */
function getAvailableProviders() {
    const available = [];
    if (process.env.GROQ_API_KEY) available.push(PROVIDERS.GROQ);
    if (process.env.OPENROUTER_API_KEY) available.push(PROVIDERS.OPENROUTER);
    if (process.env.GEMINI_API_KEY) available.push(PROVIDERS.GEMINI);
    available.push(PROVIDERS.OLLAMA); // Ollama is always local/available
    return available;
}

module.exports = {
    PROVIDERS,
    generate,
    stream,
    getProviderForFeature,
    getAvailableProviders,
    generateWithGroq,
    streamWithGroq,
    generateWithOpenRouter,
    streamWithOpenRouter,
    generateWithOllama,
    streamWithOllama,
};
