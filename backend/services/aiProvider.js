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
    GEMINI: 'gemini'
};

// Feature-to-Provider mapping (customize based on your needs)
const FEATURE_PROVIDER_MAP = {
    'chat': PROVIDERS.GROQ,           // AI Tutor - high volume
    'studyBuddy': PROVIDERS.GROQ,     // Study Buddy chat
    'quiz': PROVIDERS.GROQ,           // Quiz generation
    'flashcards': PROVIDERS.GROQ,     // Flashcard generation
    'code': PROVIDERS.GROQ,           // Code helper
    'summarize': PROVIDERS.GROQ,      // Text summarization
    'viva': PROVIDERS.GROQ,           // Viva simulator
    'studyPlan': PROVIDERS.GROQ,      // Study plan generation
    'projectIdeas': PROVIDERS.GROQ,   // Project idea generation
    'mockPaper': PROVIDERS.GROQ,      // Mock paper generation
    'goals': PROVIDERS.GROQ,          // Goal breakdown
    'mood': PROVIDERS.GROQ,           // Mood suggestions
    'suggestions': PROVIDERS.GROQ,    // Study suggestions
};

// Model configurations for each provider
const MODEL_CONFIG = {
    [PROVIDERS.GROQ]: {
        default: 'llama-3.3-70b-versatile',      // Best for complex tasks
        fast: 'llama-3.1-8b-instant',            // Fast responses
        json: 'llama-3.3-70b-versatile',         // JSON generation
    },
    [PROVIDERS.OPENROUTER]: {
        default: 'meta-llama/llama-3.1-8b-instruct:free',
        fast: 'meta-llama/llama-3.1-8b-instruct:free',
        json: 'meta-llama/llama-3.1-8b-instruct:free',
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

    const model = options.json 
        ? MODEL_CONFIG[PROVIDERS.OPENROUTER].json 
        : (options.fast ? MODEL_CONFIG[PROVIDERS.OPENROUTER].fast : MODEL_CONFIG[PROVIDERS.OPENROUTER].default);

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

    const model = options.fast 
        ? MODEL_CONFIG[PROVIDERS.OPENROUTER].fast 
        : MODEL_CONFIG[PROVIDERS.OPENROUTER].default;

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
    
    if (preferredProvider === PROVIDERS.GROQ && process.env.GROQ_API_KEY) {
        return PROVIDERS.GROQ;
    }
    
    if (preferredProvider === PROVIDERS.OPENROUTER && process.env.OPENROUTER_API_KEY) {
        return PROVIDERS.OPENROUTER;
    }
    
    // Fallback chain: GROQ -> OpenRouter -> Gemini
    if (process.env.GROQ_API_KEY) return PROVIDERS.GROQ;
    if (process.env.OPENROUTER_API_KEY) return PROVIDERS.OPENROUTER;
    
    return PROVIDERS.GEMINI; // Fallback to Gemini if no other keys
}

/**
 * Main unified generation function
 */
async function generate(prompt, options = {}) {
    const provider = options.provider || getProviderForFeature(options.feature);
    
    console.log(`[AIProvider] Using ${provider} for feature: ${options.feature || 'default'}`);
    
    switch (provider) {
        case PROVIDERS.GROQ:
            return generateWithGroq(prompt, options);
        case PROVIDERS.OPENROUTER:
            return generateWithOpenRouter(prompt, options);
        default:
            throw new Error(`Provider ${provider} requires Gemini fallback. Configure GROQ_API_KEY or OPENROUTER_API_KEY.`);
    }
}

/**
 * Main unified streaming function
 */
async function* stream(prompt, options = {}) {
    const provider = options.provider || getProviderForFeature(options.feature);
    
    console.log(`[AIProvider] Streaming with ${provider} for feature: ${options.feature || 'default'}`);
    
    switch (provider) {
        case PROVIDERS.GROQ:
            yield* streamWithGroq(prompt, options);
            break;
        case PROVIDERS.OPENROUTER:
            yield* streamWithOpenRouter(prompt, options);
            break;
        default:
            throw new Error(`Streaming with ${provider} requires Gemini fallback. Configure GROQ_API_KEY or OPENROUTER_API_KEY.`);
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
};
