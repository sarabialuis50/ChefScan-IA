
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
import { generateRecipes } from './services/geminiService';
import { supabase } from './lib/supabase';
import { InventoryItem } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: null,
    currentView: 'landing',
    previousView: null,
    scannedIngredients: [],
    recentRecipes: [],
    favoriteRecipes: [],
    recipeGenerationsToday: 0,
    botQuestionsRemaining: 5,
    inventory: [],
    history: [],
    acceptedChallengeId: null
  });

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedChef, setSelectedChef] = useState<any>(null);
  const [lastUsedIngredients, setLastUsedIngredients] = useState<string[]>([]);
  const [lastUsedPortions, setLastUsedPortions] = useState<number>(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAIFinished, setIsAIFinished] = useState(false);
  const [premiumModal, setPremiumModal] = useState<{ isOpen: boolean, reason: 'recipes' | 'nutrition' | 'chefbot' | 'more-recipes' }>({
    isOpen: false,
    reason: 'recipes'
  });

  // Listen for Auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email || '');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetchProfile(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setState(prev => ({ ...prev, user: null, currentView: 'landing' }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persistence: Load from LocalStorage
  useEffect(() => {
    const savedState = localStorage.getItem('chefscan_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          ...parsed,
          // If currentView was landing/login, maybe keep them or restore
          currentView: parsed.currentView || 'dashboard',
          previousView: parsed.previousView || null
        }));
        if (parsed.selectedRecipe) setSelectedRecipe(parsed.selectedRecipe);
      } catch (e) { }
    }
  }, []);

  // Persistence: Save to LocalStorage
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('chefscan_state', JSON.stringify({
        user: state.user,
        favoriteRecipes: state.favoriteRecipes,
        recentRecipes: state.recentRecipes,
        inventory: state.inventory,
        history: state.history,
        currentView: state.currentView,
        previousView: state.previousView,
        selectedRecipe: selectedRecipe
      }));
    }
  }, [state.user, state.favoriteRecipes, state.recentRecipes, state.inventory, state.history, state.currentView, selectedRecipe]);

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

  const fetchProfile = async (userId: string, email: string) => {
    let profileData: any = null;

    // Try to fetch profile with a small retry mechanism/delay for new users
    try {
      const fetchAttempt = async () => await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      let { data, error } = await fetchAttempt();

      // If no profile found (Race Condition on SignUp), wait 1s and try once more
      if (!data || error) {
        await new Promise(r => setTimeout(r, 1000));
        const retry = await fetchAttempt();
        data = retry.data;
        error = retry.error;
      }

      profileData = data;
    } catch (e) {
      console.warn("Profile fetch failed, using fallback");
    }

    // Prepare default/fallback data if profile still missing
    const fallbackUser = {
      id: userId,
      name: email.split('@')[0],
      email: email,
      isPremium: false,
      avatarUrl: null,
      allergies: [],
      cookingGoal: 'explorar'
    };

    // Safe Profile Data (DB or Fallback)
    const finalUser = profileData ? {
      id: userId,
      name: profileData.name || email.split('@')[0],
      email: email,
      isPremium: profileData.is_premium,
      avatarUrl: profileData.avatar_url,
      allergies: profileData.allergies,
      cookingGoal: profileData.cooking_goal,
      bio: profileData.bio,
      phone: profileData.phone
    } : fallbackUser;

    // Fetch sub-data (Favorites, History, Inventory) - Safe to be empty
    const { data: favs } = await supabase.from('favorites').select('*, recipes(*)').eq('user_id', userId);
    const { data: hist } = await supabase.from('history').select('*, recipes(*)').eq('user_id', userId).order('created_at', { ascending: false });
    const { data: inv } = await supabase.from('inventory').select('*').eq('user_id', userId).order('expiry_date', { ascending: true });

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
      // CRÍTICO: No tocamos currentView si ya tenemos una cargada (evita el salto al dashboard al minimizar)
      currentView: prev.currentView !== 'landing' && prev.currentView !== 'login' ? prev.currentView : 'dashboard',
      botQuestionsRemaining: finalUser.isPremium ? 15 : 5
    }));
  };

  const navigateTo = (view: AppView) => {
    setState(prev => {
      // Vistas de detalle que no deben sobrescribir el origen principal
      const secondaryViews = ['recipe-detail', 'nutritional-detail', 'cooking-mode'];
      const isSecondary = secondaryViews.includes(view);
      const wasSecondary = secondaryViews.includes(prev.currentView);

      let nextPreviousView = prev.previousView;

      // Si pasamos de una vista principal a cualquier otra, guardamos el origen
      if (!wasSecondary) {
        nextPreviousView = prev.currentView;
      }
      // Si estamos en una vista secundaria y nos movemos a otra secundaria, 
      // mantenemos el previousView original (el que nos llevó a la primera secundaria)

      return {
        ...prev,
        previousView: nextPreviousView,
        currentView: view
      };
    });
  };

  const handleLogin = (user: any) => {
    setState(prev => ({
      ...prev,
      user,
      currentView: 'dashboard',
      botQuestionsRemaining: user.isPremium ? 15 : 5
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleShare = () => {
    if (!selectedRecipe?.id) return;
    const shareUrl = `http://chefscania.com/?recipeId=${selectedRecipe.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('¡Enlace de receta copiado al portapapeles!');
  };

  const handleUpdateUser = async (updates: any) => {
    if (!state.user?.id) return;

    // Persist to Supabase
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
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

  const handleInventoryAdd = async (name: string, quantity: number, unit: string, expiryDate?: string) => {
    if (!state.user?.id) return;
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

  const handleScanComplete = (ingredients: Ingredient[]) => {
    setState(prev => ({ ...prev, scannedIngredients: ingredients }));
  };

  const handleStartGeneration = async (ingredients: string[], portions: number, itemId?: string) => {
    // Si viene de un desafío de "desperdicio cero", marcamos el ID del reto como aceptado
    // para que no vuelva a aparecer en el dashboard, pero lo mantenemos en la despensa.
    if (itemId) {
      setState(prev => ({ ...prev, acceptedChallengeId: itemId }));
    }

    // Check Limits
    // Bypass temporal para pruebas: permitimos generar recetas sin límites
    /*
    if (!state.user?.isPremium && state.recipeGenerationsToday >= 1) {
      setPremiumModal({ isOpen: true, reason: 'recipes' });
      return;
    }
    */

    setLastUsedIngredients(ingredients);
    setLastUsedPortions(portions);
    setIsAIFinished(false);
    navigateTo('loading-recipes');

    try {
      // Normalize ingredients
      const normalizedIngredients = ingredients.map(i => i.trim().toLowerCase());
      const recipes = await generateRecipes(
        normalizedIngredients,
        portions,
        !!state.user?.isPremium,
        state.user?.allergies,
        state.user?.cookingGoal
      );
      setIsAIFinished(true);

      // Delay slightly for dramatic effect of 100% progress
      setTimeout(async () => {
        let savedRecipeId = null;

        // Persist history to DB
        if (state.user?.id) {
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
          botQuestionsRemaining: prev.user?.isPremium ? 15 : prev.botQuestionsRemaining,
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
      }, 800);
    } catch (error) {
      console.error("Error generating recipes:", error);
      navigateTo('dashboard');
    }
  };

  const handleGenerateMore = async () => {
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

    // Bypass temporal para pruebas: permitimos guardar favoritos sin ser premium
    /*
    if (!state.user?.isPremium) {
      setPremiumModal({ isOpen: true, reason: 'recipes' });
      return;
    }
    */

    const isFavorite = state.favoriteRecipes.some(r => r.id === recipe.id);

    if (isFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', state.user.id)
        .eq('recipe_id', recipe.id);

      if (!error) {
        setState(prev => ({
          ...prev,
          favoriteRecipes: prev.favoriteRecipes.filter(r => r.id !== recipe.id)
        }));
        // Limpiar la categoría de la receta seleccionada para que desaparezca la etiqueta azul
        if (selectedRecipe?.id === recipe.id) {
          const { category, ...recipeWithoutCategory } = selectedRecipe;
          setSelectedRecipe(recipeWithoutCategory as Recipe);
        }
      }
    } else {
      // Add to favorites
      let permanentId = recipe.id;

      // Ensure recipe is in the recipes table (if it's a new generation without UUID)
      if (typeof recipe.id === 'string' && recipe.id.length < 10) {
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

      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: state.user.id,
          recipe_id: permanentId,
          category: category // We should ensure the DB has this column
        });

      if (!error) {
        const updatedRecipe = { ...recipe, id: permanentId, category };
        setState(prev => ({
          ...prev,
          favoriteRecipes: [updatedRecipe, ...prev.favoriteRecipes]
        }));
        // Actualizar receta seleccionada para que el ID coincida y el corazón se ponga rojo
        if (selectedRecipe?.id === recipe.id) {
          setSelectedRecipe(updatedRecipe);
        }
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
            <LoginView onLogin={handleLogin} />
          </Layout>
        );
      case 'dashboard':
        return (
          <Layout activeNav="dashboard" onNavClick={navigateTo}>
            <DashboardView
              user={state.user}
              recentRecipes={state.favoriteRecipes}
              scannedIngredients={state.scannedIngredients.map(i => i.name)}
              onClearScanned={() => setState(prev => ({ ...prev, scannedIngredients: [] }))}
              onScanClick={() => navigateTo('scanner')}
              onRecipeClick={handleSelectRecipe}
              onGenerate={() => { }}
              onStartGeneration={handleStartGeneration}
              onExploreClick={() => navigateTo('explore')}
              onNotificationsClick={() => navigateTo('notifications')}
              onSettingsClick={() => navigateTo('settings')}
              onNavClick={navigateTo}
              onComplete={handleScanComplete}
              onAddItem={handleInventoryAdd}
              inventory={state.inventory}
              acceptedChallengeId={state.acceptedChallengeId}
            />
          </Layout>
        );
      case 'community':
        return (
          <Layout activeNav="community" onNavClick={navigateTo}>
            <CommunityView
              user={state.user}
              onBack={() => navigateTo('dashboard')}
              onRecipeClick={(recipe: any) => handleSelectRecipe(recipe)}
              onChefClick={(chef) => {
                setSelectedChef(chef);
                navigateTo('profile-detail');
              }}
            />
          </Layout>
        );
      case 'profile-detail':
        return (
          <Layout activeNav="community" onNavClick={navigateTo}>
            <ProfileDetailView
              chef={selectedChef || { name: 'Chef Invitado', level: 1, recipesCount: 0, likesCount: 0, specialty: 'Cocinero Casual' }}
              onBack={() => navigateTo('community')}
            />
          </Layout>
        );
      case 'notifications':
        return (
          <Layout activeNav="dashboard" onNavClick={navigateTo}>
            <NotificationsView onBack={() => navigateTo('dashboard')} />
          </Layout>
        );
      case 'challenges':
        return (
          <Layout activeNav="dashboard" onNavClick={navigateTo}>
            <ChallengesView
              inventory={state.inventory}
              onBack={() => navigateTo('dashboard')}
              onAcceptChallenge={(item) => handleStartGeneration([item.name], 2, item.id)}
              onViewInventory={() => navigateTo('inventory')}
            />
          </Layout>
        );
      case 'inventory':
        return (
          <Layout activeNav="inventory" onNavClick={navigateTo}>
            <InventoryView
              inventory={state.inventory}
              onAddItem={handleInventoryAdd}
              onDeleteItem={handleInventoryDelete}
              onUpdateItem={handleInventoryUpdate}
              onStartGeneration={handleStartGeneration}
              acceptedChallengeId={state.acceptedChallengeId}
              onBack={() => navigateTo('dashboard')}
            />
          </Layout>
        );
      case 'settings':
        return (
          <Layout activeNav="dashboard" onNavClick={navigateTo}>
            <SettingsView
              onBack={() => navigateTo('dashboard')}
              user={state.user}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
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
          <Layout activeNav="dashboard" onNavClick={navigateTo}>
            <ExploreView
              onBack={() => navigateTo('dashboard')}
              onRecipeClick={handleSelectRecipe}
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
            />
          </Layout>
        );
      case 'results':
        return (
          <Layout activeNav="dashboard" onNavClick={navigateTo}>
            <ResultsView
              recipes={state.recentRecipes}
              onRecipeClick={handleSelectRecipe}
              onBack={() => navigateTo('dashboard')}
              isPremium={state.user?.isPremium}
              onGenerateMore={handleGenerateMore}
              loadingMore={loadingMore}
            />
          </Layout>
        );
      case 'recipe-detail':
        return (
          <Layout showNav={false}>
            <RecipeDetailView
              recipe={selectedRecipe}
              isFavorite={state.favoriteRecipes.some(r => r.id === selectedRecipe?.id)}
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
            />
          </Layout>
        );
      case 'favorites':
        return (
          <Layout activeNav="favorites" onNavClick={navigateTo}>
            <FavoritesView
              recipes={state.favoriteRecipes}
              onRecipeClick={handleSelectRecipe}
              onBack={() => navigateTo('dashboard')}
            />
          </Layout>
        );
      case 'history':
        return (
          <Layout activeNav="history" onNavClick={navigateTo}>
            <HistoryView
              history={state.history}
              onBack={() => navigateTo('dashboard')}
              onRecipeClick={handleSelectRecipe}
            />
          </Layout>
        );
      case 'profile':
        return (
          <Layout activeNav="profile" onNavClick={navigateTo}>
            <ProfileView user={state.user} onLogout={handleLogout} />
          </Layout>
        );
      default:
        return <div>View not implemented</div>;
    }
  };

  const showChatbot = !['landing', 'login', 'scanner', 'loading-recipes'].includes(state.currentView);

  const isLanding = state.currentView === 'landing';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <div className={`w-full min-h-screen relative flex flex-col ${!isLanding ? 'max-w-[430px] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-x border-white/5 overflow-hidden' : ''}`}>
        {renderView()}
        {showChatbot && (
          <AIChatbot
            isPremium={state.user?.isPremium}
            user={state.user}
            remainingQuestions={state.botQuestionsRemaining}
            onQuestionAsked={() => setState(prev => ({ ...prev, botQuestionsRemaining: Math.max(0, prev.botQuestionsRemaining - 1) }))}
            onShowPremium={() => setPremiumModal({ isOpen: true, reason: 'chefbot' })}
          />
        )}
        <PremiumModal
          isOpen={premiumModal.isOpen}
          onClose={() => setPremiumModal(prev => ({ ...prev, isOpen: false }))}
          reason={premiumModal.reason}
        />
      </div>
    </div>
  );
};

export default App;
