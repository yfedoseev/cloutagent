import { create } from 'zustand';

export interface PropertyPanelState {
  isOpen: boolean;
  nodeId: string | null;
  nodeType: string | null;
}

export interface PropertyPanelActions {
  openPanel: (nodeId: string, nodeType: string) => void;
  closePanel: () => void;
  setNodeId: (nodeId: string | null) => void;
}

export const usePropertyPanelStore = create<
  PropertyPanelState & PropertyPanelActions
>(set => ({
  isOpen: false,
  nodeId: null,
  nodeType: null,

  openPanel: (nodeId, nodeType) => set({ isOpen: true, nodeId, nodeType }),
  closePanel: () => set({ isOpen: false, nodeId: null, nodeType: null }),
  setNodeId: nodeId => set({ nodeId }),
}));
