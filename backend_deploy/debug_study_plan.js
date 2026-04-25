require('dotenv').config();
const aiProvider = require('./services/aiProvider');

async function debugStudyPlanGenerate() {
    const goal = "Ace my Data Structures exam";
    const durationDays = 7;
    const notesContext = "Level: Beginner. Subjects: Linked Lists, Trees, Graphs, Sorting Algorithms. Timeframe: 2 weeks";
    const language = "en";

    console.log('--- Debugging Study Plan Generation ---');
    console.log(`Goal: ${goal}`);
    console.log(`Duration: ${durationDays}`);

    let prompt = `You are an expert personalized academic advisor for engineering students. 
    A student wants to achieve the following goal: "${goal}" in ${durationDays} days.
    They have provided the following notes context for their course:
    ---
    ${notesContext}
    ---
    Based on this, generate a structured, day-by-day study plan.
    Each day should have 2-3 specific tasks. 
    Task types MUST be one of: 'note' (reviewing notes), 'quiz' (taking a practice quiz), 'study-room' (collaborative session), or 'review' (general review).
    Make the plan realistic and progressive.
    
    Return ONLY a JSON object with a "days" key containing the array of daily plans.
    Do not include markdown formatting like \`\`\`json.
    
    JSON Structure:
    {
        "days": [
            {
                "day": number,
                "tasks": [
                    {
                        "title": "string",
                        "description": "string",
                        "type": "note" | "quiz" | "study-room" | "review"
                    }
                ]
            }
        ]
    }`;

    try {
        console.log('Calling aiProvider.generate...');
        const result = await aiProvider.generate(prompt, {
            feature: 'studyPlan',
            json: true
        });
        console.log('Success! Result length:', result.length);
        console.log('Result preview:', result.substring(0, 500));
        
        // Test parsing like studyPlan.js does
        let responseText = result;
        if (typeof result !== 'string') {
            responseText = JSON.stringify(result);
        } else {
            responseText = result.replace(/```json|```/g, '').trim();
        }
        console.log('Cleaned response text length:', responseText.length);
        
        // Check if it's valid JSON
        try {
            const parsed = JSON.parse(responseText);
            console.log('JSON parsed successfully. Days:', parsed.days?.length);
        } catch (e) {
            console.error('JSON Parse Error:', e.message);
            console.log('Raw text that failed to parse:', responseText);
        }

    } catch (error) {
        console.error('aiProvider.generate FAILED:', error);
    }
}

debugStudyPlanGenerate();
