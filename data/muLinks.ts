export interface MuLink {
    name: string;
    href: string;
    category: 'official' | 'results' | 'admission' | 'digital' | 'support';
    description?: string;
}

export const ESSENTIAL_MU_LINKS: MuLink[] = [
    {
        name: 'MU Official Circulars',
        href: 'https://www.mu.ac.in/circular.php',
        category: 'official',
        description: 'Latest official notifications and administrative circulars.'
    },
    {
        name: 'MU Results Portal',
        href: 'https://www.mumresults.in',
        category: 'results',
        description: 'Check latest examination results and marksheets.'
    },
    {
        name: 'Digital University Portal',
        href: 'http://www.mum.digitaluniversity.ac',
        category: 'digital',
        description: 'Student registration, profile management, and hall tickets.'
    },
    {
        name: 'SAMARTH Admission',
        href: 'https://muadmission.samarth.edu.in/index.php/notifications/index?sort=url',
        category: 'admission',
        description: 'Official portal for university admissions and notifications.'
    },
    {
        name: 'MU Exam Portal',
        href: 'http://www.mu.ac.in/examination',
        category: 'official',
        description: 'Comprehensive exam schedules, timetables, and guidelines.'
    },
    {
        name: 'Transcript Application',
        href: 'https://www.mu.ac.in/online-transcript-application',
        category: 'support',
        description: 'Apply for official academic transcripts online.'
    }
];

export const normalizeMuUrl = (url: string): string => {
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    return `https://mu.ac.in/${cleanPath}`;
};
