'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../lib/api';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';

interface Post {
    postID: number;
    title: string;
    content: string;
    createdAt: string;
    author: {
        username: string;
        fullName: string | null;
    } | null;
}

export default function PostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch posts');
            const data = await response.json();
            setPosts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newPost)
            });
            if (response.ok) {
                setShowForm(false);
                setNewPost({ title: '', content: '' });
                fetchPosts();
            } else {
                throw new Error('Failed to publish announcement');
            }
        } catch (err) {
            handleApiError(err);
        }
    };

    return (
        <div className="animate-fade" style={{ paddingTop: '1rem' }}>
            <header style={{ marginBottom: '3.5rem', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="auth-title" style={{ fontSize: '3.5rem', margin: 0 }}>Knowledge Base</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                        Internal announcements and procedural updates.
                    </p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => setShowForm(!showForm)}
                    style={{ padding: '0.8rem 1.5rem' }}
                >
                    {showForm ? 'Cancel' : '+ New Announcement'}
                </button>
            </header>

            {showForm && (
                <div className="glass animate-fade" style={{ margin: '0 1rem 3rem 1rem', padding: '2rem', borderRadius: '24px' }}>
                    <form onSubmit={(e) => validateAndSubmit(e, handleCreatePost)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Title</label>
                            <input 
                                type="text"
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                value={newPost.title}
                                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                placeholder="Enter announcement title..."
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Content</label>
                            <textarea 
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', minHeight: '150px' }}
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                placeholder="Write your announcement content here..."
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Publish Post</button>
                        <FormErrors errors={validationErrors} />
                        </form>
                </div>
            )}

            <section style={{ padding: '0 1rem' }}>
                {loading ? (
                    <div className="glass" style={{ textAlign: 'center', padding: '3rem', borderRadius: '24px' }}>Retrieving transmissions...</div>
                ) : error ? (
                    <div className="glass" style={{ textAlign: 'center', padding: '3rem', borderRadius: '24px', color: 'var(--error)' }}>{error}</div>
                ) : posts.length === 0 ? (
                    <div className="glass" style={{ textAlign: 'center', padding: '3rem', borderRadius: '24px', color: 'var(--text-muted)' }}>No announcements posted yet.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                        {posts.map((post) => (
                            <article key={post.postID} className="glass animate-fade" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{post.title}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2rem' }}>
                                    {post.content}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        background: 'var(--primary)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 800
                                    }}>
                                        {post.author?.fullName?.[0] || post.author?.username?.[0] || 'U'}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                        {post.author?.fullName || post.author?.username || 'Unknown Operator'}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
