import React, { useState, useEffect } from 'react';
import { PageHeader, Button, Input, Select, Modal } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { type Resource } from '../types';
import { PlusCircle, Upload, BookOpen } from 'lucide-react';
// Assume a service exists to get/post resources
import { getResources, addResource } from '../services/resourceService'; 

// Upload Modal Component
const UploadResourceModal: React.FC<{ isOpen: boolean, onClose: () => void, onUpload: () => void }> = ({ isOpen, onClose, onUpload }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Notes');
    const [subject, setSubject] = useState('');
    const [link, setLink] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !type || !subject || !link) {
            setError('Please fill all required fields.');
            return;
        }
        if (!user) {
            setError('You must be logged in to upload a resource.');
            return;
        }
        
        setError('');
        setIsUploading(true);
        try {
            await addResource({
                title,
                description,
                type,
                branch: user.branch, // Automatically use user's branch
                year: user.year,     // Automatically use user's year
                subject,
                link,
            });
            onUpload();
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Failed to upload resource.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setType('Notes');
        setSubject('');
        setLink('');
        setError('');
        setIsUploading(false);
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload a New Resource">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Input
                    name="title"
                    placeholder="Resource Title (e.g., 'Thermodynamics Chapter 5')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <Input
                    name="subject"
                    placeholder="Subject (e.g., 'Thermodynamics')"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                />
                <Input
                    name="link"
                    type="url"
                    placeholder="Link to Resource (e.g., Google Drive, GitHub)"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    required
                />
                <Select name="type" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Notes">Notes</option>
                    <option value="Paper">Paper</option>
                    <option value="Book">Book</option>
                    <option value="Video">Video</option>
                </Select>
                <textarea
                    name="description"
                    placeholder="Brief description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3"
                />
                <Button type="submit" isLoading={isUploading} className="w-full">
                    <Upload size={16} className="mr-2" />
                    Upload
                </Button>
            </form>
        </Modal>
    );
};

const ResourceLibrary: React.FC = () => {
    const { user } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Filters
    const [yearFilter, setYearFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [subjectFilter, setSubjectFilter] = useState<string>('');

    const fetchAndSetResources = async () => {
        setIsLoading(true);
        try {
            const fetchedResources = await getResources({ branch: user?.branch });
            setResources(fetchedResources);
        } catch (error) {
            console.error("Failed to fetch resources:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAndSetResources();
        }
    }, [user]);

    useEffect(() => {
        let tempResources = [...resources];
        if (yearFilter) {
            tempResources = tempResources.filter(r => r.year === parseInt(yearFilter, 10));
        }
        if (typeFilter) {
            tempResources = tempResources.filter(r => r.type === typeFilter);
        }
        if (subjectFilter) {
            tempResources = tempResources.filter(r => r.subject.toLowerCase().includes(subjectFilter.toLowerCase()));
        }
        setFilteredResources(tempResources);
    }, [resources, yearFilter, typeFilter, subjectFilter]);
    
    return (
        <>
            <UploadResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUpload={fetchAndSetResources} />
            <div className="space-y-8">
                <PageHeader title="Resource Library" subtitle={`Resources for ${user?.branch} Engineering`} />
                
                <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                        {/* Filter controls */}
                        <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                            <option value="">All Years</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </Select>
                         <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="">All Types</option>
                            <option value="Notes">Notes</option>
                            <option value="Paper">Paper</option>
                            <option value="Book">Book</option>
                            <option value="Video">Video</option>
                        </Select>
                        <Input 
                            placeholder="Filter by subject..."
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <PlusCircle size={16} className="mr-2" />
                        Upload Resource
                    </Button>
                </div>

                {/* Resource List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <p>Loading resources...</p>
                    ) : filteredResources.length > 0 ? (
                        filteredResources.map(resource => (
                            <a key={resource.id} href={resource.link} target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-white">{resource.title}</h4>
                                        <p className="text-sm text-slate-400">{resource.subject} - {resource.year}nd Year</p>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full">{resource.type}</span>
                                </div>
                            </a>
                        ))
                    ) : (
                        <p className="text-center text-slate-400 py-8">No resources found for the selected filters.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default ResourceLibrary;
