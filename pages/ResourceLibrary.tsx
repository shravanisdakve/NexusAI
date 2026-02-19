import React, { useState, useEffect } from 'react';
import { PageHeader, Button, Input, Select, Modal } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { type Resource } from '../types';
import { PlusCircle, Upload, BookOpen, Search, FileText, Video } from 'lucide-react';
import { getResources, addResource } from '../services/resourceService';

const UploadResourceModal: React.FC<{ isOpen: boolean; onClose: () => void; onUpload: () => void }> = ({ isOpen, onClose, onUpload }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Notes');
    const [subject, setSubject] = useState('');
    const [link, setLink] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
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
            const file = e.target.files[0];
            setSelectedFile(file);
            if (!link && uploadMode === 'file') {
                setLink(`File: ${file.name}`);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !type || !subject || !branch || !year) {
            setError(t('resources.error.requiredFields'));
            return;
        }
        if (uploadMode === 'link' && !link) {
            setError(t('resources.error.provideLink'));
            return;
        }
        if (uploadMode === 'file' && !selectedFile) {
            setError(t('resources.error.selectFile'));
            return;
        }
        if (!user) {
            setError(t('resources.error.loginRequired'));
            return;
        }

        setError('');
        setIsUploading(true);
        try {
            await addResource({
                title,
                description,
                type,
                branch,
                year: parseInt(year, 10),
                subject,
                link: uploadMode === 'link' ? link : '',
                file: uploadMode === 'file' ? selectedFile : null,
            });
            onUpload();
            handleClose();
        } catch (err: any) {
            setError(err.message || t('resources.error.uploadFailed'));
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
        <Modal isOpen={isOpen} onClose={handleClose} title={t('resources.modal.title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-400 text-sm">{error}</p>}

                <div className="flex gap-4 mb-2">
                    <button
                        type="button"
                        onClick={() => setUploadMode('link')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${uploadMode === 'link' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        {t('resources.modal.linkUrl')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${uploadMode === 'file' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        {t('resources.modal.uploadFile')}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="resource-title" className="block text-sm font-medium text-slate-300 mb-2">{t('resources.modal.resourceTitle')}</label>
                        <Input
                            id="resource-title"
                            name="title"
                            placeholder={t('resources.modal.resourceTitlePlaceholder')}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="resource-subject" className="block text-sm font-medium text-slate-300 mb-2">{t('resources.modal.subject')}</label>
                        <Input
                            id="resource-subject"
                            name="subject"
                            placeholder={t('resources.modal.subjectPlaceholder')}
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="resource-branch" className="block text-sm font-medium text-slate-300 mb-2">{t('resources.modal.branch')}</label>
                        <Input
                            id="resource-branch"
                            name="branch"
                            placeholder={t('resources.modal.branchPlaceholder')}
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="resource-year" className="block text-sm font-medium text-slate-300 mb-2">{t('resources.modal.year')}</label>
                        <Select
                            id="resource-year"
                            name="year"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            required
                        >
                            <option value="">{t('resources.selectYear')}</option>
                            <option value="1">{t('resources.year1')}</option>
                            <option value="2">{t('resources.year2')}</option>
                            <option value="3">{t('resources.year3')}</option>
                            <option value="4">{t('resources.year4')}</option>
                        </Select>
                    </div>
                </div>

                {uploadMode === 'link' ? (
                    <div>
                        <label htmlFor="resource-link" className="block text-sm font-medium text-slate-300 mb-2">{t('resources.modal.linkToResource')}</label>
                        <Input
                            id="resource-link"
                            name="link"
                            type="url"
                            placeholder={t('resources.modal.linkPlaceholder')}
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            required
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300">
                            {t('resources.modal.selectFile')}
                        </label>
                        <div className="flex items-center gap-2">
                            <label htmlFor="file-upload" className="flex-1 cursor-pointer bg-slate-800 border border-slate-700 rounded-md py-2 px-3 hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-300">
                                <Upload size={16} className="mr-2" />
                                {selectedFile ? selectedFile.name : t('resources.modal.chooseFile')}
                                <input
                                    id="file-upload"
                                    name="fileUpload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-slate-500">{t('resources.modal.supportedTypes')}</p>
                    </div>
                )}

                <div>
                    <label htmlFor="resource-type" className="block text-sm font-medium text-slate-300 mb-2">{t('resources.modal.resourceType')}</label>
                    <Select id="resource-type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="Notes">{t('resources.type.notes')}</option>
                        <option value="Paper">{t('resources.type.paper')}</option>
                        <option value="Book">{t('resources.type.book')}</option>
                        <option value="Video">{t('resources.type.video')}</option>
                    </Select>
                </div>
                <div>
                    <label htmlFor="resource-description" className="block text-sm font-medium text-slate-300 mb-2">{t('resources.modal.descriptionOptional')}</label>
                    <textarea
                        id="resource-description"
                        name="description"
                        placeholder={t('resources.modal.descriptionPlaceholder')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>
                <Button type="submit" isLoading={isUploading} className="w-full">
                    <Upload size={16} className="mr-2" />
                    {uploadMode === 'link' ? t('resources.modal.addResource') : t('resources.modal.uploadResource')}
                </Button>
            </form>
        </Modal>
    );
};

const ResourceLibrary: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [resources, setResources] = useState<Resource[]>([]);
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [yearFilter, setYearFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [subjectFilter, setSubjectFilter] = useState<string>('');

    const fetchAndSetResources = async () => {
        setIsLoading(true);
        try {
            const fetchedResources = await getResources({ branch: user?.branch });
            setResources(fetchedResources);
        } catch (error) {
            console.error('Failed to fetch resources:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchAndSetResources();
    }, [user]);

    useEffect(() => {
        let tempResources = [...resources];
        if (yearFilter) {
            tempResources = tempResources.filter((r) => r.year === parseInt(yearFilter, 10));
        }
        if (typeFilter) {
            tempResources = tempResources.filter((r) => r.type === typeFilter);
        }
        if (subjectFilter) {
            const lowerSearch = subjectFilter.toLowerCase();
            tempResources = tempResources.filter((r) =>
                r.subject.toLowerCase().includes(lowerSearch) ||
                r.title.toLowerCase().includes(lowerSearch) ||
                r.description.toLowerCase().includes(lowerSearch)
            );
        }
        setFilteredResources(tempResources);
    }, [resources, yearFilter, typeFilter, subjectFilter]);

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'Video': return <Video size={20} className="text-red-400" />;
            case 'Book': return <BookOpen size={20} className="text-blue-400" />;
            case 'Paper': return <FileText size={20} className="text-yellow-400" />;
            default: return <FileText size={20} className="text-violet-400" />;
        }
    };

    const yearLabel = (year: number) => {
        if (year === 1) return t('resources.year1');
        if (year === 2) return t('resources.year2');
        if (year === 3) return t('resources.year3');
        return t('resources.year4');
    };

    return (
        <>
            <UploadResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUpload={fetchAndSetResources} />
            <div className="space-y-8">
                <PageHeader title={t('resources.title')} subtitle={t('resources.subtitle', { branch: user?.branch || t('resources.all') })} />

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-1 gap-4 w-full">
                        <Select
                            id="resource-year-filter"
                            name="yearFilter"
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="w-full md:w-auto"
                        >
                            <option value="">{t('resources.allYears')}</option>
                            <option value="1">{t('resources.year1')}</option>
                            <option value="2">{t('resources.year2')}</option>
                            <option value="3">{t('resources.year3')}</option>
                            <option value="4">{t('resources.year4')}</option>
                        </Select>
                        <Select
                            id="resource-type-filter"
                            name="typeFilter"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full md:w-auto"
                        >
                            <option value="">{t('resources.allTypes')}</option>
                            <option value="Notes">{t('resources.type.notes')}</option>
                            <option value="Paper">{t('resources.type.paper')}</option>
                            <option value="Book">{t('resources.type.book')}</option>
                            <option value="Video">{t('resources.type.video')}</option>
                        </Select>
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                id="resource-search"
                                name="subjectFilter"
                                placeholder={t('resources.searchPlaceholder')}
                                value={subjectFilter}
                                onChange={(e) => setSubjectFilter(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <PlusCircle size={16} className="mr-2" />
                        {t('resources.uploadResource')}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <p className="text-slate-400 col-span-full text-center">{t('resources.loading')}</p>
                    ) : filteredResources.length > 0 ? (
                        filteredResources.map((resource: any) => (
                            <a
                                key={resource.id || resource._id}
                                href={resource.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-violet-500/50 transition-all duration-300 group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    {getResourceIcon(resource.type)}
                                </div>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 bg-slate-700/50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                        {getResourceIcon(resource.type)}
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-violet-500/10 text-violet-300 rounded-full border border-violet-500/20">
                                        {resource.type}
                                    </span>
                                </div>

                                <h4 className="font-bold text-white text-lg mb-1 group-hover:text-violet-300 transition-colors line-clamp-1">{resource.title}</h4>
                                <p className="text-sm text-slate-400 mb-3">{resource.subject} | {yearLabel(resource.year)}</p>

                                {resource.description && (
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 bg-slate-900/30 p-2 rounded-lg">
                                        {resource.description}
                                    </p>
                                )}

                                <div className="flex items-center text-xs text-slate-500 mt-2">
                                    <span>{t('resources.addedBy')} {typeof resource.uploadedBy === 'string' ? t('resources.user') : resource.uploadedBy?.displayName || t('resources.admin')}</span>
                                </div>
                            </a>
                        ))
                    ) : (
                        <p className="text-center text-slate-400 py-12 col-span-full bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                            {t('resources.noResources')}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default ResourceLibrary;
