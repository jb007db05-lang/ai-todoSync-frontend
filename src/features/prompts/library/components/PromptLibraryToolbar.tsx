import React from "react";
import { Search, X, Layers, Folder as FolderIcon, Star } from "lucide-react";

interface PromptLibraryToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeView: "prompts" | "folders";
  setActiveView: (view: "prompts" | "folders") => void;
  setSelectedFolderId: (id: string | null) => void;
  promptsCount: number;
  foldersCount: number;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (fav: boolean) => void;
}

export const PromptLibraryToolbar: React.FC<PromptLibraryToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  activeView,
  setActiveView,
  setSelectedFolderId,
  promptsCount,
  foldersCount,
  showFavoritesOnly,
  setShowFavoritesOnly,
}) => {
  return (
    <div className="bg-white border border-olive-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-olive-400 absolute left-3.5 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts by name, description, tags or body..."
          className="w-full bg-olive-50/60 border border-olive-200 rounded-xl pl-9 pr-3 py-2 text-xs text-olive-950 placeholder-olive-400 focus:outline-none focus:border-olive-400 focus:ring-4 focus:ring-olive-700/5 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-2.5 text-olive-400 hover:text-olive-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-olive-100/80 p-1 rounded-xl border border-olive-200 flex items-center gap-1 select-none">
          <button
            onClick={() => {
              setActiveView("prompts");
              setSelectedFolderId(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeView === "prompts"
                ? "bg-olive-900 text-white shadow-2xs"
                : "text-olive-700 hover:text-olive-950 hover:bg-olive-200/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Prompts
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeView === "prompts"
                  ? "bg-olive-800 text-white"
                  : "bg-olive-200 text-olive-800"
              }`}
            >
              {promptsCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveView("folders");
              setSelectedFolderId(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeView === "folders"
                ? "bg-olive-900 text-white shadow-2xs"
                : "text-olive-700 hover:text-olive-950 hover:bg-olive-200/60"
            }`}
          >
            <FolderIcon className="w-3.5 h-3.5" /> Folders
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeView === "folders"
                  ? "bg-olive-800 text-white"
                  : "bg-olive-200 text-olive-800"
              }`}
            >
              {foldersCount}
            </span>
          </button>
        </div>

        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
            showFavoritesOnly
              ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
              : "bg-olive-50 hover:bg-olive-100 text-olive-700 border border-olive-200"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? "text-amber-500 fill-current" : "text-olive-400"}`} />
          Favorites
        </button>
      </div>
    </div>
  );
};
