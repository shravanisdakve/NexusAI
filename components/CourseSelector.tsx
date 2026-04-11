import React, { useState, useEffect } from 'react';
import { type Course } from '../types';
import { getCourses } from '../services/courseService';
import { BookCopy } from 'lucide-react';

interface CourseSelectorProps {
    selectedCourse: string | null;
    onCourseChange: (courseId: string | null) => void;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({ selectedCourse, onCourseChange }) => {
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        const fetchCourses = async () => {
            const fetchedCourses = await getCourses();
            // Filter out stale/demo data and empty strings
            const cleanCourses = fetchedCourses.filter(c => 
                c.name &&                          
                c.name.trim().length > 2 &&        
                c.name.toLowerCase() !== 'ads' &&
                c.name !== c.id
            );
            setCourses(cleanCourses);
        };
        fetchCourses();
    }, []);

    if (courses.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <BookCopy size={16} className="text-slate-400" />
            <select
                id="course-selector"
                name="courseSelector"
                aria-label="Select subject theme"
                value={selectedCourse || ''}
                onChange={(e) => onCourseChange(e.target.value || null)}
                className="bg-slate-800/50 border border-slate-700 rounded-md py-2 px-3 text-ui text-slate-200 focus:ring-violet-500 focus:border-violet-500"
            >
                <option value="">No specific course</option>
                {courses.map(course => (
                    <option key={course.id} value={course.id}>
                        {course.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default CourseSelector;