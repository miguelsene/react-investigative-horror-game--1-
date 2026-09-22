import { useState, useCallback } from 'react';
import { 
  GameSaveData, 
  PlayerStats, 
  InventoryItem, 
  Clue, 
  EvidenceNode, 
  EvidenceConnection, 
  LocationId 
} from '../types/game';
import { 
  INITIAL_INVENTORY, 
  INITIAL_CLUES, 
  INITIAL_EVIDENCE_NODES, 
  INITIAL_CONNECTIONS 
} from '../data/clues';

const SAVE_STORAGE_KEY = 'gabriela_game_save';

export const useGameState = () => {
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [unlockedChapters, setUnlockedChapters] = useState<number[]>([1]);
  const [currentTime, setCurrentTime] = useState<string>('03:17');
  const [currentLocation, setCurrentLocation] = useState<LocationId>('bedroom');
  const [currentFloor, setCurrentFloor] = useState<1 | 2>(2); // Start upstairs in Gabriela's bedroom!
  
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    focus: 100,
    maxFocus: 100,
    observation: 85,
    investigation: 80,
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [clues, setClues] = useState<Clue[]>(INITIAL_CLUES);
  const [evidenceNodes, setEvidenceNodes] = useState<EvidenceNode[]>(INITIAL_EVIDENCE_NODES);
  const [evidenceConnections, setEvidenceConnections] = useState<EvidenceConnection[]>(INITIAL_CONNECTIONS);
  const [solvedPuzzles, setSolvedPuzzles] = useState<string[]>([]);
  const [storyFlags, setStoryFlags] = useState<Record<string, boolean | number | string>>({
    woke_up: true,
    intro_done: false,
    has_seen_kitchen_clock: false,
    talked_to_grandma: false,
    found_1974_photo: false,
    hallway_painting_anomaly: false,
    phone_event_triggered: false,
  });
  const [inspectedObjects, setInspectedObjects] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([
    'Despertei às 06:43, dezessete minutos antes do previsto.',
    'A chuva sobre as telhas de Kyoto permanece com intensidade moderada.',
  ]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load game from LocalStorage
  const loadGame = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return false;

      const data: GameSaveData = JSON.parse(raw);
      if (data.currentChapter) setCurrentChapter(data.currentChapter);
      if (data.unlockedChapters) setUnlockedChapters(data.unlockedChapters);
      if (data.currentTime) setCurrentTime(data.currentTime);
      if (data.currentLocation) setCurrentLocation(data.currentLocation);
      if (data.playerStats) setPlayerStats(data.playerStats);
      if (data.inventory) setInventory(data.inventory);
      if (data.clues) setClues(data.clues);
      if (data.evidenceNodes) setEvidenceNodes(data.evidenceNodes);
      if (data.evidenceConnections) setEvidenceConnections(data.evidenceConnections);
      if (data.solvedPuzzles) setSolvedPuzzles(data.solvedPuzzles);
      if (data.storyFlags) setStoryFlags(data.storyFlags);
      if (data.inspectedObjects) setInspectedObjects(data.inspectedObjects);
      if (data.notes) setNotes(data.notes);

      // Floor inference
      if (data.currentLocation === 'bedroom' || data.currentLocation === 'upstairs_hall' || data.currentLocation === 'study') {
        setCurrentFloor(2);
      } else {
        setCurrentFloor(1);
      }

      return true;
    } catch (e) {
      console.error('Error loading game save:', e);
      return false;
    }
  }, []);

  // Save game to LocalStorage with non-blocking toast
  const saveGame = useCallback(() => {
    // Developer sessions are intentionally sandboxed and never overwrite the
    // player's campaign slot.
    if (storyFlags.developer_mode) {
      setSaveStatus('idle');
      return;
    }
    setSaveStatus('saving');
    try {
      const saveData: GameSaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        currentChapter,
        unlockedChapters,
        currentTime,
        currentLocation,
        playerPos: [0, 0.4, 0],
        playerFacing: 'down',
        playerStats,
        inventory,
        clues,
        evidenceNodes,
        evidenceConnections,
        solvedPuzzles,
        storyFlags,
        fixedClocks: [],
        inspectedObjects,
        notes,
      };

      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveData));
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }, 400);
    } catch (e) {
      console.error('Error saving game:', e);
      setSaveStatus('idle');
    }
  }, [
    currentChapter,
    unlockedChapters,
    currentTime,
    currentLocation,
    playerStats,
    inventory,
    clues,
    evidenceNodes,
    evidenceConnections,
    solvedPuzzles,
    storyFlags,
    inspectedObjects,
    notes,
  ]);

  // Delete save game
  const deleteSave = useCallback(() => {
    localStorage.removeItem(SAVE_STORAGE_KEY);
    // Reset to defaults
    setCurrentChapter(1);
    setUnlockedChapters([1]);
    setCurrentTime('03:17');
    setCurrentLocation('bedroom');
    setCurrentFloor(2);
    setInventory(INITIAL_INVENTORY);
    setClues(INITIAL_CLUES);
    setEvidenceNodes(INITIAL_EVIDENCE_NODES);
    setEvidenceConnections(INITIAL_CONNECTIONS);
    setSolvedPuzzles([]);
    setStoryFlags({
      woke_up: true,
      intro_done: false,
      has_seen_kitchen_clock: false,
      talked_to_grandma: false,
      found_1974_photo: false,
      hallway_painting_anomaly: false,
      phone_event_triggered: false,
    });
    setInspectedObjects([]);
    setNotes([
      'Despertei às 06:43, dezessete minutos antes do previsto.',
      'A chuva sobre as telhas de Kyoto permanece com intensidade moderada.',
    ]);
  }, []);

  // Add or unlock new clue
  const unlockClue = useCallback((clueId: string) => {
    if (clueId === 'clue_kitchen_clock_anomaly') {
      // Add kitchen clock anomaly clue
      setClues((prev) => {
        if (prev.some((c) => c.id === clueId)) return prev;
        return [
          ...prev,
          {
            id: 'clue_kitchen_clock_anomaly',
            title: 'Congelamento em 06:43 (Cozinha)',
            category: 'timeline',
            basicInfo: 'O relógio de parede de madeira da cozinha está parado em 06:43, exatamente o minuto em que acordei.',
            detailedInfo: 'O pêndulo oscila livremente sem transferir energia para os ponteiros.',
            hiddenInfo: 'O desvio temporal entre o pulso (06:44) e a cozinha (06:43) viola o princípio de causalidade física.',
            revealedTiers: 3,
            timeAssociated: '06:43',
          },
        ];
      });

      // Unlock node on evidence board
      setEvidenceNodes((prev) =>
        prev.map((n) => (n.id === 'node_clock_freeze' ? { ...n, isUnlocked: true } : n))
      );

      // Advance story flag and time
      setStoryFlags((prev) => ({ ...prev, has_seen_kitchen_clock: true }));
      setCurrentTime('06:44');
      addNote('Relógio da cozinha congelado em 06:43 enquanto meu relógio de pulso avançou para 06:44.');
    }

    if (clueId === 'clue_photo_1974_anomaly' || clueId === 'clue_photo_back_note') {
      setClues((prev) => {
        if (prev.some((c) => c.id === 'clue_photo_1974')) return prev;
        return [
          ...prev,
          {
            id: 'clue_photo_1974',
            title: 'Fotografia de 1974 da Janela',
            category: 'evidence',
            basicInfo: 'Fotografia capturada na rua residencial de Kyoto mostrando a casa dos cedros.',
            detailedInfo: 'Uma jovem na janela do segundo andar compartilha todos os meus traços biométricos.',
            hiddenInfo: 'Manuscrito no verso: "17/04/1974 — Ela continua vigiando as 03:17". Eu nasci em 2008.',
            revealedTiers: 3,
            timeAssociated: '1974 / 03:17',
          },
        ];
      });

      // Unlock photo & time_0317 nodes
      setEvidenceNodes((prev) =>
        prev.map((n) =>
          n.id === 'node_photo_1974' || n.id === 'node_time_0317'
            ? { ...n, isUnlocked: true }
            : n
        )
      );

      setStoryFlags((prev) => ({ ...prev, found_1974_photo: true }));

      // Unlock Chapter 2 (03:17)!
      setUnlockedChapters((prev) => (prev.includes(2) ? prev : [...prev, 2]));
      addNote('Encontrada fotografia de 1974. A silhueta na janela sou eu, 34 anos antes do meu nascimento.');
    }

    if (clueId === 'clue_phone_unplugged') {
      setStoryFlags((prev) => ({ ...prev, phone_event_triggered: true }));
      addNote('Telefone fixo da sala tocou sem estar conectado à fiação da rede.');
    }
  }, []);

  const addNote = useCallback((noteText: string) => {
    setNotes((prev) => [noteText, ...prev]);
  }, []);

  const connectEvidenceNodes = useCallback((fromId: string, toId: string) => {
    setEvidenceConnections((prev) => {
      const exists = prev.some(
        (c) => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
      );
      if (exists) return prev;
      return [
        ...prev,
        {
          id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          from: fromId,
          to: toId,
        },
      ];
    });
  }, []);

  const removeEvidenceConnection = useCallback((connectionId: string) => {
    setEvidenceConnections((prev) => prev.filter((c) => c.id !== connectionId));
  }, []);

  const moveEvidenceNode = useCallback((nodeId: string, x: number, y: number) => {
    setEvidenceNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n)));
  }, []);

  const checkHasSave = useCallback((): boolean => {
    return !!localStorage.getItem(SAVE_STORAGE_KEY);
  }, []);

  /**
   * Jump to a specific chapter, guaranteeing it is registered as unlocked.
   * Called AFTER loadGame() so the value is not overwritten by the save file.
   */
  const selectChapter = useCallback((chapterNumber: number) => {
    setCurrentChapter(chapterNumber);
    setUnlockedChapters((prev) => {
      const base = prev.includes(chapterNumber) ? prev : [...prev, chapterNumber];
      // Always ensure every earlier chapter is unlocked for continuity
      const complete: number[] = [];
      for (let i = 1; i <= Math.max(...base); i++) complete.push(i);
      return complete;
    });
    addNote(`Investigação retomada no capítulo ${chapterNumber}.`);
  }, []);

  return {
    currentChapter,
    setCurrentChapter,
    unlockedChapters,
    currentTime,
    setCurrentTime,
    currentLocation,
    setCurrentLocation,
    currentFloor,
    setCurrentFloor,
    playerStats,
    setPlayerStats,
    inventory,
    setInventory,
    clues,
    evidenceNodes,
    evidenceConnections,
    solvedPuzzles,
    storyFlags,
    setStoryFlags,
    inspectedObjects,
    notes,
    saveStatus,
    saveGame,
    loadGame,
    deleteSave,
    unlockClue,
    addNote,
    connectEvidenceNodes,
    removeEvidenceConnection,
    moveEvidenceNode,
    checkHasSave,
    selectChapter,
  };
};
