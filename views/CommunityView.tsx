
import React, { useState, useEffect, useRef } from 'react';
import { Post as PostType } from '../types';
import { supabase } from '../lib/supabase';
import PremiumModal from '../components/PremiumModal';

interface CommunityViewProps {
    onBack: () => void;
    onRecipeClick: (recipe: any) => void;
    onChefClick: (chef: any) => void;
    user: any;
}

// La definición de Post ahora viene de types.ts extendida en CommunityView
interface Post extends PostType {
    lastComment?: {
        userName: string;
        content: string;
    };
}

interface Comment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
}

const CommunityView: React.FC<CommunityViewProps> = ({ onBack, onRecipeClick, onChefClick, user }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // States for Comments
    const [commentModalPost, setCommentModalPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    // States for Saves & View Mode
    const [viewMode, setViewMode] = useState<'all' | 'saved'>('all');
    const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
    const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
    const [monthlyCommentCount, setMonthlyCommentCount] = useState(0);
    const [premiumModal, setPremiumModal] = useState<{ isOpen: boolean, reason: 'community-post' | 'community-save' | 'community-comment' }>({
        isOpen: false,
        reason: 'community-post'
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchPosts();
        if (user) {
            fetchSavedPosts();
            fetchLikedPosts();
            fetchMonthlyCommentCount();
        }

        const closeMenu = () => setActiveMenuId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, [user]);

    const fetchLikedPosts = async () => {
        const { data, error } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id);
        if (!error && data) {
            setLikedPostIds(new Set(data.map(l => l.post_id)));
        }
    };

    const fetchMonthlyCommentCount = async () => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', startOfMonth.toISOString());

        if (!error && count !== null) {
            setMonthlyCommentCount(count);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('posts')
            .select('*, profiles!user_id(name, avatar_url)')
            .order('created_at', { ascending: false });

        if (data && data.length > 0) {
            const postsWithComments = await Promise.all(data.map(async (p: any) => {
                const { data: commentData } = await supabase
                    .from('comments')
                    .select('content, profiles(name)')
                    .eq('post_id', p.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                return {
                    id: p.id,
                    userId: p.user_id,
                    userName: p.profiles?.name || 'Chef Anónimo',
                    userAvatar: p.profiles?.avatar_url,
                    recipeId: p.recipe_id,
                    title: p.title,
                    description: p.description,
                    imageUrl: p.image_url,
                    likes: p.likes || 0,
                    createdAt: p.created_at,
                    lastComment: commentData ? {
                        userName: (commentData.profiles as any)?.name || 'Chef Anónimo',
                        content: commentData.content
                    } : undefined
                };
            }));
            setPosts(postsWithComments);
        } else if (!error) {
            setPosts([
                {
                    id: '1',
                    userId: 'user1',
                    userName: 'Chef Alejandro',
                    title: 'Pasta al Pesto Neón',
                    description: 'He preparado esta receta usando el asistente de voz de ChefScan.IA y el resultado ha sido espectacular.',
                    imageUrl: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&q=80&w=1000',
                    likes: 24,
                    createdAt: new Date().toISOString()
                }
            ]);
        } else {
            console.error("Error fetching posts details:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });

            const { data: fallbackData, error: fallbackError } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (!fallbackError && fallbackData) {
                setPosts(fallbackData.map((p: any) => ({
                    id: p.id,
                    userId: p.user_id,
                    userName: 'Chef de la Comunidad',
                    title: p.title,
                    description: p.description,
                    imageUrl: p.image_url,
                    likes: p.likes || 0,
                    createdAt: p.created_at
                })));
            }
        }
        setLoading(false);
    };

    const fetchSavedPosts = async () => {
        const { data, error } = await supabase
            .from('post_saves')
            .select('post_id')
            .eq('user_id', user.id);

        if (!error && data) {
            setSavedPostIds(new Set(data.map(s => s.post_id)));
        }
    };

    const fetchComments = async (postId: string) => {
        setLoadingComments(true);
        const { data, error } = await supabase
            .from('comments')
            .select('*, profiles(name, avatar_url)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setComments(data.map((c: any) => ({
                id: c.id,
                postId: c.post_id,
                userId: c.user_id,
                userName: c.profiles?.name || 'Chef Anónimo',
                userAvatar: c.profiles?.avatar_url,
                content: c.content,
                createdAt: c.created_at
            })));
        }
        setLoadingComments(false);
    };

    const handleToggleSave = async (postId: string) => {
        if (!user) return alert("Inicia sesión para guardar recetas");

        if (!user.isPremium) {
            setPremiumModal({ isOpen: true, reason: 'community-save' });
            return;
        }

        const isSaved = savedPostIds.has(postId);
        const newSaved = new Set(savedPostIds);
        if (isSaved) newSaved.delete(postId);
        else newSaved.add(postId);
        setSavedPostIds(newSaved);

        try {
            if (isSaved) {
                await supabase.from('post_saves').delete().eq('post_id', postId).eq('user_id', user.id);
            } else {
                await supabase.from('post_saves').insert([{ post_id: postId, user_id: user.id }]);
            }
        } catch (err) {
            console.error("Error toggling save:", err);
            setSavedPostIds(savedPostIds);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !commentModalPost || !newComment.trim()) return;

        if (!user.isPremium && monthlyCommentCount >= 5) {
            setPremiumModal({ isOpen: true, reason: 'community-comment' });
            return;
        }

        const content = newComment.trim();
        setNewComment('');

        try {
            const { data, error } = await supabase
                .from('comments')
                .insert([{
                    post_id: commentModalPost.id,
                    user_id: user.id,
                    content: content
                }])
                .select('*, profiles(name, avatar_url)')
                .single();

            if (error) throw error;

            if (data) {
                const newCommentObj = {
                    id: data.id,
                    postId: data.post_id,
                    userId: data.user_id,
                    userName: data.profiles?.name || user.email,
                    userAvatar: data.profiles?.avatar_url,
                    content: data.content,
                    createdAt: data.created_at
                };

                setComments(prev => [...prev, newCommentObj]);
                setMonthlyCommentCount(prev => prev + 1);

                // Actualizar el último comentario en el feed local
                setPosts(prev => prev.map(p => p.id === commentModalPost.id ? {
                    ...p,
                    lastComment: {
                        userName: newCommentObj.userName,
                        content: newCommentObj.content
                    }
                } : p));

                setCommentModalPost(null);
            }
        } catch (err) {
            console.error("Error adding comment:", err);
            alert("No se pudo añadir el comentario");
        }
    };

    const handleSavePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert("Debes iniciar sesión para publicar.");
        if (!formData.title || !formData.imageUrl) return alert("El título y la imagen son obligatorios.");

        setLoading(true);
        try {
            if (isEditing && editingPostId) {
                const { error } = await supabase
                    .from('posts')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        image_url: formData.imageUrl
                    })
                    .eq('id', editingPostId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('posts')
                    .insert([{
                        user_id: user.id,
                        title: formData.title,
                        description: formData.description,
                        image_url: formData.imageUrl,
                        likes: 0
                    }]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            setFormData({ title: '', description: '', imageUrl: '' });
            fetchPosts();
        } catch (err: any) {
            console.error("Error saving post:", err.message);
            alert("Error al guardar la publicación");
        } finally {
            setLoading(false);
        }
    };

    const handleEditPost = (post: Post) => {
        setIsEditing(true);
        setEditingPostId(post.id);
        setFormData({
            title: post.title,
            description: post.description || '',
            imageUrl: post.imageUrl || ''
        });
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return;

        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId);
            if (error) throw error;

            setPosts(prev => prev.filter(p => p.id !== postId));
            setActiveMenuId(null);
        } catch (err: any) {
            console.error("Error deleting post:", err.message);
            alert("No se pudo eliminar la publicación");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("Error uploading image:", err);
            setUploading(false);
        }
    };

    const handleLike = async (postId: string) => {
        if (!user) return;
        if (likedPostIds.has(postId)) return; // Solo una vez

        setLikedPostIds(prev => new Set(prev).add(postId));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));

        try {
            await supabase.rpc('increment_likes', { post_id: postId });
            await supabase.from('post_likes').insert([{ post_id: postId, user_id: user.id }]);
        } catch (err) {
            console.warn("Error incrementing likes:", err);
        }
    };

    const openComments = (post: Post) => {
        setCommentModalPost(post);
        setComments([]);
        fetchComments(post.id);
    };

    const filteredPosts = viewMode === 'all' ? posts : posts.filter(p => savedPostIds.has(p.id));

    return (
        <div className="min-h-screen bg-pure-black pb-24">
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </button>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">COMUNIDAD<span className="text-primary">.IA</span></h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'all' ? 'saved' : 'all')}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 ${viewMode === 'saved'
                            ? 'bg-primary text-black border-primary shadow-glow'
                            : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                            }`}
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: viewMode === 'saved' ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!user?.isPremium) {
                                setPremiumModal({ isOpen: true, reason: 'community-post' });
                            } else {
                                setIsEditing(false);
                                setFormData({ title: '', description: '', imageUrl: '' });
                                setIsModalOpen(true);
                            }
                        }}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-primary">add_a_photo</span>
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-6">
                {viewMode === 'saved' && filteredPosts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in duration-500">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <span className="material-symbols-outlined text-4xl text-zinc-700">bookmark</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black uppercase tracking-tighter">SIN GUARDADOS</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest max-w-[200px]">Las recetas que guardes de la comunidad aparecerán aquí.</p>
                        </div>
                        <button
                            onClick={() => setViewMode('all')}
                            className="px-6 py-3 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
                        >
                            Explorar Comunidad
                        </button>
                    </div>
                )}

                {loading && posts.length === 0 ? (
                    <div className="flex flex-col gap-6 py-10">
                        {[1, 2].map(i => (
                            <div key={i} className="animate-pulse space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-900 rounded-full"></div>
                                    <div className="h-4 w-32 bg-zinc-900 rounded"></div>
                                </div>
                                <div className="aspect-square w-full bg-zinc-900 rounded-3xl"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <article key={post.id} className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                            {/* Post Header */}
                            <div className="p-4 flex items-center justify-between">
                                <div
                                    className="flex items-center gap-3 cursor-pointer"
                                    onClick={() => onChefClick({
                                        name: post.userName,
                                        avatar: post.userAvatar,
                                        level: 4,
                                        recipesCount: 42,
                                        likesCount: 156,
                                        specialty: 'Cocina Fusion'
                                    })}
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary border border-black flex items-center justify-center overflow-hidden">
                                        {post.userAvatar ? (
                                            <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-black">person</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-white uppercase tracking-tight hover:text-primary transition-colors">{post.userName}</span>
                                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Master Chef Nivel 4</span>
                                    </div>
                                </div>

                                {post.userId === user?.id && (
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === post.id ? null : post.id);
                                            }}
                                            className="text-zinc-500 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5"
                                        >
                                            <span className="material-symbols-outlined">more_horiz</span>
                                        </button>

                                        {activeMenuId === post.id && (
                                            <div className="absolute right-0 top-10 w-32 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                                                <button
                                                    onClick={() => handleEditPost(post)}
                                                    className="w-full px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/5 flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                    Eliminar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Post Image */}
                            <div
                                className="w-full pt-[100%] relative group cursor-pointer bg-zinc-900"
                                onClick={() => {
                                    const recipeToOpen = post.recipeId ? { id: post.recipeId } : {
                                        id: `mock-${post.id}`,
                                        title: post.title,
                                        image_url: post.imageUrl,
                                        content: {
                                            ingredients: ["Consulta los ingredientes en el post", "Pizca de creatividad"],
                                            instructions: [post.description || "Sin descripción proporcionada"],
                                            category: "Comunidad"
                                        }
                                    };
                                    onRecipeClick(recipeToOpen);
                                }}
                            >
                                <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <div className="px-6 py-3 bg-primary text-black rounded-full font-black text-[10px] uppercase tracking-widest shadow-glow">Ver Detalles</div>
                                </div>
                            </div>

                            {/* Post Actions */}
                            <div className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            className="flex items-center gap-2 text-white group"
                                        >
                                            <span className={`material-symbols-outlined text-2xl group-active:scale-125 transition-all ${likedPostIds.has(post.id) ? 'text-primary' : 'text-zinc-500'}`} style={{ fontVariationSettings: likedPostIds.has(post.id) ? "'FILL' 1" : "'FILL' 0" }}>local_fire_department</span>
                                            <span className="text-xs font-black">{post.likes}</span>
                                        </button>
                                        <button
                                            onClick={() => openComments(post)}
                                            className="text-white hover:text-primary transition-colors flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleToggleSave(post.id)}
                                        className={`transition-all ${savedPostIds.has(post.id) ? 'text-primary scale-110' : 'text-white hover:text-primary'}`}
                                    >
                                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: savedPostIds.has(post.id) ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-white uppercase">{post.title}</h3>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-3">
                                        {post.description || "¡Compartiendo mi última creación culinaria!"}
                                    </p>

                                    {/* Último Comentario Social Style */}
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                        {post.lastComment ? (
                                            <div className="space-y-1">
                                                <div className="flex gap-2 text-[10px] items-start">
                                                    <span className="font-black text-primary uppercase flex-shrink-0">{post.lastComment.userName}</span>
                                                    <span className="text-zinc-400 font-medium line-clamp-1">{post.lastComment.content}</span>
                                                </div>
                                                <button
                                                    onClick={() => openComments(post)}
                                                    className="text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-primary transition-colors"
                                                >
                                                    Ver todos los comentarios
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => openComments(post)}
                                                className="text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-primary transition-colors"
                                            >
                                                Sé el primero en comentar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </main>

            {/* Modal de Comentarios */}
            {commentModalPost && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-pure-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-md glass-card rounded-[2.5rem] flex flex-col max-h-[85vh] border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
                            <div>
                                <h4 className="text-xs font-black text-primary uppercase tracking-widest">Comentarios</h4>
                                <p className="text-[10px] text-white font-bold truncate max-w-[200px]">{commentModalPost.title}</p>
                            </div>
                            <button onClick={() => setCommentModalPost(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-zinc-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/20">
                            {loadingComments ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-10 opacity-30">
                                    <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Aún no hay comentarios</p>
                                </div>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden border border-white/5">
                                            {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-zinc-600 text-lg flex items-center justify-center h-full">person</span>}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-white uppercase">{comment.userName}</span>
                                                <span className="text-[8px] text-zinc-600 font-mono">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 leading-relaxed bg-white/5 p-3 rounded-2xl rounded-tl-none">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 border-t border-white/5 bg-black/40">
                            <form onSubmit={handleAddComment} className="relative">
                                <input
                                    type="text"
                                    maxLength={100}
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Escribe un comentario..."
                                    className="w-full bg-zinc-900/50 border border-white/10 p-4 pr-12 rounded-2xl text-[10px] text-white focus:border-primary/40 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-primary disabled:opacity-30"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                                <div className="flex justify-end mt-1 px-2">
                                    <span className={`text-[8px] font-mono ${newComment.length > 90 ? 'text-orange-500' : 'text-zinc-600'}`}>{newComment.length}/100</span>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Crear/Editar Publicación */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-pure-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-md glass-card rounded-[2.5rem] flex flex-col max-h-[90vh] border-primary/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">

                        {/* Header Modal - Sticky */}
                        <div className="p-6 sm:p-8 flex justify-between items-center border-b border-white/5 bg-black/40">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">
                                {isEditing ? 'EDITAR' : 'NUEVA'} RECETA<span className="text-primary">.POST</span>
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-zinc-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* Body Modal - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-video rounded-3xl bg-black border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40 transition-all overflow-hidden relative shadow-inner"
                            >
                                {formData.imageUrl ? (
                                    <>
                                        <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Cambiar Imagen</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-4xl text-zinc-700">add_a_photo</span>
                                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center px-4">
                                            {uploading ? 'Procesando...' : 'Pulsa para añadir foto de tu plato'}
                                        </p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center ml-2">
                                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Título del Plato</label>
                                    <span className={`text-[8px] font-mono ${formData.title.length >= 45 ? 'text-orange-500' : 'text-zinc-600'}`}>
                                        {formData.title.length}/50
                                    </span>
                                </div>
                                <input
                                    required
                                    type="text"
                                    maxLength={50}
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black border border-white/5 p-4 rounded-2xl text-xs text-white focus:border-primary/40 outline-none placeholder-zinc-700 transition-all font-bold"
                                    placeholder="Ej: Salmón Glaseado"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center ml-2">
                                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Descripción / Preparación</label>
                                    <span className={`text-[8px] font-mono ${formData.description.length > 180 ? 'text-orange-500' : 'text-zinc-600'}`}>
                                        {formData.description.length}/200
                                    </span>
                                </div>
                                <textarea
                                    rows={3}
                                    maxLength={200}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[10px] text-white focus:border-primary/40 outline-none placeholder-zinc-700 transition-all resize-none font-medium leading-relaxed"
                                    placeholder="Cuéntanos un poco sobre tu creación..."
                                />
                            </div>
                            <div className="pt-2 pb-6">
                                <button
                                    onClick={handleSavePost}
                                    disabled={loading || !formData.imageUrl || !formData.title}
                                    className="w-full py-5 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-glow active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    {loading ? 'PROCESANDO...' : isEditing ? 'ACTUALIZAR POST' : 'LANZAR A LA COMUNIDAD'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PremiumModal
                isOpen={premiumModal.isOpen}
                onClose={() => setPremiumModal(prev => ({ ...prev, isOpen: false }))}
                reason={premiumModal.reason}
            />
        </div>
    );
};

export default CommunityView;
