
import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppView, Recipe, Ingredient } from './types';
import { Layout } from './components/Layout';
import LandingView from './views/LandingView';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import ScannerView from './views/ScannerView';
import ResultsView from './views/ResultsView';
import RecipeDetailView from './views/RecipeDetailView';
import FavoritesView from './views/FavoritesView';
import HistoryView from './views/HistoryView';
import ProfileView from './views/ProfileView';
import ExploreView from './views/ExploreView';
import RecipeLoadingView from './views/RecipeLoadingView';
import NotificationsView from './views/NotificationsView';
import SettingsView from './views/SettingsView';
import CommunityView from './views/CommunityView';
import ProfileDetailView from './views/ProfileDetailView';
import NutritionalDetailView from './views/NutritionalDetailView';
import CookingModeView from './views/CookingModeView';
import AIChatbot from './components/AIChatbot';
import PremiumModal from './components/PremiumModal';
import InventoryView from './views/InventoryView';
import ChallengesView from './views/ChallengesView';
import ResetPasswordView from './views/ResetPasswordView';
import { generateRecipes } from './services/geminiService';
import { supabase } from './lib/supabase';
import { InventoryItem } from './types';
import { base64ToBlob } from './utils/imageUtils';
import { subscribeUserToPush, requestNotificationPermission } from './utils/pushService';



