import { useState, useEffect, useMemo } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { useHabits, useCreateHabit } from "./hooks/useQueries";
import { useEnsureUserRole } from "./hooks/useEnsureUserRole";
import HabitCard from "./components/HabitCard";
import CreateHabitModal from "./components/CreateHabitModal";
import ProfileSection from "./components/ProfileSection";
import { Plus, Heart, User, LogIn, Target } from "lucide-react";
import { getUserFacingError } from "./utils/userFacingErrors";
import { Category } from "./backend";

function App() {
  const { isInitializing, identity, login } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  // Ensure user role is assigned after login
  useEnsureUserRole();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createHabitError, setCreateHabitError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data: habits = [], isLoading } = useHabits();
  const createHabitMutation = useCreateHabit();

  useEffect(() => {
    if (!isInitializing) {
      queryClient.invalidateQueries();
    }
  }, [isAuthenticated, isInitializing, queryClient]);

  // Get unique categories from habits
  const availableCategories = useMemo(() => {
    const categories = new Set(habits.map((habit) => habit.category));
    return Array.from(categories).sort();
  }, [habits]);

  // Filter habits by selected category
  const filteredHabits = useMemo(() => {
    if (selectedCategory === "all") {
      return habits;
    }
    return habits.filter((habit) => habit.category === selectedCategory);
  }, [habits, selectedCategory]);

  const handleCreateHabit = async (name: string, color: string, category: Category) => {
    try {
      setCreateHabitError(null);
      await createHabitMutation.mutateAsync({ name, color, category });
      setIsCreateModalOpen(false);
    } catch (error) {
      const errorMessage = getUserFacingError(error);
      setCreateHabitError(errorMessage);
      // Keep modal open to show error
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateHabitError(null);
  };

  const CATEGORY_LABELS: Record<string, string> = {
    health: "Health",
    exercise: "Exercise",
    work: "Work",
    education: "Education",
    hobby: "Hobby",
    social: "Social",
    finance: "Finance",
    miscellaneous: "Miscellaneous",
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-12">
          <div
            className="flex items-center gap-4"
            style={{ paddingRight: "1rem" }}
          >
            <img 
              src="/assets/generated/sutra-logo-v2.dim_512x512.png" 
              alt="SUTRA Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                SUTRA
              </h1>
              <p className="text-gray-600">
                Build better habits, one day at a time
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row items-center gap-4">
            {isAuthenticated && habits.length > 0 && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-green-600 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Habit
              </button>
            )}
            {isAuthenticated && <ProfileSection />}
          </div>
        </header>

        {!isAuthenticated && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to SUTRA
              </h2>
              <p className="text-gray-600 mb-8">
                Track your daily habits and build better routines. Sign in with
                Internet Identity to get started and keep your habits synced
                across all your devices.
              </p>
              <div className="space-y-4">
                <div className="flex items-center text-left">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">
                    Track multiple habits daily
                  </span>
                </div>
                <div className="flex items-center text-left">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Heart className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">
                    Build consistent routines
                  </span>
                </div>
                <div className="flex items-center text-left">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Plus className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Visualize your progress</span>
                </div>
              </div>
              <div className="mt-8">
                <button
                  onClick={login}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In with Internet Identity
                </button>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading habits...</p>
              </div>
            ) : habits.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Plus className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    No habits yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start building better habits by creating your first one!
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-green-600 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Create Your First Habit
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Category filter */}
                {availableCategories.length > 0 && (
                  <div className="mb-6 flex justify-center">
                    <div className="inline-flex gap-2 bg-white rounded-lg p-2 shadow-md">
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          selectedCategory === "all"
                            ? "bg-green-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        All
                      </button>
                      {availableCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            selectedCategory === category
                              ? "bg-green-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {CATEGORY_LABELS[category] || category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-6 justify-center">
                  {filteredHabits.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <footer className="text-center mt-16 py-8 text-gray-500">
          © {new Date().getFullYear()}. Built with <Heart className="inline w-4 h-4 text-red-500" />{" "}
          using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-green-600 hover:text-green-700 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </footer>
      </div>

      {isAuthenticated && isCreateModalOpen && (
        <CreateHabitModal
          onClose={handleCloseCreateModal}
          onSubmit={handleCreateHabit}
          isLoading={createHabitMutation.isPending}
          error={createHabitError}
        />
      )}
    </div>
  );
}

export default App;
