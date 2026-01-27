
export interface Ingredient {
  name: string;
  confidence: number;
  properties: string[];
  nutrients?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  portions: number;
  prepTime: string;
  difficulty: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  matchPercentage: number;
  category?: 'Desayuno' | 'Almuerzo' | 'Cena' | 'Saludable';
  suggestedExtras?: string[];
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  recipeId?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  likes: number;
  createdAt: string;
}

export interface ChefProfile {
  name: string;
  avatar?: string;
  level: number;
  recipesCount: number;
  likesCount: number;
  specialty: string;
}

export type AppView = 'landing' | 'login' | 'dashboard' | 'community' | 'profile-detail' | 'challenges' | 'scanner' | 'results' | 'recipe-detail' | 'nutritional-detail' | 'cooking-mode' | 'favorites' | 'history' | 'profile' | 'explore' | 'loading-recipes' | 'notifications' | 'settings' | 'inventory';

export interface AppState {
  user: {
    id: string;
    name: string;
    isPremium: boolean;
    email: string;
    avatarUrl?: string;
    allergies?: string[];
    cookingGoal?: 'bajar_peso' | 'ganar_musculo' | 'ahorrar_tiempo' | 'explorar' | 'saludable';
    phone?: string;
    bio?: string;
  } | null;
  currentView: AppView;
  previousView: AppView | null;
  scannedIngredients: Ingredient[];
  recentRecipes: Recipe[];
  favoriteRecipes: Recipe[];
  recipeGenerationsToday: number;
  botQuestionsRemaining: number;
  inventory: InventoryItem[];
  history: {
    ingredient: string;
    recipe: string;
    date: string;
    time: string;
    imageUrl?: string;
  }[];
}