const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    let initialLang: 'es' | 'en' = 'es';
    try {
      initialLang = (localStorage.getItem('chefscan_lang') as 'es' | 'en') || 'es';
    } catch (e) {
      console.warn("localStorage not available for language", e);
    }

    return {
      user: null,
      currentView: 'landing',
      previousView: null,
      scannedIngredients: [],
      recentRecipes: [],
      favoriteRecipes: [],
      recipeGenerationsToday: 0,
      chefCredits: 10,
      inventory: [],
      history: [],
      userTags: [],
      acceptedChallengeId: null,
      language: initialLang
    };
  });


  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedChef, setSelectedChef] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('chefscan_theme');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  const [lastUsedIngredients, setLastUsedIngredients] = useState<string[]>([]);
  const [lastUsedPortions, setLastUsedPortions] = useState<number>(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAIFinished, setIsAIFinished] = useState(false);
  const [premiumModal, setPremiumModal] = useState<{
    isOpen: boolean,
    reason: 'recipes' | 'nutrition' | 'chefbot' | 'more-recipes' | 'community-post' | 'community-save' | 'community-comment' | 'upgrade' | 'pantry-limit' | 'favorites-limit'
  }>({
    isOpen: false,
    reason: 'recipes'
  });

  // Track sub-views for each main tab
  const [lastTabViews, setLastTabViews] = useState<Record<string, AppView>>({
    dashboard: 'dashboard',
    favorites: 'favorites',
    inventory: 'inventory',
    community: 'community'
  });

  // PWA Update State
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateServiceWorkerRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);


  // Sync theme with Document
  useEffect(() => {
    try {
      localStorage.setItem('chefscan_theme', String(isDarkMode));
    } catch (e) { }

    const root = document.documentElement;
    // Force Dark Mode on specific 'immersive' pages
    const forcedDarkViews = ['landing', 'login', 'reset-password', 'dashboard'];
    const actuallyDark = isDarkMode || forcedDarkViews.includes(state.currentView);

    if (actuallyDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.style.backgroundColor = '#000000';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [isDarkMode, state.currentView]);



  // Unified Startup Logic: Auth + Persistence
  useEffect(() => {
    // IMPORTANT: Register the auth listener FIRST, before any async calls
    // This ensures we catch the SIGNED_IN event from OAuth redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth Event:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session) {
        // User just signed in (manual or OAuth)
        console.log('✅ User signed in, fetching profile...');
        fetchProfile(session.user.id, session.user.email || '', true);
      } else if (event === 'INITIAL_SESSION' && session) {
        // App loaded with existing session
        console.log('🔄 Initial session detected');
        // Don't redirect here - let initializeApp handle cached state
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        localStorage.removeItem('chefscan_state');
        setState(prev => ({
          ...prev,
          user: null,
          currentView: 'landing',
          chefCredits: 10,
          inventory: [],
          history: [],
          favoriteRecipes: []
        }));
        setSelectedRecipe(null);
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 Password recovery event');
        navigateTo('reset-password');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token was refreshed, user is still logged in
        console.log('🔄 Token refreshed');
      }
    });

    // Now handle initial app state
    const initializeApp = async () => {
      try {
        // 1. Get current session
        const { data: { session } } = await supabase.auth.getSession();

        // 2. Check for recovery flow ONLY (not OAuth - that's handled by onAuthStateChange)
        const hash = window.location.hash;
        const isRecovery = hash && hash.includes('type=recovery');

        if (isRecovery) {
          console.log('🔄 Password recovery flow detected');
          navigateTo('reset-password');
          // Clean URL hash after a short delay
          setTimeout(() => {
            window.history.replaceState(null, '', window.location.pathname);
          }, 500);
          return; // Don't process further for recovery
        }

        // 3. If there's a hash with access_token but NOT recovery, it's OAuth redirect
        // The onAuthStateChange listener will handle this, just clean the URL
        if (hash && hash.includes('access_token')) {
          console.log('🔑 OAuth redirect detected, waiting for auth event...');
          setTimeout(() => {
            window.history.replaceState(null, '', window.location.pathname);
          }, 1000);
          return; // Let onAuthStateChange handle it
        }

        // 4. Handle Persistence with Security (only if no special flow)
        const savedState = localStorage.getItem('chefscan_state');

        if (savedState && session) {
          const parsed = JSON.parse(savedState);
          // If user changed, clear cache
          if (parsed.user?.id && parsed.user.id !== session.user.id) {
            localStorage.removeItem('chefscan_state');
          } else {
            // Apply cached state
            setState(prev => ({
              ...prev,
              ...parsed,
              currentView: parsed.currentView || 'dashboard',
            }));
            if (parsed.selectedRecipe) setSelectedRecipe(parsed.selectedRecipe);
            if (parsed.lastTabViews) setLastTabViews(parsed.lastTabViews);
          }
        } else if (!session) {
          // No session, no cached user? Clear any stale state
          localStorage.removeItem('chefscan_state');
        }

        // 5. If we have a session but no cached state, fetch profile
        if (session && !savedState) {
          fetchProfile(session.user.id, session.user.email || '', true);
        } else if (session && savedState) {
          // Refresh profile data but don't force redirect
          fetchProfile(session.user.id, session.user.email || '', false);
        }
      } catch (err) {
        console.warn('Initialization error:', err);
      }
    };

    initializeApp();

    return () => subscription.unsubscribe();
  }, []);


  // Service Worker Registration & Update Detection (Manual for Maximum Compatibility)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Use relative path for sw.js to support subdirectories
      navigator.serviceWorker.register('sw.js').then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                setNeedRefresh(true);
                updateServiceWorkerRef.current = async (reload = true) => {
                  try {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    if (reload) {
                      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  } catch (err) {
                    console.warn("Update failed, reloading anyway", err);
                    window.location.reload();
                  }
                };
              }
            });
          }
        });
      }).catch(err => {
        console.warn('SW registration failed:', err);
      });
    }
  }, []);



  const handleUpdatePWA = () => {
    if (updateServiceWorkerRef.current) {
      updateServiceWorkerRef.current(true);
      setNeedRefresh(false);
    } else {
      window.location.reload();
    }
  };






  // Persistence: Save to LocalStorage
  useEffect(() => {
    if (state.user) {
      try {
        localStorage.setItem('chefscan_state', JSON.stringify({
          user: state.user,
          favoriteRecipes: state.favoriteRecipes,
          recentRecipes: state.recentRecipes,
          inventory: state.inventory,
          history: state.history,
          currentView: state.currentView,
          previousView: state.previousView,
          selectedRecipe: selectedRecipe,
          lastTabViews: lastTabViews,
          language: state.language
        }));
        localStorage.setItem('chefscan_lang', state.language);
      } catch (e) { }
    }
  }, [state.user, state.favoriteRecipes, state.recentRecipes, state.inventory, state.history, state.currentView, selectedRecipe, lastTabViews]);


  // Deep Linking for Shared Recipes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedRecipeId = params.get('recipeId');
    if (sharedRecipeId) {
      loadSharedRecipe(sharedRecipeId);
    }
  }, []);

  const loadSharedRecipe = async (id: string) => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (data && !error) {
      const recipe: Recipe = {
        ...data.content,
        id: data.id,
        imageUrl: data.image_url,
        nutriScore: data.nutri_score
      };
      setSelectedRecipe(recipe);
      navigateTo('recipe-detail');
    }
  };

  const fetchProfile = async (userId: string, email: string, isInitialLoad = false) => {
    let profileData: any = null;

    // Try to fetch profile with a small retry mechanism/delay for new users
    try {
      const fetchAttempt = async () => await supabase.rpc('get_profile_with_reset', { target_user_id: userId }).single();

      let { data, error } = await fetchAttempt();

      // If no profile found (Race Condition on SignUp), wait 1s and try once more
      if (!data || error) {
        await new Promise(r => setTimeout(r, 1000));
        const retry = await fetchAttempt();
        data = retry.data;
        error = retry.error;
      }

      profileData = data;
      profileData = data;
    } catch (e) {
      console.warn("Profile fetch (RPC) failed:", e);
      // Fallback: Try direct select
      const { data: directData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (directData) {
        profileData = directData;
      } else {
        // Fallback: Lazy Create Profile if missing (Self-healing)
        console.warn("Profile missing, attempting lazy creation...");
        const { data: newProfile, error: createError } = await supabase.from('profiles').insert({
          id: userId,
          username: email.split('@')[0].slice(0, 10),
          email: email,
          name: email.split('@')[0],
          chef_credits: 10,
          created_at: new Date().toISOString()
        }).select().single();

        if (newProfile && !createError) {
          profileData = newProfile;
        } else {
          console.error("Failed to lazy create profile:", createError);
        }
      }
    }

    // --- CLIENT-SIDE RESET GUARD ---
    // If the DB reset logic fails, we force a reset the first time the user opens the app on a new day.
    if (profileData) {
      const today = new Date().toISOString().split('T')[0];
      const localResetKey = `chefscan_reset_${userId}`;
      const lastLocalReset = localStorage.getItem(localResetKey);

      if (lastLocalReset !== today) {
        // It's a new day or first time loading. Check if we actually need to reset.
        // We only reset if the generations > 0 or credits < default.
        const defaultCredits = profileData.is_premium ? 999 : 10;

        if (profileData.recipe_generations_today > 0 || profileData.chef_credits !== defaultCredits) {
          console.log("New day detected (Client-side). Resetting credits and generations...");
          const { error: resetError } = await supabase
            .from('profiles')
            .update({
              recipe_generations_today: 0,
              chef_credits: defaultCredits
            })
            .eq('id', userId);

          if (!resetError) {
            localStorage.setItem(localResetKey, today);
            profileData.recipe_generations_today = 0;
            profileData.chef_credits = defaultCredits;
          }
        } else {
          // Already reset or new account, just mark as reset today
          localStorage.setItem(localResetKey, today);
        }
      }
    }
    // ---------------------------------

    // Prepare default/fallback data if profile still missing
    const fallbackUser = {
      id: userId,
      name: email.split('@')[0],
      username: email.split('@')[0].slice(0, 10),
      email: email,
      isPremium: false,
      avatarUrl: null,
      allergies: [],
      cookingGoal: 'explorar',
      recipeGenerationsToday: 0,
      chefCredits: 10
    };

    // Safe Profile Data (DB or Fallback)
    const finalUser = profileData ? {
      id: userId,
      name: profileData.name || email.split('@')[0],
      username: profileData.username || (profileData.name ? (() => {
        const parts = profileData.name.trim().split(' ');
        return parts.length >= 2 ? `${parts[0]} ${parts[1][0]}` : parts[0];
      })().slice(0, 10) : email.split('@')[0].slice(0, 10)),
      email: email,
      isPremium: profileData.is_premium,
      avatarUrl: profileData.avatar_url,
      allergies: profileData.allergies,
      cookingGoal: profileData.cooking_goal,
      bio: profileData.bio,
      phone: profileData.phone,
      recipeGenerationsToday: profileData.recipe_generations_today || 0,
      chefCredits: profileData.chef_credits ?? (profileData.is_premium ? 999 : 10)
    } : fallbackUser;

    // Fetch sub-data (Favorites, History, Inventory) - Safe to be empty
    const { data: favs } = await supabase.from('favorites').select('*, recipes(*)').eq('user_id', userId);
    const { data: hist } = await supabase.from('history').select('*, recipes(*)').eq('user_id', userId).order('created_at', { ascending: false });
    const { data: inv } = await supabase.from('inventory').select('*').eq('user_id', userId).order('expiry_date', { ascending: true });
    const { data: utags } = await supabase.from('user_tags').select('name').eq('user_id', userId);

    const finalTags = utags?.map((t: any) => t.name) || [];

    setState(prev => ({
      ...prev,
      user: finalUser,
      inventory: (inv?.map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        expiryDate: i.expiry_date,
        createdAt: i.created_at
      })) || []),
      favoriteRecipes: (favs?.map((f: any) => ({
        ...f.recipes.content,
        id: f.recipes.id,
        imageUrl: f.recipes.image_url,
        nutriScore: f.recipes.nutri_score,
        category: f.category
      })) || []) as Recipe[],
      history: (hist?.map((h: any) => ({
        id: h.recipes?.id,
        ingredient: h.main_ingredient || 'Desconocido',
        recipe: h.recipes?.title || 'Generación',
        date: new Date(h.created_at).toLocaleDateString(),
        time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: h.recipes?.image_url,
        category: h.recipes?.content?.category,
        fullRecipeData: h.recipes ? {
          ...h.recipes.content,
          id: h.recipes.id,
          imageUrl: h.recipes.image_url,
          nutriScore: h.recipes.nutri_score
        } : null
      })) || []),
      userTags: finalTags,
      // CRÍTICO: Siempre ir al dashboard si es carga inicial (OAuth o login manual)
      currentView: isInitialLoad ? 'dashboard' : prev.currentView,
      recipeGenerationsToday: finalUser.recipeGenerationsToday,
      chefCredits: finalUser.chefCredits
    }));

    // Handle Push Notifications Subscription
    setTimeout(async () => {
      try {
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          await subscribeUserToPush(userId);
        }
      } catch (e) {
        console.warn('Push registration skipped:', e);
      }
    }, 2000); // Small delay to ensure core UI is ready
  };

  const navigateTo = (view: AppView) => {
    setState(prev => {
      // Vistas de detalle que no deben sobrescribir el origen principal
      const secondaryViews: AppView[] = ['recipe-detail', 'nutritional-detail', 'cooking-mode'];
      const isSecondary = secondaryViews.includes(view);
      const wasSecondary = secondaryViews.includes(prev.currentView);

      const nextPreviousView = !wasSecondary ? prev.currentView : prev.previousView;

      // Update last active view for the corresponding tab
      const dashboardViews: AppView[] = ['dashboard', 'results', 'notifications', 'challenges', 'history', 'settings', 'profile'];
      const communityViews: AppView[] = ['community', 'explore', 'profile-detail'];

      if (dashboardViews.includes(view)) setLastTabViews(v => ({ ...v, dashboard: view }));
      else if (view === 'favorites') setLastTabViews(v => ({ ...v, favorites: 'favorites' }));
      else if (view === 'inventory') setLastTabViews(v => ({ ...v, inventory: 'inventory' }));
      else if (communityViews.includes(view)) setLastTabViews(v => ({ ...v, community: view }));

      return {
        ...prev,
        previousView: nextPreviousView,
        currentView: view
      };
    });
  };

  const checkDailyLimit = () => {
    const dailyLimit = state.user?.isPremium ? 6 : 2;
    if (state.recipeGenerationsToday >= dailyLimit) {
      setPremiumModal({ isOpen: true, reason: 'recipes' });
      return true;
    }
    return false;
  };

  const handleNavClick = (view: AppView) => {
    // Check limit if trying to access scanner via bottom nav
    if (view === 'scanner') {
      if (checkDailyLimit()) return;
    }

    // If clicking a root tab view, resolve to its last active sub-view
    const rootViews: AppView[] = ['dashboard', 'favorites', 'inventory', 'community'];
    if (rootViews.includes(view)) {
      navigateTo(lastTabViews[view]);
    } else {
      navigateTo(view);
    }
  };

  const handleLogin = (user: any) => {
    setState(prev => ({
      ...prev,
      user,
      currentView: 'dashboard',
      chefCredits: user.isPremium ? 999 : 10
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleShare = async () => {
    if (!selectedRecipe?.id) return;
    const shareUrl = `http://chefscania.com/?recipeId=${selectedRecipe.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `ChefScan.IA: ${selectedRecipe.title}`,
          text: `¡Mira esta receta increíble que encontré en ChefScan.IA: ${selectedRecipe.title}! 🍳`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('¡Enlace de receta copiado al portapapeles!');
    }
  };

  const handleUpdateUser = async (updates: any) => {
    if (!state.user?.id) return;

    // Persist to Supabase
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.username) dbUpdates.username = updates.username;
    if (updates.allergies) dbUpdates.allergies = updates.allergies;
    if (updates.cookingGoal) dbUpdates.cooking_goal = updates.cookingGoal;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', state.user.id);

    if (!error) {
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null
      }));
    }
  };

  const handleCreateTag = async (tagName: string) => {
    if (!state.user?.id || !tagName.trim()) return;

    // Evitar duplicados
    if (state.userTags.includes(tagName.trim())) return;

    const { error } = await supabase
      .from('user_tags')
      .insert({ user_id: state.user.id, name: tagName.trim() });

    if (!error) {
      setState(prev => ({
        ...prev,
        userTags: [...prev.userTags, tagName.trim()]
      }));
    }
  };

  const handleUpdateTag = async (oldName: string, newName: string) => {
    if (!state.user?.id || !newName.trim()) return;

    // update in user_tags table
    const { error: tagError } = await supabase
      .from('user_tags')
      .update({ name: newName.trim() })
      .eq('user_id', state.user.id)
      .eq('name', oldName);

    if (!tagError) {
      // also update in favorites table to maintain consistency
      await supabase
        .from('favorites')
        .update({ category: newName.trim() })
        .eq('user_id', state.user.id)
        .eq('category', oldName);

      setState(prev => ({
        ...prev,
        userTags: prev.userTags.map(t => t === oldName ? newName.trim() : t),
        favoriteRecipes: prev.favoriteRecipes.map(r => r.category === oldName ? { ...r, category: newName.trim() } : r)
      }));
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    if (!state.user?.id) return;

    const { error: tagError } = await supabase
      .from('user_tags')
      .delete()
      .eq('user_id', state.user.id)
      .eq('name', tagName);

    if (!tagError) {
      // Also update favorites that were using this tag to 'Otra' or null
      await supabase
        .from('favorites')
        .update({ category: 'Otra' })
        .eq('user_id', state.user.id)
        .eq('category', tagName);

      setState(prev => ({
        ...prev,
        userTags: prev.userTags.filter(t => t !== tagName),
        favoriteRecipes: prev.favoriteRecipes.map(r => r.category === tagName ? { ...r, category: 'Otra' } : r)
      }));
    }
  };

  const handleInventoryAdd = async (name: string, quantity: number, unit: string, expiryDate?: string) => {
    if (!state.user?.id) return;

    // Check Inventory Limits
    const limit = state.user?.isPremium ? 30 : 5;
    if (state.inventory.length >= limit) {
      setPremiumModal({ isOpen: true, reason: 'pantry-limit' });
      return;
    }
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        user_id: state.user.id,
        name,
        quantity,
        unit,
        expiry_date: expiryDate
      })
      .select()
      .single();

    if (data && !error) {
      const newItem: InventoryItem = {
        id: data.id,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        expiryDate: data.expiry_date,
        createdAt: data.created_at
      };
      setState(prev => ({ ...prev, inventory: [newItem, ...prev.inventory] }));
    }
  };

  const handleInventoryDelete = async (id: string) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (!error) {
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.filter(item => item.id !== id)
      }));
    }
  };

  const handleInventoryUpdate = async (id: string, updates: Partial<InventoryItem>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.quantity) dbUpdates.quantity = updates.quantity;
    if (updates.unit) dbUpdates.unit = updates.unit;
    if (updates.expiryDate) dbUpdates.expiry_date = updates.expiryDate;

    const { error } = await supabase.from('inventory').update(dbUpdates).eq('id', id);
    if (!error) {
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.map(item => item.id === id ? { ...item, ...updates } : item)
      }));
    }
  };

  const handleScanComplete = async (ingredients: Ingredient[], image64: string) => {
    setState(prev => ({
      ...prev,
      scannedIngredients: ingredients,
      scannedImage: image64,
      recipeGenerationsToday: prev.recipeGenerationsToday + 1
    }));

    // Actualizar límite en DB
    if (state.user?.id) {
      await supabase.rpc('increment_recipe_generations', { user_id: state.user.id });
    }

    // Persistencia en Supabase si el usuario está logueado
    if (state.user?.id) {
      try {
        const fileName = `${state.user.id}/scan_${Date.now()}.jpg`;
        const blob = base64ToBlob(image64, 'image/jpeg');

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars') // Usamos 'avatars' por ahora como el bucket principal
          .upload(`scans/${fileName}`, blob);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(`scans/${fileName}`);

          await supabase.from('ingredient_scans').insert({
            user_id: state.user.id,
            image_url: publicUrl,
            ingredients: ingredients
          });
          console.log("Scan saved to DB and storage");
        } else {
          console.error("Upload error:", uploadError);
        }
      } catch (err) {
        console.error("Error saving scan to storage:", err);
      }
    }
  };

  const handleStartGeneration = async (ingredients: string[], portions: number, itemId?: string) => {
    // Si viene de un desafío de "desperdicio cero", marcamos el ID del reto como aceptado
    // para que no vuelva a aparecer en el dashboard, pero lo mantenemos en la despensa.
    if (itemId) {
      setState(prev => ({ ...prev, acceptedChallengeId: itemId }));
    }

    // Check Limits
    const dailyLimit = state.user?.isPremium ? 6 : 2;
    if (state.recipeGenerationsToday >= dailyLimit) {
      setPremiumModal({ isOpen: true, reason: 'recipes' });
      return;
    }

    setLastUsedIngredients(ingredients);
    setLastUsedPortions(portions);
    setIsAIFinished(false);
    navigateTo('loading-recipes');

    try {
      // Normalize ingredients
      const normalizedIngredients = ingredients.map(i => i.trim().toLowerCase());
      const recipeCount = state.user?.isPremium ? 5 : 3;

      const recipes = await generateRecipes(
        normalizedIngredients,
        portions,
        !!state.user?.isPremium,
        state.user?.allergies,
        state.user?.cookingGoal,
        recipeCount,
        state.language
      );
      setIsAIFinished(true);

      // Delay slightly for dramatic effect of 100% progress
      setTimeout(async () => {
        let savedRecipeId = null;

        // Persist history to DB
        if (state.user?.id && recipes && recipes.length > 0) {
          // First save the best recipe to the recipes table for the history link
          const { data: dbRecipe } = await supabase
            .from('recipes')
            .insert({
              title: recipes[0].title,
              description: recipes[0].description,
              content: recipes[0],
              image_url: recipes[0].imageUrl,
              nutri_score: recipes[0].nutriScore
            })
            .select()
            .single();

          if (dbRecipe) {
            savedRecipeId = dbRecipe.id;
            await supabase.from('history').insert({
              user_id: state.user.id,
              recipe_id: dbRecipe.id,
              main_ingredient: normalizedIngredients[0] || "manual"
            });
          }
        }

        setState(prev => ({
          ...prev,
          recentRecipes: recipes,
          currentView: 'results',
          recipeGenerationsToday: prev.recipeGenerationsToday + 1,
          chefCredits: prev.user?.isPremium ? 999 : prev.chefCredits,
          history: [
            {
              id: savedRecipeId,
              ingredient: normalizedIngredients[0] || "manual",
              recipe: recipes[0]?.title || "Exploración",
              date: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              imageUrl: recipes[0]?.imageUrl,
              category: recipes[0]?.category,
              fullRecipeData: recipes[0]
            },
            ...prev.history
          ]
        }));

        // Actualizar límite en DB
        if (state.user?.id) {
          await supabase.rpc('increment_recipe_generations', { user_id: state.user.id });
        }
      }, 800);
    } catch (error) {
      console.error("Error generating recipes:", error);
      navigateTo('dashboard');
    }
  };

  const handleGenerateMore = async () => {
    // Free users see the button as a hook, but clicking triggers premium modal
    if (!state.user?.isPremium) {
      setPremiumModal({ isOpen: true, reason: 'more-recipes' });
      return;
    }

    if (state.recentRecipes.length >= 15 || loadingMore) return;

    setLoadingMore(true);
    try {
      const moreRecipes = await generateRecipes(lastUsedIngredients, lastUsedPortions, !!state.user?.isPremium);
      setState(prev => ({
        ...prev,
        recentRecipes: [...prev.recentRecipes, ...moreRecipes].slice(0, 15)
      }));
    } catch (error) {
      console.error("Error generating more recipes:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    let finalRecipe = recipe;

    // If it's a freshly generated recipe (id is likely not a UUID)
    // We save it to make it sharable via Deep Linking
    if (recipe.id.length < 10) {
      const { data: savedRecipe } = await supabase
        .from('recipes')
        .insert({
          title: recipe.title,
          description: recipe.description,
          content: recipe,
          image_url: recipe.imageUrl,
          nutri_score: recipe.nutriScore
        })
        .select()
        .single();

      if (savedRecipe) {
        finalRecipe = {
          ...recipe,
          id: savedRecipe.id
        };
      }
    }

    setSelectedRecipe(finalRecipe);
    navigateTo('recipe-detail');
  };

  const toggleFavorite = async (recipe: Recipe, category: string = 'Otra') => {
    if (!state.user?.id) return;

    // Comprobación de existencia en favoritos (por ID real o por contenido para IDs temporales)
    const favoriteMatch = state.favoriteRecipes.find(r =>
      r.id === recipe.id || (r.title === recipe.title && r.description === recipe.description)
    );

    const isFavorite = !!favoriteMatch;

    if (isFavorite) {
      // Toggle: Eliminar de favoritos
      // Usamos el ID de la receta que ya está en la lista de favoritos (que será el ID permanente)
      const targetId = favoriteMatch.id;

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', state.user.id)
        .eq('recipe_id', targetId);

      if (!error) {
        setState(prev => ({
          ...prev,
          favoriteRecipes: prev.favoriteRecipes.filter(r => r.id !== targetId),
          // Si estamos en recientes, reseteamos el ID a uno temporal para que visualmente sepa que ya no es favorito persistente
          recentRecipes: prev.recentRecipes.map(r =>
            (r.title === recipe.title && r.description === recipe.description) ? { ...r, id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` } : r
          )
        }));

        if (selectedRecipe?.id === targetId) {
          const { category, ...recipeWithoutCategory } = selectedRecipe;
          setSelectedRecipe(recipeWithoutCategory as Recipe);
        }
      }
    } else {
      // Permitimos hasta 5 favoritos para usuarios FREE
      if (!state.user?.isPremium && state.favoriteRecipes.length >= 5) {
        setPremiumModal({ isOpen: true, reason: 'favorites-limit' });
        return;
      }

      // Add to favorites
      let permanentId = recipe.id;

      // Ensure recipe is in the recipes table (if it's a new generation without UUID)
      if (typeof recipe.id === 'string' && recipe.id.length < 30) {
        const { data: newRecipe } = await supabase
          .from('recipes')
          .insert({
            title: recipe.title,
            description: recipe.description,
            content: recipe,
            image_url: recipe.imageUrl,
            nutri_score: recipe.nutriScore
          })
          .select()
          .single();

        if (newRecipe) permanentId = newRecipe.id;
      }

      const { error: favError } = await supabase
        .from('favorites')
        .insert({
          user_id: state.user.id,
          recipe_id: permanentId,
          category: category
        });

      if (!favError) {
        const updatedRecipe = { ...recipe, id: permanentId, category };

        setSelectedRecipe(updatedRecipe);
        setState(prev => ({
          ...prev,
          favoriteRecipes: [updatedRecipe, ...prev.favoriteRecipes],
          recentRecipes: prev.recentRecipes.map(r =>
            (r.title === recipe.title && r.description === recipe.description) ? updatedRecipe : r
          )
        }));
      } else {
        console.error("Error saving favorite:", favError);
      }
    }
  };

  // Content Switching
  const renderView = () => {
    switch (state.currentView) {
      case 'landing':
        return <LandingView onStart={() => navigateTo('login')} />;
      case 'login':
        return (
          <Layout showNav={false}>
            <LoginView
              onLogin={handleLogin}
              onBack={() => navigateTo('landing')}
            />
          </Layout>
        );
      case 'reset-password':
        return (
          <Layout showNav={false}>
            <ResetPasswordView
              onSuccess={() => navigateTo('dashboard')}
              onBack={() => navigateTo('login')}
            />
          </Layout>
        );
      case 'dashboard':
        return (
          <Layout activeNav="dashboard" onNavClick={handleNavClick}>
            <DashboardView
              user={state.user}
              recentRecipes={state.recentRecipes}
              favoriteRecipes={state.favoriteRecipes}
              scannedIngredients={state.scannedIngredients}
              scannedImage={state.scannedImage}
              onClearScanned={() => setState(prev => ({ ...prev, scannedIngredients: [], scannedImage: undefined }))}
              onScanClick={() => {
                if (!checkDailyLimit()) navigateTo('scanner');
              }}
              onRecipeClick={handleSelectRecipe}
              onGenerate={() => { }}
              onToggleFavorite={toggleFavorite}
              onStartGeneration={handleStartGeneration}
              onExploreClick={() => navigateTo('explore')}
              onNotificationsClick={() => navigateTo('notifications')}
              onSettingsClick={() => navigateTo('settings')}
              onNavClick={handleNavClick}
              onComplete={handleScanComplete}
              onAddItem={handleInventoryAdd}
              inventory={state.inventory}
              recipeGenerationsToday={state.recipeGenerationsToday}
              onShowPremiumModal={() => setPremiumModal({ isOpen: true, reason: 'recipes' })}
              acceptedChallengeId={state.acceptedChallengeId}
              onBack={() => navigateTo('landing')}

              userTags={state.userTags}
              onCreateTag={handleCreateTag}
              onUpdateTag={handleUpdateTag}
              onDeleteTag={handleDeleteTag}
              language={state.language}
              isUpdateAvailable={needRefresh}
            />
          </Layout>
        );
      case 'community':
        return (
          <Layout activeNav="community" onNavClick={handleNavClick}>
            <CommunityView
              user={state.user}
              onBack={() => navigateTo('dashboard')}
              onRecipeClick={(recipe: any) => handleSelectRecipe(recipe)}
              onChefClick={(chef) => {
                setSelectedChef(chef);
                navigateTo('profile-detail');
              }}
              language={state.language}
            />
          </Layout>
        );
      case 'profile-detail':
        return (
          <Layout activeNav="community" onNavClick={handleNavClick}>
            <ProfileDetailView
              chef={selectedChef || { name: 'Chef Invitado', level: 1, recipesCount: 0, likesCount: 0, specialty: 'Cocinero Casual' }}
              onBack={() => navigateTo('community')}
              language={state.language}
            />
          </Layout>
        );
      case 'notifications':
        return (
          <Layout activeNav="dashboard" onNavClick={handleNavClick}>
            <NotificationsView
              onBack={() => navigateTo('dashboard')}
              language={state.language}
              inventory={state.inventory}
              onGenerateRecipe={(ingredients) => handleStartGeneration(ingredients, 2)}
              isUpdateAvailable={needRefresh}
              onUpdateAction={handleUpdatePWA}
              userId={state.user?.id}
            />


          </Layout>
        );
      case 'challenges':
        return (
          <Layout activeNav="dashboard" onNavClick={handleNavClick}>
            <ChallengesView
              inventory={state.inventory}
              onBack={() => navigateTo('dashboard')}
              onAcceptChallenge={(item) => handleStartGeneration([item.name], 2, item.id)}
              onViewInventory={() => navigateTo('inventory')}
              language={state.language}
            />
          </Layout>
        );
      case 'inventory':
        return (
          <Layout activeNav="inventory" onNavClick={handleNavClick}>
            <InventoryView
              inventory={state.inventory}
              onAddItem={handleInventoryAdd}
              onDeleteItem={handleInventoryDelete}
              onUpdateItem={handleInventoryUpdate}
              onStartGeneration={handleStartGeneration}
              acceptedChallengeId={state.acceptedChallengeId}
              onBack={() => navigateTo('dashboard')}
              language={state.language}
            />
          </Layout>
        );
      case 'settings':
        return (
          <Layout activeNav="dashboard" onNavClick={handleNavClick}>
            <SettingsView
              onBack={() => navigateTo('dashboard')}
              user={state.user}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              stats={{
                recipes: state.inventory.length,
                favorites: state.favoriteRecipes.length,
                generated: state.history.length
              }}
              language={state.language}
              onLanguageChange={(lang: 'es' | 'en') => setState(prev => ({ ...prev, language: lang }))}
              isDarkMode={isDarkMode}
              onThemeToggle={() => setIsDarkMode(!isDarkMode)}
            />
          </Layout>
        );
      case 'loading-recipes':
        return (
          <Layout showNav={false}>
            <RecipeLoadingView
              isFinished={isAIFinished}
              onCancel={() => navigateTo('dashboard')}
            />
          </Layout>
        );
      case 'explore':
        return (
          <Layout activeNav="community" onNavClick={handleNavClick}>
            <ExploreView
              onBack={() => navigateTo('dashboard')}
              onRecipeClick={handleSelectRecipe}
              language={state.language}
            />
          </Layout>
        );
      case 'scanner':
        return (
          <Layout showNav={false}>
            <ScannerView
              onCancel={() => navigateTo('dashboard')}
              onComplete={handleScanComplete}
              onReadyToGenerate={() => navigateTo('dashboard')}
              language={state.language}
            />
          </Layout>
        );
      case 'results':
        return (
          <Layout activeNav="dashboard" onNavClick={handleNavClick}>
            <ResultsView
              recipes={state.recentRecipes}
              onRecipeClick={handleSelectRecipe}
              onBack={() => navigateTo('dashboard')}
              isPremium={state.user?.isPremium}
              onGenerateMore={handleGenerateMore}
              loadingMore={loadingMore}
              language={state.language}
            />
          </Layout>
        );
      case 'recipe-detail':
        return (
          <Layout showNav={false}>
            <RecipeDetailView
              recipe={selectedRecipe}
              isFavorite={state.favoriteRecipes.some(r =>
                r.id === selectedRecipe?.id ||
                (selectedRecipe && r.title === selectedRecipe.title && r.description === selectedRecipe.description)
              )}
              onToggleFavorite={(category) => selectedRecipe && toggleFavorite(selectedRecipe, category)}
              onBack={() => {
                if (state.previousView) {
                  navigateTo(state.previousView);
                } else {
                  navigateTo('dashboard');
                }
              }}
              onNutritionClick={() => navigateTo('nutritional-detail')}
              onStartCooking={() => navigateTo('cooking-mode')}
              onShare={handleShare}
              isPremium={state.user?.isPremium}
              onShowPremium={(reason) => setPremiumModal({ isOpen: true, reason })}
              userTags={state.userTags}
              onCreateTag={handleCreateTag}
              onUpdateTag={handleUpdateTag}
              onDeleteTag={handleDeleteTag}
              language={state.language}
            />
          </Layout>
        );
      case 'nutritional-detail':
        return (
          <Layout showNav={false}>
            <NutritionalDetailView
              recipe={selectedRecipe}
              onBack={() => navigateTo('recipe-detail')}
            />
          </Layout>
        );
      case 'cooking-mode':
        return (
          <Layout showNav={false}>
            <CookingModeView
              recipe={selectedRecipe}
              onClose={() => navigateTo('recipe-detail')}
              language={state.language}
            />
          </Layout>
        );
      case 'favorites':
        return (
          <Layout activeNav="favorites" onNavClick={handleNavClick}>
            <FavoritesView
              recipes={state.favoriteRecipes}
              userTags={state.userTags}
              onRecipeClick={handleSelectRecipe}
              onBack={() => navigateTo('dashboard')}
              language={state.language}
            />
          </Layout>
        );
      case 'history':
        return (
          <Layout activeNav="history" onNavClick={handleNavClick}>
            <HistoryView
              history={state.history}
              onBack={() => navigateTo('dashboard')}
              onRecipeClick={handleSelectRecipe}
              language={state.language}
            />
          </Layout>
        );
      case 'profile':
        return (
          <Layout activeNav="profile" onNavClick={handleNavClick}>
            <ProfileView
              user={state.user}
              onLogout={handleLogout}
              onEditProfile={() => navigateTo('settings')}
            />
          </Layout>
        );
      default:
        return <div>View not implemented</div>;
    }
  };

  const showChatbot = !['landing', 'login', 'scanner', 'loading-recipes'].includes(state.currentView);

  const isFullWidthView = ['landing', 'scanner'].includes(state.currentView);

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }} className="min-h-screen flex flex-col items-center overflow-x-hidden">
      <div style={{ borderColor: 'var(--card-border)' }} className={`w-full h-screen relative overflow-hidden flex flex-col items-center ${!isFullWidthView ? 'max-w-[430px] border-x' : ''}`}>
        {renderView()}
        {showChatbot && (
          <AIChatbot
            isPremium={state.user?.isPremium}
            user={state.user}
            chefCredits={state.chefCredits}
            onUseCredit={async () => {
              if (state.user?.id) {
                await supabase.rpc('decrement_chef_credits', { user_id: state.user.id });
              }
              setState(prev => ({ ...prev, chefCredits: Math.max(0, prev.chefCredits - 1) }));
            }}
            onAddCredits={async () => {
              if (state.user?.id) {
                await supabase.rpc('add_chef_credits', { user_id: state.user.id, amount: 3 });
              }
              setState(prev => ({ ...prev, chefCredits: prev.chefCredits + 3 }));
            }}
            onShowPremium={() => setPremiumModal({ isOpen: true, reason: 'chefbot' })}
          />
        )}
        <PremiumModal
          isOpen={premiumModal.isOpen}
          onClose={() => setPremiumModal(prev => ({ ...prev, isOpen: false }))}
          reason={premiumModal.reason}
        />
      </div>
      {/* PWA Update Banner - Mobile Optimized */}
      {needRefresh && (
        <div className="fixed top-4 left-2 right-2 z-[200] animate-in slide-in-from-top duration-500 max-w-[420px] mx-auto">
          <div className="bg-zinc-900/95 backdrop-blur-md border border-[#39FF14]/30 rounded-xl p-3 shadow-[0_0_20px_rgba(57,255,20,0.15)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14] flex-shrink-0">
                <span className="material-symbols-outlined text-lg">system_update</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-white text-[10px] font-bold uppercase tracking-tight truncate">Nueva versión disponible</h4>
                <p className="text-zinc-400 text-[9px] truncate">Actualiza para disfrutar las mejoras.</p>
              </div>
            </div>
            <button
              onClick={handleUpdatePWA}
              className="bg-[#39FF14] text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide shadow-neon-glow hover:scale-105 active:scale-95 transition-all flex-shrink-0"
            >
              Actualizar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
