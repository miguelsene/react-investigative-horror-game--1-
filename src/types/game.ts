export type LocationId =
  | 'bedroom'
  | 'upstairs_hall'
  | 'study'
  | 'living_room'
  | 'kitchen'
  | 'grandma_room'
  | 'garden'
  | 'genkan'
  | 'street'
  | 'shop'
  | 'vending'
  | 'bookstore'
  | 'shrine'
  | 'school_gate'
  | 'school_hall'
  | 'classroom'
  | 'dining'
  | 'storage';

export type WorldMapId = 'house2' | 'house1' | 'neighborhood' | 'school';

export interface PlayerStats {
  health: number;       // Vida (0-100)
  maxHealth: number;
  focus: number;        // Foco / Calma mental (0-100)
  maxFocus: number;
  observation: number;  // Observação analítica (0-100)
  investigation: number;// Raciocínio dedutivo (0-100)
}

export type ItemCategory = 'document' | 'tool' | 'key' | 'evidence' | 'recording';

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  category: ItemCategory;
  description: string;
  detailedDescription?: string;
  canCombineWith?: string[];
  combinationResult?: {
    withItemId: string;
    resultItem: InventoryItem;
    message: string;
  };
  modelType?: 'clock' | 'photo' | 'key' | 'recorder' | 'calendar' | 'letter' | 'bell' | 'box';
  inspectableData?: InspectionObjectData;
}

export interface InspectionHotspot {
  id: string;
  label: string;
  position: [number, number, number]; // 3D coordinates relative to object
  observationBasic: string;
  observationDetailed: string;
  observationHidden?: string;
  requiresClueId?: string;
  unlocksClueId?: string;
  gabrielaMonologue: string;
}

export interface InspectionObjectData {
  id: string;
  title: string;
  subtitle: string;
  modelType: 'clock' | 'photo' | 'key' | 'recorder' | 'calendar' | 'letter' | 'bell' | 'box';
  dateStr?: string;
  rotatable: boolean;
  zoomable: boolean;
  hotspots: InspectionHotspot[];
  notes: string[];
}

export interface Clue {
  id: string;
  title: string;
  category: 'people' | 'location' | 'evidence' | 'timeline';
  basicInfo: string;
  detailedInfo?: string;
  hiddenInfo?: string;
  revealedTiers: number; // 1 = basic, 2 = detailed, 3 = hidden
  requiresClueId?: string;
  timeAssociated?: string; // e.g. "06:43" or "03:17"
  locationId?: LocationId;
  connectedTo?: string[];
  isContradiction?: boolean;
}

export interface EvidenceNode {
  id: string;
  title: string;
  category: 'people' | 'location' | 'evidence' | 'timeline';
  x: number;
  y: number;
  summary: string;
  time?: string;
  isUnlocked: boolean;
}

export interface EvidenceConnection {
  id: string;
  from: string;
  to: string;
  isVerified?: boolean;
  deductionText?: string;
}

export interface DialogueOption {
  text: string;
  nextNodeId: string;
  requiredClue?: string;
  grantClue?: string;
  setFlag?: string;
  flagValue?: boolean | string | number;
}

export interface DialogueNode {
  id: string;
  speaker: 'Gabriela' | 'Chiyo (Avó)' | 'Desconhecido' | 'Voz no Telefone' | 'Pensamento';
  speakerTitle?: string;
  avatar: string;
  text: string;
  gabrielaAnalysis?: string; // Gabriela's cold analytical observation
  options?: DialogueOption[];
  next?: string;
  triggerEvent?: string;
  soundCue?: 'sting' | 'tick' | 'creak' | 'phone' | 'static';
}

export interface Chapter {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export type ChapterBeat =
  | 'prologue_317'
  | 'wake_0620'
  | 'morning_room'
  | 'bed_done'
  | 'desk_done'
  | 'bag_done'
  | 'uniform_done'
  | 'ready_downstairs'
  | 'breakfast'
  | 'watson_fed'
  | 'clocks_started'
  | 'seven_clocks'
  | 'study_searched'
  | 'leave_house'
  | 'route_school'
  | 'emi_met'
  | 'class_biology'
  | 'class_math'
  | 'class_chemistry'
  | 'class_physics'
  | 'lunch'
  | 'school_done'
  | 'route_home'
  | 'home_1807'
  | 'dinner_prepared'
  | 'dinner_memory'
  | 'night_reading'
  | 'second_317'
  | 'handprint'
  | 'chapter_complete';

export type ActivityId =
  | 'bed'
  | 'desk'
  | 'bag'
  | 'uniform'
  | 'watson'
  | 'clocks'
  | 'cooking'
  | 'biology'
  | 'math'
  | 'chemistry'
  | 'physics'
  | 'art';

export interface InteractiveObject {
  id: string;
  name: string;
  interactionType: 'INSPECIONAR' | 'ABRIR' | 'CONVERSAR' | 'EXAMINAR';
  position: [number, number, number];
  location: LocationId;
  distance: number;
  icon?: string;
  action: () => void;
  condition?: () => boolean;
}

export interface GameSaveData {
  version: string;
  timestamp: number;
  currentChapter: number;
  unlockedChapters: number[];
  currentTime: string;
  currentLocation: LocationId;
  currentMap?: WorldMapId;
  playerPos: [number, number, number];
  playerFacing: 'up' | 'down' | 'left' | 'right';
  playerStats: PlayerStats;
  inventory: InventoryItem[];
  clues: Clue[];
  evidenceNodes: EvidenceNode[];
  evidenceConnections: EvidenceConnection[];
  solvedPuzzles: string[];
  storyFlags: Record<string, boolean | number | string>;
  chapterBeats?: ChapterBeat[];
  completedActivities?: ActivityId[];
  fixedClocks?: string[];
  inspectedObjects: string[];
  notes: string[];
}
