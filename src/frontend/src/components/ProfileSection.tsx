import { useState, useRef, useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { User, Edit3, LogOut, LogIn } from "lucide-react";
import { useGetDisplayName, useSetDisplayName } from "../hooks/useQueries";
import EditDisplayNameModal from "./EditDisplayNameModal";

export default function ProfileSection() {
  const { identity, login, clear } = useInternetIdentity();
  const { data: displayName } = useGetDisplayName();
  const setDisplayNameMutation = useSetDisplayName();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!identity;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = () => {
    setIsEditModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleSaveDisplayName = async (newDisplayName: string) => {
    await setDisplayNameMutation.mutateAsync(newDisplayName);
    setIsEditModalOpen(false);
  };

  const handleSignOut = () => {
    clear();
    setIsDropdownOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </button>
    );
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center space-x-3">
          <span className="text-gray-700 font-medium">
            {displayName || "Anonymous User"}
          </span>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
        </div>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Display Name</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <EditDisplayNameModal
          currentDisplayName={displayName}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleSaveDisplayName}
          isLoading={setDisplayNameMutation.isPending}
        />
      )}
    </>
  );
}
