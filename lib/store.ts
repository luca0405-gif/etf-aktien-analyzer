import { create } from "zustand";
import { ASSETS } from "./mock-data";

export const MAX_SELECTED_ASSETS = 4;

export type AssetTypeFilter = "all" | "ETF" | "Stock";

interface DashboardState {
  // --- asset selection (comparison) ---
  selectedAssetIds: string[];
  toggleAsset: (id: string) => void;
  addAsset: (id: string) => void;
  removeAsset: (id: string) => void;
  clearAssets: () => void;

  // --- search ---
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // --- comparison table filters ---
  assetTypeFilter: AssetTypeFilter;
  setAssetTypeFilter: (f: AssetTypeFilter) => void;
  showOnlyDifferences: boolean;
  toggleShowOnlyDifferences: () => void;

  // --- modal ---
  modalAssetId: string | null;
  openAssetModal: (id: string) => void;
  closeAssetModal: () => void;

  // --- active tab for detail sections ---
  activeDetailTab: string;
  setActiveDetailTab: (tab: string) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  selectedAssetIds: [ASSETS[0].id, ASSETS[5].id],

  toggleAsset: (id) => {
    const current = get().selectedAssetIds;
    if (current.includes(id)) {
      set({ selectedAssetIds: current.filter((a) => a !== id) });
    } else {
      if (current.length >= MAX_SELECTED_ASSETS) return;
      set({ selectedAssetIds: [...current, id] });
    }
  },

  addAsset: (id) => {
    const current = get().selectedAssetIds;
    if (current.includes(id) || current.length >= MAX_SELECTED_ASSETS) return;
    set({ selectedAssetIds: [...current, id] });
  },

  removeAsset: (id) => {
    set({ selectedAssetIds: get().selectedAssetIds.filter((a) => a !== id) });
  },

  clearAssets: () => set({ selectedAssetIds: [] }),

  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  assetTypeFilter: "all",
  setAssetTypeFilter: (f) => set({ assetTypeFilter: f }),

  showOnlyDifferences: false,
  toggleShowOnlyDifferences: () =>
    set({ showOnlyDifferences: !get().showOnlyDifferences }),

  modalAssetId: null,
  openAssetModal: (id) => set({ modalAssetId: id, activeDetailTab: "overview" }),
  closeAssetModal: () => set({ modalAssetId: null }),

  activeDetailTab: "overview",
  setActiveDetailTab: (tab) => set({ activeDetailTab: tab }),
}));
