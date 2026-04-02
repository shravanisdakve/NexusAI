import React, { useState } from 'react';
import { PageHeader, Button, Input, Select } from '../components/ui';
import { Lightbulb, Sparkles, Code, ArrowRight } from 'lucide-react';
import { generateProjectIdeas } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ProjectIdea {
    title: string;
    description: string;
    techStack: string[];
}

const ProjectGenerator: React.FC = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const [interest, setInterest] = useState('');
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [branch, setBranch] = useState(user?.branch || '');
    const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await generateProjectIdeas(branch, interest, difficulty, language);
            // Result is expected to be a JSON string, parse it
            const parsedIdeas = JSON.parse(result);
            setIdeas(parsedIdeas);
        } catch (err: any) {
            console.error("Error generating ideas:", err);
            setError(err.message || "Failed to connect to AI Core. Please check your API keys or network.");
            setIdeas([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <PageHeader title="AI Project Generator" subtitle="Get innovative project ideas tailored for you" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="md:col-span-1 bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700 h-fit">
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label htmlFor="project-branch" className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
                            <Input
                                id="project-branch"
                                name="branch"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                placeholder="e.g. CSE"
                            />
                        </div>
                        <div>
                            <label htmlFor="project-interest" className="block text-sm font-medium text-slate-300 mb-2">Area of Interest</label>
                            <Input
                                id="project-interest"
                                name="interest"
                                value={interest}
                                onChange={(e) => setInterest(e.target.value)}
                                placeholder="e.g. Web Dev, ML, IoT"
                            />
                        </div>
                        <div>
                            <label htmlFor="project-difficulty" className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                            <Select id="project-difficulty" name="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                            </Select>
                        </div>
                        <Button type="submit" isLoading={loading} className="w-full bg-gradient-to-r from-violet-600 to-cyan-600">
                            <Sparkles size={16} className="mr-2" />
                            Generate Ideas
                        </Button>
                    </form>
                </div>

                {/* Results Section */}
                <div className="md:col-span-2 space-y-4">
                    {loading ? (
                        <div className="text-center py-12 bg-slate-800/30 rounded-xl">
                            <Sparkles className="w-8 h-8 text-violet-400 mx-auto animate-pulse mb-4" />
                            <p className="text-slate-400">Brainstorming potential projects...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl text-center">
                            <Sparkles className="w-8 h-8 text-red-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-red-200 mb-2">AI Node Disconnected</h3>
                            <p className="text-sm text-red-300/80">{error}</p>
                            <Button onClick={handleGenerate} className="mt-4 bg-red-600 hover:bg-red-700 text-white border-none">Retry Connection</Button>
                        </div>
                    ) : ideas.length > 0 ? (
                        ideas.map((idea, index) => (
                            <div key={index} className="bg-slate-800 rounded-xl p-6 ring-1 ring-slate-700 hover:ring-violet-500 transition-all">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                                    <Lightbulb className="w-5 h-5 text-yellow-400 mr-2" />
                                    {idea.title}
                                </h3>
                                <p className="text-slate-400 mb-4 text-sm leading-relaxed">
                                    {idea.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {idea.techStack.map((tech, i) => (
                                        <span key={i} className="text-xs font-mono px-2 py-1 bg-violet-900/40 text-violet-300 rounded border border-violet-500/20 flex items-center">
                                            <Code size={12} className="mr-1" />
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-slate-800/30 rounded-xl border-dashed border-2 border-slate-700">
                            <p className="text-slate-500">Enter your preferences to see project ideas.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectGenerator;
