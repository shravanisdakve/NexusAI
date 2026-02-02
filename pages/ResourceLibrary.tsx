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

    // Moved inside component
    const [uploadMode, setUploadMode] = useState<'link' | 'file'>('link');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [branch, setBranch] = useState(user?.branch || '');
    const [year, setYear] = useState(user?.year ? user.year.toString() : '');

    useEffect(() => {
        if (user?.branch) setBranch(user.branch);
        if (user?.year) setYear(user.year.toString());
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            // For now, since we don't have real file storage, we'll mock the link
            // In a real app, you'd upload this file to S3/Firebase and get a URL back
            if (!link && uploadMode === 'file') {
                setLink(`File: ${e.target.files[0].name}`);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation updates for file mode
        if (!title || !type || !subject || !branch || !year) {
            setError('Please fill all required fields.');
            return;
        }

        if (uploadMode === 'link' && !link) {
            setError('Please provide a link.');
            return;
        }

        if (uploadMode === 'file' && !selectedFile) {
            setError('Please select a file.');
            return;
        }

        if (!user) {
            setError('You must be logged in to upload a resource.');
            return;
        }

        setError('');
        setIsUploading(true);
        try {
            // Note: If real file upload was implemented, we would upload 'selectedFile' here 
            // and get the URL to pass as 'link'. 
            // For this demo, we use the link state which is set to a placeholder for files.
            const finalLink = uploadMode === 'file' ? (link || `local-file://${selectedFile?.name}`) : link;

            await addResource({
                title,
                description,
                type,
                branch: branch,
                year: parseInt(year, 10),
                subject,
                link: finalLink,
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
        setSelectedFile(null);
        setUploadMode('link');
        setBranch(user?.branch || '');
        setYear(user?.year ? user.year.toString() : '');
        setError('');
        setIsUploading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload a New Resource">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-400 text-sm">{error}</p>}

                {/* Upload Mode Toggle */}
                <div className="flex gap-4 mb-2">
                    <button
                        type="button"
                        onClick={() => setUploadMode('link')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${uploadMode === 'link' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        Link URL
                    </button>
                    <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${uploadMode === 'file' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        Upload File
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="resource-title" className="block text-sm font-medium text-slate-300 mb-2">Resource Title</label>
                        <Input
                            id="resource-title"
                            name="title"
                            placeholder="e.g., 'Thermodynamics Chapter 5'"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="resource-subject" className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                        <Input
                            id="resource-subject"
                            name="subject"
                            placeholder="e.g., 'Thermodynamics'"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="resource-branch" className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
                        <Input
                            id="resource-branch"
                            name="branch"
                            placeholder="e.g. Computer Science"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="resource-year" className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                        <Select
                            id="resource-year"
                            name="year"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            required
                        >
                            <option value="">Select Year</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </Select>
                    </div>
                </div>

                {uploadMode === 'link' ? (
                    <div>
                        <label htmlFor="resource-link" className="block text-sm font-medium text-slate-300 mb-2">Link to Resource</label>
                        <Input
                            id="resource-link"
                            name="link"
                            type="url"
                            placeholder="e.g., Google Drive, GitHub"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            required
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300">
                            Select File
                        </label>
                        <div className="flex items-center gap-2">
                            <label htmlFor="file-upload" className="flex-1 cursor-pointer bg-slate-800 border border-slate-700 rounded-md py-2 px-3 hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-300">
                                <Upload size={16} className="mr-2" />
                                {selectedFile ? selectedFile.name : 'Choose file...'}
                                <input
                                    id="file-upload"
                                    name="fileUpload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-slate-500">Supported types: PDF, DOCX, JPG, PNG (Max 10MB)</p>
                    </div>
                )}

                <div>
                    <label htmlFor="resource-type" className="block text-sm font-medium text-slate-300 mb-2">Resource Type</label>
                    <Select id="resource-type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="Notes">Notes</option>
                        <option value="Paper">Paper</option>
                        <option value="Book">Book</option>
                        <option value="Video">Video</option>
                    </Select>
                </div>
                <div>
                    <label htmlFor="resource-description" className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
                    <textarea
                        id="resource-description"
                        name="description"
                        placeholder="Brief description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>
                <Button type="submit" isLoading={isUploading} className="w-full">
                    <Upload size={16} className="mr-2" />
                    {uploadMode === 'link' ? 'Add Resource' : 'Upload Resource'}
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
                        <Select
                            id="resource-year-filter"
                            name="yearFilter"
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                        >
                            <option value="">All Years</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </Select>
                        <Select
                            id="resource-type-filter"
                            name="typeFilter"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Notes">Notes</option>
                            <option value="Paper">Paper</option>
                            <option value="Book">Book</option>
                            <option value="Video">Video</option>
                        </Select>
                        <Input
                            id="resource-subject-filter"
                            name="subjectFilter"
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
                        filteredResources.map((resource: any) => (
                            <a key={resource.id || resource._id} href={resource.link} target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
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
