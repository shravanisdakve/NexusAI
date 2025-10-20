import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCourses } from '../services/courseService';
import { getNotes, addTextNote, uploadNoteFile, deleteNote } from '../services/notesService';
import { type Note, type Course } from '../types';
import { PageHeader, Button, Input, Textarea, Select } from '../components/ui';
import { PlusCircle, Trash2, Upload, FileText, BookOpen } from 'lucide-react';

const Notes: React.FC = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (currentUser) {
      getCourses().then(setCourses);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedCourse) {
      getNotes(selectedCourse).then(setNotes);
    }
  }, [selectedCourse]);

  const handleAddNote = async () => {
    if (!selectedCourse) return;

    if (newFile) {
      await uploadNoteFile(selectedCourse, newNote.title, newFile);
    } else {
      await addTextNote(selectedCourse, newNote.title, newNote.content);
    }

    setNewNote({ title: '', content: '' });
    setNewFile(null);
    setIsAdding(false);
    getNotes(selectedCourse).then(setNotes);
  };

  const handleDeleteNote = async (note: Note) => {
    if (!selectedCourse) return;
    await deleteNote(selectedCourse, note);
    getNotes(selectedCourse).then(setNotes);
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Notes & Resources" subtitle="Manage your notes, doubts, and uploaded resources for each course." />

      <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700">
        <div className="flex items-center mb-4">
            <BookOpen className="w-6 h-6 mr-3 text-violet-400" />
            <Select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="w-full md:w-1/3"
            >
              <option value="">Select a Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </Select>
        </div>

        {selectedCourse && (
            <>
                <Button onClick={() => setIsAdding(!isAdding)} className="mb-4">
                <PlusCircle size={16} className="mr-2" />
                {isAdding ? 'Cancel' : 'Add Note/Resource'}
                </Button>

                {isAdding && (
                <div className="space-y-4 p-4 bg-slate-800 rounded-lg">
                    <Input
                    placeholder="Title"
                    value={newNote.title}
                    onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                    />
                    <Textarea
                    placeholder="Write your note or doubt here..."
                    value={newNote.content}
                    onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                    />
                    <div className="flex items-center justify-between">
                        <label htmlFor="file-upload" className="flex items-center cursor-pointer text-sm text-slate-400 hover:text-white">
                            <Upload size={16} className="mr-2" />
                            {newFile ? newFile.name : 'Upload a file'}
                        </label>
                        <input id="file-upload" type="file" className="hidden" onChange={e => setNewFile(e.target.files ? e.target.files[0] : null)} />
                    </div>
                    <Button onClick={handleAddNote}>Add</Button>
                </div>
                )}

                <div className="mt-4 space-y-2">
                {notes.map(note => (
                    <div key={note.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                    <div>
                        <p className="font-bold">{note.title}</p>
                        {note.content && <p className="text-sm text-slate-400">{note.content}</p>}
                        {note.fileUrl && (
                        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-400 hover:underline flex items-center">
                            <FileText size={16} className="mr-2" />
                            {note.fileName}
                        </a>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note)}>
                        <Trash2 size={16} />
                    </Button>
                    </div>
                ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default Notes;
