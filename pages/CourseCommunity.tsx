import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCourse } from '../services/courseService';
import {
  onResourcesUpdate, uploadResource, deleteResource, getRooms,
  getThreads, createThread, getThreadPosts, createPost,
  upvoteThread, upvotePost, markBestAnswer,
  joinCommunity, onCommunityUpdate, emitNewThread, emitNewPost, emitCommunityTyping
} from '../services/communityService';
import { type Course, type StudyRoom, type Thread, type Post } from '../types';
import { Input, Button, Spinner, Textarea } from '../components/ui';
import {
  MessageSquare, Paperclip, Trash2, Users, ArrowRight, BookOpen,
  UploadCloud, Plus, ChevronUp, CheckCircle, Hash, Search, Filter
} from 'lucide-react';

const CourseCommunity: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [activeRooms, setActiveRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Thread Form State
  const [newThread, setNewThread] = useState({ title: '', content: '', category: 'General', pyqTag: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Selected Thread for View
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadPosts, setThreadPosts] = useState<Post[]>([]);
  const [newReply, setNewReply] = useState('');
  const [typingCommunityUsers, setTypingCommunityUsers] = useState<string[]>([]);
  const communityTypingTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (courseId) {
        const fetchedCourse = await getCourse(courseId);
        setCourse(fetchedCourse);

        const fetchedThreads = await getThreads(courseId);
        setThreads(fetchedThreads);

        const allRooms = await getRooms();
        const filteredRooms = allRooms.filter(room => room.courseId === courseId);
        setActiveRooms(filteredRooms);
      }
      setLoading(false);
    };
    fetchData();
  }, [courseId]);

  // Real-time Community Sync
  useEffect(() => {
    joinCommunity();

    const unsubThreads = onCommunityUpdate('threads', (newThread) => {
      // Only add if it's for this course or if we are in a 'All' view (if applicable)
      if (newThread.courseId === courseId) {
        setThreads(prev => {
          if (prev.find(t => t.id === newThread.id)) return prev;
          return [newThread, ...prev];
        });
      }
    });

    const unsubPosts = onCommunityUpdate('posts', (data) => {
      // data: { threadId, post }
      if (selectedThread?.id === data.threadId) {
        setThreadPosts(prev => {
          if (prev.find(p => p.id === data.post.id)) return prev;
          return [...prev, data.post];
        });
      }
      // Update reply count in list
      setThreads(prev => prev.map(t => t.id === data.threadId ? { ...t, repliesCount: (t.repliesCount || 0) + 1 } : t));
    });

    const unsubTyping = onCommunityUpdate('typing' as any, (data: any) => {
      if (data.userId !== currentUser?.id) {
        setTypingCommunityUsers(prev => prev.includes(data.userName) ? prev : [...prev, data.userName]);
        if (communityTypingTimeoutRef.current[data.userName]) clearTimeout(communityTypingTimeoutRef.current[data.userName]);
        communityTypingTimeoutRef.current[data.userName] = setTimeout(() => {
          setTypingCommunityUsers(prev => prev.filter(u => u !== data.userName));
        }, 3000);
      }
    });

    return () => {
      unsubThreads();
      unsubPosts();
      unsubTyping();
    };
  }, [courseId, selectedThread?.id]);

  // Real-time resources
  useEffect(() => {
    if (!course?.name) return;
    const unsubscribe = onResourcesUpdate(course.name, (fetchedResources: any) => {
      setResources(fetchedResources);
    });
    return () => unsubscribe();
  }, [course?.name]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !newThread.title || !newThread.content) return;

    setIsSubmitting(true);
    const thread = await createThread({ ...newThread, courseId });
    if (thread) {
      emitNewThread(thread); // BROADCAST
      setThreads(prev => [thread, ...prev]);
      setNewThread({ title: '', content: '', category: 'General', pyqTag: '' });
      setIsCreateModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleViewThread = async (thread: Thread) => {
    setSelectedThread(thread);
    const posts = await getThreadPosts(thread.id);
    setThreadPosts(posts);
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !newReply.trim()) return;

    const post = await createPost(selectedThread.id, newReply);
    if (post) {
      emitNewPost({ threadId: selectedThread.id, post }); // BROADCAST
      setThreadPosts(prev => [...prev, post]);
      setNewReply('');
      // Update thread count locally
      setThreads(prev => prev.map(t => t.id === selectedThread.id ? { ...t, repliesCount: (t.repliesCount || 0) + 1 } : t));
    }
  };

  const handleUpvoteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    const result = await upvoteThread(threadId);
    if (result.success) {
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, upvotes: result.upvotes } : t));
      if (selectedThread?.id === threadId) {
        setSelectedThread(prev => prev ? { ...prev, upvotes: result.upvotes } : null);
      }
    }
  };

  const handleUpvotePost = async (postId: string) => {
    const result = await upvotePost(postId);
    if (result.success) {
      setThreadPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: result.upvotes } : p));
    }
  };

  const handleMarkBestAnswer = async (postId: string) => {
    const success = await markBestAnswer(postId);
    if (success) {
      setThreadPosts(prev => prev.map(p => ({ ...p, isBestAnswer: p.id === postId })));
      if (selectedThread) {
        setSelectedThread({ ...selectedThread, isVerified: true });
        setThreads(prev => prev.map(t => t.id === selectedThread.id ? { ...t, isVerified: true } : t));
      }
    }
  };

  if (loading) return <div className="w-full h-full flex items-center justify-center"><Spinner /></div>;
  if (!course) return <div className="text-center p-12"><h1 className="text-2xl font-bold text-white mb-4">Course Not Found</h1><Button onClick={() => navigate('/')}>Home</Button></div>;

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{course.name} Community</h1>
            <p className="text-slate-400 text-sm">Structured Q&A Forum for MU Students</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-900/20">
          <Plus className="mr-2" size={18} /> Ask a Question
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Navigation/Stats (1 col) */}
        <aside className="space-y-6 lg:col-span-1">
          <div className="bg-slate-800/50 rounded-2xl p-4 ring-1 ring-white/5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Rooms</h3>
            <div className="space-y-1">
              {activeRooms.map(room => (
                <button key={room.id} onClick={() => navigate(`/study-room/${room.id}`)} className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-all group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-emerald-400" />
                    <span className="text-sm text-slate-200 font-medium truncate">{room.name}</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 ring-1 ring-white/5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Resources</h3>
            <div className="space-y-3">
              {resources.slice(0, 5).map((res, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-slate-400">
                  <Paperclip size={12} className="flex-shrink-0" />
                  <span className="truncate">{res.name}</span>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs text-violet-400 h-8">View Library</Button>
            </div>
          </div>
        </aside>

        {/* Main Content Area (3 cols) */}
        <main className="lg:col-span-3 space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex gap-2">
            {typingCommunityUsers.length > 0 && (
              <div className="absolute top-[-25px] left-4 text-[10px] text-slate-500 italic animate-pulse">
                {typingCommunityUsers.join(', ')} {typingCommunityUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <Input
                placeholder="Search discussions, PYQs, or topics..."
                className="pl-10 h-11 bg-slate-800/30 border-white/5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="bg-slate-800/50 h-11 border-white/5 px-3 rounded-xl text-sm text-slate-300 outline-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="General">General</option>
              <option value="Conceptual">Conceptual</option>
              <option value="Numerical">Numerical</option>
              <option value="Lab/Practical">Lab/Practical</option>
              <option value="PYQ Help">PYQ Help</option>
            </select>
          </div>

          {!selectedThread ? (
            /* Thread List View */
            <div className="space-y-4">
              {threads
                .filter(t => {
                  const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.content.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
                  return matchesSearch && matchesCategory;
                })
                .map(thread => (
                  <div key={thread.id} onClick={() => handleViewThread(thread)} className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-all cursor-pointer group">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 min-w-[40px]">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 w-8 p-0 border-slate-700 hover:border-violet-500 transition-colors ${thread.upvotedBy?.includes(currentUser?.id) ? 'bg-violet-600/20 border-violet-500 text-violet-400' : 'bg-transparent text-slate-400'}`}
                          onClick={(e) => handleUpvoteThread(e, thread.id)}
                        >
                          <ChevronUp size={18} />
                        </Button>
                        <span className="text-xs font-bold text-slate-300">{thread.upvotes}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] font-bold uppercase rounded-md tracking-wider">{thread.category}</span>
                          {thread.pyqTag && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1"><Hash size={10} /> {thread.pyqTag}</span>}
                          {thread.isVerified && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1"><CheckCircle size={10} /> Verified</span>}
                        </div>
                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-violet-400 transition-colors">{thread.title}</h3>
                        <p className="text-sm text-slate-400 line-clamp-2">{thread.content}</p>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <img src={`https://ui-avatars.com/api/?name=${thread.author.displayName}&background=random`} className="w-5 h-5 rounded-full" />
                            <span className="text-xs text-slate-500 font-medium">{thread.author.displayName} • {new Date(thread.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-4 text-slate-500 text-xs">
                            <span className="flex items-center gap-1"><MessageSquare size={14} /> {thread.repliesCount} replies</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            /* Thread Detail View */
            <div className="space-y-6">
              <Button variant="ghost" onClick={() => setSelectedThread(null)} className="text-slate-400 hover:text-white group">
                <ArrowRight className="mr-2 rotate-180 group-hover:-translate-x-1 transition-all" size={18} /> Back to Discussions
              </Button>

              <div className="bg-slate-800/80 p-6 rounded-3xl border border-violet-500/20 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] font-bold uppercase rounded-md">{selectedThread.category}</span>
                    {selectedThread.pyqTag && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase rounded-md flex items-center gap-1"><Hash size={10} /> {selectedThread.pyqTag}</span>}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedThread.title}</h2>
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <img src={`https://ui-avatars.com/api/?name=${selectedThread.author.displayName}&background=random`} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="text-sm font-bold text-slate-200">{selectedThread.author.displayName}</p>
                      <p className="text-[10px] text-slate-500">{new Date(selectedThread.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-slate-300 leading-relaxed whitespace-pre-wrap py-2">
                    {selectedThread.content}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div> Responses ({threadPosts.length})
                </h4>

                {threadPosts.map(post => (
                  <div key={post.id} className={`p-5 rounded-2xl border ${post.isBestAnswer ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-800/40 border-white/5'}`}>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpvotePost(post.id)}
                          className={`h-6 w-6 p-0 hover:text-white ${post.upvotedBy?.includes(currentUser?.id) ? 'text-violet-400' : 'text-slate-500'}`}
                        >
                          <ChevronUp size={20} />
                        </Button>
                        <span className="text-xs font-bold text-slate-400">{post.upvotes}</span>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={`https://ui-avatars.com/api/?name=${post.author.displayName}&background=random`} className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-bold text-slate-200">{post.author.displayName}</span>
                            {post.isBestAnswer && <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 ml-2"><CheckCircle size={10} /> GOLDEN ANSWER</span>}
                            {!post.isBestAnswer && selectedThread.author.id === currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkBestAnswer(post.id)}
                                className="text-[10px] text-violet-400 hover:text-violet-300 h-6 px-2 py-0"
                              >
                                Mark as Solution
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{post.content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Reply Input */}
                <div className="pt-4">
                  <form onSubmit={handlePostReply} className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 space-y-4">
                    <Textarea
                      placeholder="Know a better way to explain this? Share your solution..."
                      className="min-h-[100px] bg-transparent border-none focus:ring-0 text-sm p-0"
                      value={newReply}
                      onChange={(e) => {
                        setNewReply(e.target.value);
                        if (currentUser) emitCommunityTyping(currentUser.displayName, currentUser.id);
                      }}
                    />
                    <div className="flex justify-end pt-2 border-t border-white/5">
                      <Button type="submit" disabled={!newReply.trim()} className="bg-violet-600 hover:bg-violet-500 px-6 h-9 text-xs">Post Answer</Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Thread Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-slate-800 w-full max-w-xl rounded-3xl p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-2">New Discussion</h2>
            <p className="text-slate-400 text-sm mb-6">Ask a doubt, share a PYQ logic, or start a topic-wise debate.</p>

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                <Input
                  placeholder="e.g. How to derive the derivation for module 3 question?"
                  className="bg-slate-900/50 border-white/5 h-11"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                  <select
                    className="w-full bg-slate-900/50 border-white/5 rounded-lg h-11 text-sm text-slate-200 px-3 outline-none focus:ring-2 focus:ring-violet-500/50"
                    value={newThread.category}
                    onChange={(e) => setNewThread({ ...newThread, category: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="Conceptual">Conceptual</option>
                    <option value="Numerical">Numerical</option>
                    <option value="Lab/Practical">Lab/Practical</option>
                    <option value="PYQ Help">PYQ Help</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">PYQ Tag (Optional)</label>
                  <Input
                    placeholder="e.g. MU-MAY-2023-Q2a"
                    className="bg-slate-900/50 border-white/5 h-11"
                    value={newThread.pyqTag}
                    onChange={(e) => setNewThread({ ...newThread, pyqTag: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Explanation / Context</label>
                <Textarea
                  placeholder="Provide details about what you're stuck on..."
                  className="bg-slate-900/50 border-white/5 min-h-[120px]"
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-violet-600 hover:bg-violet-500">
                  {isSubmitting ? 'Posting...' : 'Create Discussion'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCommunity;
