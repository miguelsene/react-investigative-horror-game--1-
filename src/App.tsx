import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGameState } from './hooks/useGameState';
import { soundManager } from './audio/soundManager';
import { preloadAssets } from './three/assets';
import { ThreeWorld, WorldHotspot } from './components/ThreeWorld';
import { InspectionModal } from './components/InspectionModal';
import { EvidenceBoard } from './components/EvidenceBoard';
import { JournalModal } from './components/JournalModal';
import { InventoryModal } from './components/InventoryModal';
import { CombatModal } from './components/CombatModal';
import { DialogueBox } from './components/DialogueBox';
import { TitleScreen } from './components/TitleScreen';
import { SettingsModal } from './components/SettingsModal';
import { ChapterSelectModal } from './components/ChapterSelectModal';
import { ChapterMinigames, MinigameResult } from './components/ChapterMinigames';
import { ClockHunt } from './components/ClockHunt';
import { ClockRepairModal } from './components/ClockRepairModal';
import { ClockChecklist } from './components/ClockChecklist';
import { HOUSE_CLOCKS } from './data/houseClocks';
import { NeighborhoodWorld } from './components/NeighborhoodWorld';
import { SchoolWorld } from './components/SchoolWorld';
import { PhoneMap } from './components/PhoneMap';
import { STREET, RETURN_MONOLOGUES } from './data/streetRoute';
import type { Grade } from './components/ChapterMinigames';
import { INITIAL_CHAPTERS } from './data/chapters';
import { INSPECTABLE_OBJECTS } from './data/clues';
import { DIALOGUE_NODES } from './data/dialogues';
import { ActivityId, InspectionObjectData, DialogueNode } from './types/game';
import { CaseCompletedModal } from './components/CaseCompletedModal';
import { Package, BookMarked, GitFork, Menu, Save, Check } from 'lucide-react';

export const App: React.FC = () => {
  const gameState = useGameState();

  const [activeScreen, setActiveScreen] = useState<'main_menu' | 'gameplay' | 'combat'>('main_menu');
  const [activeInspectionData, setActiveInspectionData] = useState<InspectionObjectData | null>(null);
  const [isEvidenceBoardOpen, setIsEvidenceBoardOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChapterSelectOpen, setIsChapterSelectOpen] = useState(false);
  const [caseCompletedOpen, setCaseCompletedOpen] = useState(false);
  const [isSecondNightCutscene, setIsSecondNightCutscene] = useState(false);
  const [activeDialogueNode, setActiveDialogueNode] = useState<DialogueNode | null>(null);
  const [activeMinigame, setActiveMinigame] = useState<ActivityId | null>(null);
  const [clockHuntOpen, setClockHuntOpen] = useState(false);
  const [foundClocks, setFoundClocks] = useState<string[]>([]);
  const [repairClockId, setRepairClockId] = useState<string | null>(null);
  const [worldArea, setWorldArea] = useState<'house' | 'street' | 'school' | 'schoolhall' | 'return'>('house');
  const [routeProgress, setRouteProgress] = useState(0);
  const [grades, setGrades] = useState<Record<string, Grade>>({});

  const [streetThought, setStreetThought] = useState<string | null>(null);
  const streetThoughtTimer = useRef<number | null>(null);

  const pushStreetThought = useCallback((text: string) => {
    setStreetThought(text);
    if (streetThoughtTimer.current) window.clearTimeout(streetThoughtTimer.current);
    streetThoughtTimer.current = window.setTimeout(() => setStreetThought(null), 7200);
  }, []);

  useEffect(
    () => () => {
      if (streetThoughtTimer.current) window.clearTimeout(streetThoughtTimer.current);
    },
    [],
  );

  const subjectOrder: ActivityId[] = ['biology', 'math', 'chemistry', 'physics'];
  const SUBJECT_LABELS: Record<string, string> = {
    biology: 'Biologia',
    math: 'Matemática',
    chemistry: 'Química',
    physics: 'Física',
  };
  const nextSubject = useMemo(() => subjectOrder.find((s) => !grades[s]) ?? null, [grades]);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [cameraMotionEnabled, setCameraMotionEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('quem_e_voce_camera_motion');
      return saved === null ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : saved === 'true';
    } catch {
      return false;
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [thought, setThought] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const lastNoteRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('quem_e_voce_camera_motion', String(cameraMotionEnabled));
    } catch { /* A blocked preference store must not prevent gameplay. */ }
  }, [cameraMotionEnabled]);

  /* Preload every texture/sprite once, while the title screen is shown */
  useEffect(() => {
    preloadAssets(setLoadProgress).then(() => setAssetsReady(true));
  }, []);


  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  }, []);

  useEffect(() => {
    const onBlocked = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      if (message) showToast(message);
    };
    window.addEventListener('qvc:blocked', onBlocked);
    return () => window.removeEventListener('qvc:blocked', onBlocked);
  }, [showToast]);

  /* Gabriela's newest note surfaces as a quiet thought */
  useEffect(() => {
    if (activeScreen !== 'gameplay') return;
    const n = gameState.notes[0];
    if (n && n !== lastNoteRef.current) {
      lastNoteRef.current = n;
      setThought(n);
      const id = setTimeout(() => setThought(null), 6500);
      return () => clearTimeout(id);
    }
  }, [gameState.notes, activeScreen]);

  /* Autosave on floor change */
  useEffect(() => {
    if (activeScreen === 'gameplay') gameState.saveGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentFloor]);

  const chapters = useMemo(
    () =>
      INITIAL_CHAPTERS.map((ch) => ({
        ...ch,
        isUnlocked: gameState.unlockedChapters.includes(ch.number),
        isCompleted: ch.number < gameState.currentChapter,
      })),
    [gameState.unlockedChapters, gameState.currentChapter]
  );

  const bootAudio = () => {
    soundManager.init();
    soundManager.resume();
    soundManager.startRain();
    soundManager.startDrone(45);
    soundManager.startMusic();
  };

  const enterGameplay = useCallback(() => {
    setActiveScreen('gameplay');
    setShowHint(true);
    setTimeout(() => setShowHint(false), 14000);
  }, []);

  const enterDeveloperMode = useCallback(() => {
    bootAudio();
    setWorldArea('house');
    setFoundClocks(HOUSE_CLOCKS.map((clock) => clock.id));
    gameState.setCurrentFloor(1);
    gameState.setCurrentLocation('genkan');
    gameState.setStoryFlags((flags) => ({
      ...flags,
      intro_done: true,
      morningStarted: true,
      morning_talk: true,
      talked_to_grandma: true,
      breakfast_done: true,
      activity_bed: true,
      activity_desk: true,
      activity_bag: true,
      activity_uniform: true,
      activity_watson: true,
      clock_task_open: true,
      clocks_fixed: true,
      seven_clocks: true,
      developer_mode: true,
    }));
    enterGameplay();
    showToast('Modo desenvolvedor: rotina doméstica concluída.');
  }, [enterGameplay, gameState, showToast]);

  const handleStartGame = useCallback(
    (isNew: boolean) => {
      bootAudio();
      if (isNew) {
        gameState.deleteSave();
        setWorldArea('house');
        setFoundClocks([]);
        setRepairClockId(null);
        setClockHuntOpen(false);
        lastNoteRef.current = null;
        enterGameplay();
        setTimeout(() => setActiveDialogueNode(DIALOGUE_NODES['prologue_tick_1']), 900);
      } else {
        gameState.loadGame();
        enterGameplay();
      }
    },
    [gameState, enterGameplay]
  );

  // Restore derived chapter state from the historical storyFlags save format.
  useEffect(() => {
    const fixed = HOUSE_CLOCKS.filter((clock) => Boolean(gameState.storyFlags[`clock_${clock.id}_fixed`])).map((clock) => clock.id);
    if (fixed.length > 0 && fixed.join('|') !== foundClocks.join('|')) setFoundClocks(fixed);

    const schoolFinished = ['biology', 'math', 'chemistry', 'physics'].every((subject) => Boolean(gameState.storyFlags[`activity_${subject}`]));
    if (gameState.storyFlags.arrived_school) {
      setWorldArea(schoolFinished ? 'school' : 'schoolhall');
    } else if (gameState.storyFlags.left_house_for_school) {
      setWorldArea('street');
    }
  }, [gameState.storyFlags]);

  useEffect(() => {
    if (activeScreen === 'gameplay' && foundClocks.length > 0) gameState.saveGame();
    // saveGame is intentionally resolved from this render after the clock list changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundClocks, activeScreen]);

  useEffect(() => {    if (worldArea === 'school') {
      setActiveMinigame(null);
    }
  }, [worldArea]);

  useEffect(() => {    if (activeScreen === 'gameplay') gameState.saveGame();
    // Persist mission gates after React has committed the updated flags.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.storyFlags]);

  const applyDialogueSideEffects = useCallback(
    (nodeId: string) => {
      if (nodeId === 'grandma_finish_morning') gameState.setStoryFlags((p) => ({ ...p, talked_to_grandma: true, morning_talk: true, clock_task_open: true }));
      if (nodeId === 'clock_request' || nodeId === 'clock_answer_ok') {
        gameState.setStoryFlags((p) => ({ ...p, clock_task_open: true }));
      }
      if (nodeId === 'hallway_missing_painting' || nodeId === 'hallway_note_down' || nodeId === 'hallway_nail_examine')
        gameState.setStoryFlags((p) => ({ ...p, hallway_painting_anomaly: true }));
      if (nodeId === 'phone_pick_up' || nodeId === 'phone_analyze_sound' || nodeId === 'phone_reaction') {
        gameState.setStoryFlags((p) => ({ ...p, phone_event_triggered: true }));
        gameState.addNote('O telefone desconectado tocou na madrugada. Horário registrado: 03:17.');
      }
      if (nodeId === 'look_genkan_shoes') gameState.addNote('As sandálias da avó estão molhadas. Ela saiu durante a madrugada.');
      if (nodeId === 'look_furin') gameState.addNote('O furin toca sem vento.');
      if (nodeId === 'look_study_clock') gameState.addNote('Segundo relógio parado: 03:17 no escritório.');
      if (nodeId === 'look_kimono') gameState.addNote('Lama avermelhada no kimono da avó — solo das encostas do santuário.');
    },
    [gameState]
  );

  const f = gameState.storyFlags;
  const has = useCallback((key: string) => Boolean(f[key]), [f]);
  const morningReady = has('activity_bed') && has('activity_bag');
  const ateBreakfast = has('breakfast_done');
  const talkedMorning = has('morning_talk');
  const clocksComplete = foundClocks.length >= HOUSE_CLOCKS.length;
  const homeReady = morningReady
    && talkedMorning
    && ateBreakfast
    && has('activity_watson')
    && clocksComplete;

  const derivedTime = useMemo(() => {
    if (activeDialogueNode?.id.startsWith('prologue_')) return '03:17';
    const roomTasks = ['activity_bed', 'activity_desk', 'activity_bag', 'activity_uniform'].filter(has).length;
    if (!talkedMorning) return roomTasks === 0 ? '06:20' : roomTasks < 4 ? '06:31' : '06:51';
    if (!ateBreakfast || !has('activity_watson')) return '06:58';
    if (!clocksComplete) return '06:59';
    if (!homeReady) return '06:59';
    if (worldArea === 'house') return '07:00';
    if (worldArea === 'street') return '07:28';
    if (!f.activity_biology || !f.activity_math || !f.activity_chemistry || !f.activity_physics) return '08:10';
    if (!f.activity_cooking) return '18:07';
    return '21:43';
  }, [activeDialogueNode, ateBreakfast, clocksComplete, f, has, homeReady, talkedMorning, worldArea]);

  const currentObjective = useMemo(() => {
    if (!has('activity_bed') || !has('activity_bag')) return 'Arrume a cama e prepare a mochila antes de sair do quarto.';
    if (!talkedMorning) return 'Desça à cozinha e fale com a avó.';
    if (!ateBreakfast) return 'Sente-se à mesa e tome o café da manhã.';
    if (!has('activity_watson')) return 'Alimente Watson.';
    if (!clocksComplete) return 'Ajuste os sete relógios da casa para 07:00.';
    if (worldArea === 'house') return 'Tudo pronto. Saia pela porta da frente e siga para a escola.';
    if (worldArea === 'street') return 'Siga a rota do celular até a escola.';
    if (!f.activity_biology) return 'Vá para a escola e comece a aula de Biologia.';
    if (!f.activity_math) return 'Complete a aula de Matemática.';
    if (!f.activity_chemistry) return 'Complete a aula de Química.';
    if (!f.activity_physics) return 'Complete a aula de Física.';
    if (!f.activity_cooking) return 'Volte para casa e ajude no jantar.';
    return 'Organize o material e descanse. O dia ainda não acabou.';
  }, [ateBreakfast, clocksComplete, f, has, talkedMorning, worldArea]);

  const dlg = useCallback((id: string) => () => setActiveDialogueNode(DIALOGUE_NODES[id]), []);

  const completeMinigame = useCallback((result: MinigameResult) => {
    showToast(result.message);
    gameState.setStoryFlags((flags) => ({ ...flags, [`activity_${result.activity}`]: true }));
    gameState.addNote(result.message);
    setActiveMinigame(null);

    if (result.activity === 'bed' || result.activity === 'desk' || result.activity === 'bag' || result.activity === 'uniform') {
      const updated = { ...gameState.storyFlags, [`activity_${result.activity}`]: true };
      const ready = ['bed', 'bag'].every((id) => updated[`activity_${id}`]);
      if (ready && !gameState.storyFlags.morningStarted) {
        gameState.setStoryFlags((flags) => ({ ...flags, morningStarted: true }));
      }
    }
    if (result.activity === 'watson') {
      gameState.setStoryFlags((flags) => ({ ...flags, activity_watson: true }));
      setActiveDialogueNode(DIALOGUE_NODES['clock_request']);
    }
    if (result.activity === 'cooking') {
      setActiveDialogueNode(DIALOGUE_NODES['parents_question']);
    }
    if (['biology', 'math', 'chemistry', 'physics'].includes(result.activity)) {
      const grade = result.grade ?? 'C';
      setGrades((previous) => ({ ...previous, [result.activity]: grade }));
      gameState.addNote(`${SUBJECT_LABELS[result.activity] ?? result.activity}: nota ${grade} (${result.score ?? 0}/${result.total ?? 0}).`);
      if (result.activity === 'physics') {
        showToast('Aulas terminadas. Hora de voltar para casa.');
        setWorldArea('return');
        setRouteProgress(1);
        setActiveDialogueNode(DIALOGUE_NODES['after_school_grades']);
      } else {
        showToast(`${result.message} — siga para a próxima sala.`);
      }
    }
    gameState.saveGame();
  }, [gameState, showToast]);

  const activeHotspots: WorldHotspot[] = useMemo(
    () => ([
      // ---------- 2º ANDAR ----------
      {
        id: 'bed_task',
        name: gameState.storyFlags.dinner_done || (gameState.storyFlags.returned_from_school && gameState.storyFlags.activity_cooking)
          ? 'Deitar para dormir (21:43)'
          : 'Cama desarrumada',
        type: 'EXAMINAR',
        position: [-5.7, 0.4, -0.35],
        markerPosition: [-5.7, 1.15, -0.35],
        room: 'bedroom',
        floor: 2,
        action: () => {
          if (gameState.storyFlags.dinner_done || (gameState.storyFlags.returned_from_school && gameState.storyFlags.activity_cooking)) {
            setActiveDialogueNode(DIALOGUE_NODES['bedtime_reading_1']);
          } else {
            setActiveMinigame('bed');
          }
        },
      },
      { id: 'desk_task', name: 'Escrivaninha', type: 'EXAMINAR', position: [-1.7, 0.4, -1.25], markerPosition: [-1.7, 1.4, -1.25], room: 'bedroom', floor: 2, action: () => setActiveMinigame('desk') },
      { id: 'bag_task', name: 'Mochila escolar', type: 'EXAMINAR', position: [-1.25, 0.4, 1.45], markerPosition: [-1.25, 0.75, 1.45], room: 'bedroom', floor: 2, action: () => setActiveMinigame('bag') },
      { id: 'uniform_task', name: 'Uniforme escolar', type: 'EXAMINAR', position: [-0.5, 0.4, 1.85], markerPosition: [-0.5, 1.5, 1.85], room: 'bedroom', floor: 2, action: () => setActiveMinigame('uniform') },
      { id: 'family_photo_task', name: 'Fotografia dos pais', type: 'EXAMINAR', position: [-6.0, 0.4, -2.3], markerPosition: [-6.0, 1.75, -2.35], room: 'bedroom', floor: 2, action: dlg('look_family_photo') },
      { id: 'horror_book_task', name: 'Livro de terror', type: 'EXAMINAR', position: [-6.55, 0.4, 0.7], markerPosition: [-6.55, 1.85, 0.7], room: 'bedroom', floor: 2, action: dlg('look_horror_book') },
      { id: 'diary_task', name: 'Diário', type: 'EXAMINAR', position: [-1.95, 0.4, -1.55], markerPosition: [-1.95, 1.2, -1.55], room: 'bedroom', floor: 2, action: dlg('look_diary') },
      { id: 'bedroom_window_spot', name: 'Janela do quarto', type: 'EXAMINAR', position: [-2.9, 0.4, -1.5], room: 'bedroom', floor: 2, action: dlg('look_bedroom_window') },
      { id: 'desk_spot', name: 'Escrivaninha e quadro de horários', type: 'EXAMINAR', position: [-1.7, 0.4, -0.75], room: 'bedroom', floor: 2, action: dlg('look_corkboard') },
      { id: 'hallway_wall_spot', name: 'Parede do corredor', type: 'EXAMINAR', position: [0.9, 0.4, -1.7], room: 'upstairs_hall', floor: 2, action: dlg('hallway_missing_painting') },
      { id: 'bathroom_door_spot', name: 'Porta do banheiro', type: 'ABRIR', position: [2.3, 0.4, -1.7], room: 'upstairs_hall', floor: 2, action: dlg('look_bathroom') },
      {
        id: 'study_drawer_spot',
        name: 'Caixa de cedro do avô',
        type: 'EXAMINAR',
        position: [4.75, 0.4, -0.95],
        room: 'study',
        floor: 2,
        action: () => {
          setActiveInspectionData(INSPECTABLE_OBJECTS.study_photo);
          showToast('Fotografia antiga encontrada — 17 de Abril de 1974.');
        },
      },
      // ---------- TÉRREO ----------
      { id: 'butsudan_spot', name: 'Altar do avô', type: 'EXAMINAR', position: [-8.7, 0.4, -1.3], room: 'grandma_room', floor: 1, action: dlg('look_butsudan') },
      { id: 'kimono_spot', name: 'Kimono da avó', type: 'EXAMINAR', position: [-8.4, 0.4, 0.9], room: 'grandma_room', floor: 1, action: dlg('look_kimono') },
      { id: 'tokonoma_spot', name: 'Tokonoma', type: 'EXAMINAR', position: [-4.35, 0.4, -1.25], room: 'living_room', floor: 1, action: dlg('look_tokonoma') },
      { id: 'tv_spot', name: 'Televisão', type: 'EXAMINAR', position: [-4.0, 0.4, 1.75], room: 'living_room', floor: 1, action: dlg('look_tv') },
      {
        id: 'living_phone_spot',
        name: 'Telefone fixo',
        type: 'INSPECIONAR',
        position: [0.0, 0.4, -1.4],
        room: 'living_room',
        floor: 1,
        action: () => {
          if (gameState.storyFlags.found_1974_photo && !gameState.storyFlags.phone_event_triggered) setActiveDialogueNode(DIALOGUE_NODES['phone_call_event']);
          else setActiveInspectionData(INSPECTABLE_OBJECTS.rotary_phone);
        },
      },
      { id: 'grandma_chiyo_spot', name: 'Avó Chiyo', type: 'CONVERSAR', position: [2.4, 0.4, -0.55], markerPosition: [2.2, 1.65, -1.15], room: 'kitchen', floor: 1, action: dlg('morning_greeting_1') },
      {
        id: 'watson_task', name: 'Watson', type: 'EXAMINAR', position: [-3.5, 0.4, 1.55], markerPosition: [-3.5, 0.55, 1.55], room: 'living_room', floor: 1,
        action: () => {
          if (!talkedMorning) return showToast('Primeiro preciso falar com a avó e tomar café.');
          if (!ateBreakfast) return showToast('Ainda não terminei o café.');
          setActiveMinigame('watson');
        },
      },
      ...HOUSE_CLOCKS.map((clock) => ({
        id: `house_clock_${clock.id}`,
        name: clock.name,
        type: 'INSPECIONAR' as const,
        position: clock.position,
        markerPosition: clock.marker,
        reachFrom: clock.standAt,
        room: clock.area,
        floor: clock.floor,
        action: () => {
          if (!has('activity_watson')) {
            showToast('A avó ainda não pediu para acertar os relógios.');
            return;
          }
          setRepairClockId(clock.id);
        },
      })),
      {
        id: 'breakfast_spot', name: 'Mesa do café', type: 'EXAMINAR', position: [3.4, 0.4, 2.1], markerPosition: [3.1, 1.05, 0.85], room: 'kitchen', floor: 1,
        action: () => {
          if (!talkedMorning) return showToast('Devo falar com a avó primeiro.');
          gameState.setStoryFlags((flags) => ({ ...flags, breakfast_done: true }));
          showToast('Café da manhã terminado.');
          gameState.saveGame();
        },
      },
      { id: 'calendar_spot', name: 'Calendário', type: 'EXAMINAR', position: [5.95, 0.4, -1.0], room: 'kitchen', floor: 1, action: () => setActiveInspectionData(INSPECTABLE_OBJECTS.calendar_kyoto) },
      { id: 'genkan_shoes_spot', name: 'Sapateira', type: 'EXAMINAR', position: [8.0, 0.4, -1.5], room: 'street', floor: 1, action: dlg('look_genkan_shoes') },
      {
        id: 'front_door_spot', name: 'Porta de entrada', type: 'ABRIR', position: [9.0, 0.4, -0.6], room: 'street', floor: 1,
        action: () => {
          if (!homeReady) {
            showToast('Ainda há coisas para terminar antes da escola.');
            return;
          }
          setWorldArea('street');
          setRouteProgress(0);
          gameState.setCurrentLocation('street');
          gameState.setStoryFlags((flags) => ({ ...flags, left_house_for_school: true }));
          gameState.addNote('Saí de casa às 07:28 para ir à escola.');
          gameState.saveGame();
        },
      },
      { id: 'furin_spot', name: 'Furin', type: 'EXAMINAR', position: [-3.2, 0.4, 3.0], room: 'garden', floor: 1, action: dlg('look_furin') },
      { id: 'garden_spot', name: 'Lanterna de pedra', type: 'EXAMINAR', position: [-5.6, 0.4, 4.0], room: 'garden', floor: 1, action: dlg('look_garden') },
      {
        id: 'cook_dinner_spot',
        name: 'Ajudar a avó no jantar (18:07)',
        type: 'EXAMINAR',
        position: [2.8, 0.4, -1.8],
        markerPosition: [2.8, 1.2, -1.8],
        room: 'kitchen',
        floor: 1,
        action: () => {
          if (!gameState.storyFlags.returned_from_school) {
            showToast('Ainda não é hora do jantar.');
            return;
          }
          setActiveMinigame('cooking');
        },
      },
    ] as WorldHotspot[]).map((spot) => ({
      ...spot,
      markerPosition: ({
        bedroom_window_spot: [-3.3, 1.65, -2.3],
        desk_spot: [-1.7, 1.65, -2.3],
        hallway_wall_spot: [0.9, 1.6, -2.3],
        bathroom_door_spot: [2.3, 1.2, -2.3],
        study_drawer_spot: [5.15, 1.18, -1.8],
        butsudan_spot: [-8.7, 1.1, -1.7],
        kimono_spot: [-8.75, 1.25, 0.9],
        tokonoma_spot: [-4.1, 1.7, -2.3],
        tv_spot: [-4.43, 1.17, 1.75],
        living_phone_spot: [0, 1.12, -2.05],
        grandma_chiyo_spot: [2.2, 1.65, -1.15],
        breakfast_spot: [3.1, 1.05, 0.85],
        calendar_spot: [5.75, 1.75, -1.43],
        genkan_shoes_spot: [8.15, 0.9, -2.05],
        front_door_spot: [9.2, 1.25, -1.35],
        furin_spot: [-3.2, 2.18, 3.1],
        garden_spot: [-5.6, 1.05, 4.4],
      } as Record<string, [number, number, number]>)[spot.id],
    })),
    [ateBreakfast, gameState, homeReady, showToast, talkedMorning, dlg]
  );

      const anyModal = isEvidenceBoardOpen || isJournalOpen || isInventoryOpen || isSettingsOpen || isChapterSelectOpen || !!activeMinigame || clockHuntOpen || !!repairClockId;

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (activeScreen !== 'gameplay') return;
      const key = e.key.toLowerCase();
      if (activeDialogueNode && key !== 'escape') return;
      if (key === 'i') {
        setIsInventoryOpen((p) => !p);
        setIsJournalOpen(false);
        setIsEvidenceBoardOpen(false);
      } else if (key === 'j') {
        setIsJournalOpen((p) => !p);
        setIsInventoryOpen(false);
        setIsEvidenceBoardOpen(false);
      } else if (key === 'q') {
        setIsEvidenceBoardOpen((p) => !p);
        setIsInventoryOpen(false);
        setIsJournalOpen(false);
      } else if (key === 'escape') {
        if (activeInspectionData) setActiveInspectionData(null);
        else if (isEvidenceBoardOpen) setIsEvidenceBoardOpen(false);
        else if (isJournalOpen) setIsJournalOpen(false);
        else if (isInventoryOpen) setIsInventoryOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isChapterSelectOpen) setIsChapterSelectOpen(false);
        else if (!activeDialogueNode) setIsSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [activeScreen, activeInspectionData, isEvidenceBoardOpen, isJournalOpen, isInventoryOpen, isSettingsOpen, isChapterSelectOpen, activeDialogueNode]);

  const advanceDialogue = (nodeId: string | null) => {
    if (nodeId) {
      applyDialogueSideEffects(nodeId);
      const nextNode = DIALOGUE_NODES[nodeId];
      if (nextNode) {
        setActiveDialogueNode(nextNode);
        return;
      }
    }
    if (activeDialogueNode) {
      applyDialogueSideEffects(activeDialogueNode.id);
      const closingId = activeDialogueNode.id;
      setActiveDialogueNode(null);
      gameState.setStoryFlags((p) => ({ ...p, intro_done: true }));
      // The first conversation unlocks breakfast and Watson. The checklist is
      // introduced only after Watson is fed and Chiyo makes the request.
      if (['morning_greeting_1', 'watson_intro_3'].includes(closingId)) {
        gameState.setStoryFlags((p) => ({ ...p, morning_talk: true }));
      }
      if (closingId === 'clock_answer_ok') {
        gameState.setStoryFlags((p) => ({ ...p, clock_task_open: true }));
        setClockHuntOpen(true);
      }
      // End of the school day: show the report card, then walk home.
      if (closingId === 'after_school_grades_4') setWorldArea('school');
      if (closingId === 'dinner_eat_2') {
        gameState.setStoryFlags((p) => ({ ...p, dinner_done: true }));
        showToast('Suba para o seu quarto (2º andar) e deite-se para descansar.');
      }
      if (closingId === 'bedtime_reading_sleep') {
        setIsSecondNightCutscene(true);
        soundManager.startClock(1000);
        setTimeout(() => {
          setIsSecondNightCutscene(false);
          setActiveDialogueNode(DIALOGUE_NODES['second_317_wake']);
        }, 3600);
      }
      if (closingId === 'chapter_1_close') {
        setIsSecondNightCutscene(false);
        setCaseCompletedOpen(true);
        gameState.setCurrentChapter(2);
        gameState.saveGame();
      }
    }
    gameState.saveGame();
  };

  const handleDialogueOption = (option: { nextNodeId: string; grantClue?: string; setFlag?: string }) => {
    if (option.grantClue) gameState.unlockClue(option.grantClue);
    if (option.setFlag) gameState.setStoryFlags((p) => ({ ...p, [option.setFlag!]: true }));
    advanceDialogue(option.nextNodeId);
  };

  const handleInspectModelType = (modelType: string) => {
    if (modelType === 'clock') setActiveInspectionData(INSPECTABLE_OBJECTS.bedroom_clock);
    else if (modelType === 'photo') setActiveInspectionData(INSPECTABLE_OBJECTS.study_photo);
    else if (modelType === 'recorder') setActiveInspectionData(INSPECTABLE_OBJECTS.rotary_phone);
    else setActiveInspectionData(INSPECTABLE_OBJECTS.kitchen_clock);
    setIsInventoryOpen(false);
    setIsJournalOpen(false);
  };

  const locationLabel = gameState.currentFloor === 1 ? 'CASA · TÉRREO' : 'CASA · 2º ANDAR';

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-black text-neutral-200">
      {activeScreen === 'main_menu' && (
        <TitleScreen
          hasSavedGame={gameState.checkHasSave()}
          loadProgress={loadProgress}
          ready={assetsReady}
          onContinue={() => handleStartGame(false)}
          onNewGame={() => handleStartGame(true)}
          onOpenChapters={() => setIsChapterSelectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onExtra={() => {
            bootAudio();
            soundManager.startDrone(40);
            setActiveScreen('combat');
          }}
          onDeveloper={enterDeveloperMode}
        />
      )}

      {activeScreen === 'gameplay' && worldArea === 'house' && (
        <div className="relative w-full h-full">
          <ThreeWorld
            currentFloor={gameState.currentFloor}
            onFloorChange={(floor) => {
              gameState.setCurrentFloor(floor);
              gameState.setCurrentLocation(floor === 1 ? 'living_room' : 'bedroom');
            }}
            onInteract={() => undefined}
            isInspecting={!!activeInspectionData}
            isInDialogue={!!activeDialogueNode || anyModal}
            activeHotspots={activeHotspots}
            currentTime={derivedTime}
            cameraMotionEnabled={cameraMotionEnabled}
            canUseStairs={gameState.currentFloor !== 2 || morningReady}
            blockedMessage={gameState.currentFloor === 2 && !morningReady ? 'Arrume a cama e prepare a mochila antes de descer.' : undefined}
            fixedClockIds={foundClocks}
          />

          {/* Minimal HUD — time & place */}
          <div className="absolute top-5 left-6 z-20 pointer-events-none hud-shadow">
            <div className="font-title text-3xl tracking-[0.22em] text-neutral-100 leading-none">{derivedTime}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500" />
              <span className="font-serif-jp text-[11px] tracking-[0.35em] text-neutral-400">{locationLabel}</span>
            </div>
          </div>

          {/* Minimal HUD — actions */}
          <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
            {gameState.saveStatus !== 'idle' && (
              <span className="mr-2 flex items-center gap-1.5 font-serif-jp text-[10px] tracking-[0.3em] text-neutral-400 uppercase hud-shadow fade-up">
                {gameState.saveStatus === 'saving' ? <Save className="w-3 h-3 animate-pulse" /> : <Check className="w-3 h-3 text-emerald-400" />}
                {gameState.saveStatus === 'saving' ? 'Salvando' : 'Salvo'}
              </span>
            )}
            <button className="hud-btn" title="Inventário [I]" onClick={() => { soundManager.playClockTick(); setIsInventoryOpen(true); }}>
              <Package className="w-4 h-4" />
            </button>
            <button className="hud-btn relative" title="Diário [J]" onClick={() => { soundManager.playClockTick(); setIsJournalOpen(true); }}>
              <BookMarked className="w-4 h-4" />
              {gameState.clues.length > 1 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />}
            </button>
            <button className="hud-btn" title="Quadro de pistas [Q]" onClick={() => { soundManager.playClockTick(); setIsEvidenceBoardOpen(true); }}>
              <GitFork className="w-4 h-4" />
            </button>
            <button className="hud-btn" title="Menu [ESC]" onClick={() => setIsSettingsOpen(true)}>
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {has('activity_watson') && !clocksComplete && !repairClockId && !activeDialogueNode && (
            <ClockChecklist found={foundClocks} onOpen={() => setClockHuntOpen(true)} />
          )}

          {/* Objective */}
          {!activeDialogueNode && (
            <div className="absolute bottom-6 inset-x-0 z-20 flex flex-col items-center pointer-events-none hud-shadow">
              <span className="font-serif-jp text-[10px] tracking-[0.4em] text-red-400/80 uppercase">Objetivo</span>
              <span className="font-serif-jp text-sm text-neutral-300 mt-1 max-w-xl text-center px-4">{currentObjective}</span>
              {showHint && (
                <span className="mt-3 font-serif-jp text-[10px] tracking-[0.3em] text-neutral-600 uppercase" style={{ animation: 'fadeOutSlow 14s linear both' }}>
                  WASD mover · E interagir · I inventário · J diário · Q quadro
                </span>
              )}
            </div>
          )}

          {/* Gabriela's thought */}
          {thought && !activeDialogueNode && (
            <div className="absolute bottom-24 left-6 z-20 max-w-sm pointer-events-none fade-up hud-shadow">
              <span className="font-serif-jp text-[10px] tracking-[0.35em] text-neutral-500 uppercase block">Gabriela</span>
              <span className="font-serif-jp italic text-sm text-neutral-200">“{thought}”</span>
            </div>
          )}
        </div>
      )}

      {activeScreen === 'gameplay' && worldArea === 'street' && (
        <div className="relative w-full h-full">
          <NeighborhoodWorld
            paused={anyModal || !!activeDialogueNode || !!streetThought}
            cameraMotionEnabled={cameraMotionEnabled}
            onProgress={setRouteProgress}
            onMonologue={pushStreetThought}
            onArriveSchool={() => {
              setWorldArea('schoolhall');
              setActiveMinigame(null);
              setActiveDialogueNode(null);
              gameState.setCurrentLocation('school_hall');
              gameState.setStoryFlags((flags) => ({ ...flags, arrived_school: true }));
              gameState.saveGame();
            }}
          />
          <div className="absolute top-5 left-6 z-20 pointer-events-none hud-shadow">
            <div className="font-title text-3xl tracking-[0.22em] text-neutral-100 leading-none">
              07:{String(28 + Math.round(routeProgress * 18)).padStart(2, '0')}
            </div>
            <div className="mt-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-500" /><span className="font-serif-jp text-[11px] tracking-[0.35em] text-neutral-300">SAKYO-KU · RUA</span></div>
          </div>
          <PhoneMap progress={routeProgress} streetX={STREET.minX + routeProgress * (STREET.maxX - STREET.minX)} />
          <div className="absolute bottom-6 inset-x-0 z-20 text-center pointer-events-none hud-shadow">
            <span className="font-serif-jp text-[10px] tracking-[0.4em] text-red-300/80 uppercase">Objetivo</span>
            <p className="font-serif-jp text-sm text-neutral-100 mt-1">Siga a rota do celular até a escola.</p>
          </div>

          {streetThought && (
            <DialogueBox
              node={{ id: 'street_thought', speaker: 'Pensamento', avatar: 'gabriela_calm', text: streetThought }}
              onSelectOption={() => setStreetThought(null)}
              onNext={() => setStreetThought(null)}
              onClose={() => setStreetThought(null)}
            />
          )}
        </div>
      )}

      {activeScreen === 'gameplay' && worldArea === 'schoolhall' && (
        <div className="relative w-full h-full">
          <SchoolWorld
            paused={anyModal || !!activeDialogueNode}
            cameraMotionEnabled={cameraMotionEnabled}
            onTriggerDialogue={(id) => setActiveDialogueNode(DIALOGUE_NODES[id])}
            onSitAtDesk={() => {
              if (!nextSubject) {
                showToast('As aulas de hoje terminaram.');
                return;
              }
              setActiveMinigame(nextSubject);
            }}
          />
          <div className="absolute top-5 left-6 z-20 pointer-events-none hud-shadow">
            <div className="font-title text-3xl tracking-[0.22em] text-neutral-100 leading-none">08:10</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500" />
              <span className="font-serif-jp text-[11px] tracking-[0.35em] text-neutral-500">ESCOLA · CORREDOR</span>
            </div>
          </div>
          <div className="absolute top-5 right-5 z-20 grid gap-2 w-52">
            {subjectOrder.map((subject, index) => {
              const grade = grades[subject];
              const labels: Record<string, string> = { biology: 'Biologia', math: 'Matemática', chemistry: 'Química', physics: 'Física' };
              const active = nextSubject === subject;
              return (
                <div key={subject} className={`px-3 py-2 text-xs font-serif-jp border ${active ? 'border-white text-white bg-black/50' : 'border-neutral-800 text-neutral-500 bg-black/35'}`}>
                  {index + 1}. {labels[subject]} {grade && <span className="ml-2 text-emerald-300">{grade}</span>}
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-6 inset-x-0 z-20 text-center pointer-events-none hud-shadow">
            <span className="font-serif-jp text-[10px] tracking-[0.4em] text-red-400/80 uppercase">Objetivo</span>
            <p className="font-serif-jp text-sm text-neutral-200 mt-1">
              {nextSubject
                ? `Vá até a sala 2-B, no fim do corredor, e sente-se na sua mesa para ${SUBJECT_LABELS[nextSubject]}.`
                : 'Todas as aulas terminaram. Saia pelo corredor.'}
            </p>
          </div>
        </div>
      )}

      {activeScreen === 'gameplay' && worldArea === 'return' && (
        <div className="relative w-full h-full">
          <NeighborhoodWorld
            paused={anyModal || !!activeDialogueNode || !!streetThought}
            cameraMotionEnabled={cameraMotionEnabled}
            direction="home"
            onProgress={setRouteProgress}
            onMonologue={pushStreetThought}
            monologues={RETURN_MONOLOGUES}
            onArriveSchool={() => undefined}
            onArriveHome={() => {
              setWorldArea('house');
              gameState.setCurrentFloor(1);
              gameState.setCurrentLocation('living_room');
              showToast('Você voltou para casa.');
              gameState.saveGame();
            }}
          />
          <div className="absolute top-5 left-6 z-20 pointer-events-none hud-shadow">
            <div className="font-title text-3xl tracking-[0.22em] text-neutral-100 leading-none">16:43</div>
            <div className="mt-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-500" /><span className="font-serif-jp text-[11px] tracking-[0.35em] text-neutral-300">VOLTA PARA CASA</span></div>
          </div>
          <PhoneMap progress={routeProgress} streetX={STREET.minX + routeProgress * (STREET.maxX - STREET.minX)} />
          <div className="absolute bottom-6 inset-x-0 z-20 text-center pointer-events-none hud-shadow">
            <span className="font-serif-jp text-[10px] tracking-[0.4em] text-red-300/80 uppercase">Objetivo</span>
            <p className="font-serif-jp text-sm text-neutral-100 mt-1">Volte pelo caminho da manhã.</p>
          </div>
          {streetThought && (
            <DialogueBox
              node={{ id: 'return_thought', speaker: 'Pensamento', avatar: 'gabriela_calm', text: streetThought }}
              onSelectOption={() => setStreetThought(null)}
              onNext={() => setStreetThought(null)}
              onClose={() => setStreetThought(null)}
            />
          )}
        </div>
      )}

      {activeScreen === 'gameplay' && worldArea === 'school' && (
        <div className="relative w-full h-full bg-[#0a0d12] flex items-center justify-center px-6">
          <div className="max-w-md text-center font-serif-jp">
            <p className="text-[10px] tracking-[0.4em] text-neutral-500 uppercase">Notas do dia</p>
            <div className="mt-5 grid gap-2">
              {subjectOrder.map((s) => (
                <div key={s} className="flex justify-between border border-neutral-800 px-4 py-3 text-sm">
                  <span>{SUBJECT_LABELS[s]}</span>
                  <span className="text-emerald-300">{grades[s] ?? '—'}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-neutral-400 italic leading-relaxed">
              Boas notas deveriam bastar. Hoje elas parecem só uma forma de não ter que conversar.
            </p>
            <button
              className="inspection-action justify-center mx-auto mt-8"
              onClick={() => {
                setWorldArea('return');
                setRouteProgress(1);
                gameState.saveGame();
              }}
            >
              Sair da escola e voltar para casa →
            </button>
          </div>
        </div>
      )}

      {activeScreen === 'combat' && (
        <CombatModal
          playerStats={gameState.playerStats}
          onUpdateStats={(s) => gameState.setPlayerStats((p) => ({ ...p, ...s }))}
          onVictory={() => {
            showToast('A anomalia se dissipou. A racionalidade de Gabriela prevaleceu.');
            enterGameplay();
          }}
          onFlee={() => {
            showToast('Gabriela recuou para um cômodo seguro.');
            enterGameplay();
          }}
          onDefeat={() => {
            showToast('A mente de Gabriela foi sobrecarregada.');
            setActiveScreen('main_menu');
          }}
        />
      )}

      {activeDialogueNode && (
        <DialogueBox node={activeDialogueNode} onSelectOption={handleDialogueOption} onNext={() => advanceDialogue(activeDialogueNode.next ?? null)} onClose={() => advanceDialogue(null)} />
      )}

      {activeInspectionData && (
        <InspectionModal
          key={activeInspectionData.id}
          data={activeInspectionData}
          clueIds={gameState.clues.map((clue) => clue.id)}
          onClose={() => setActiveInspectionData(null)}
          onUnlockClue={(clueId) => {
            gameState.unlockClue(clueId);
            gameState.saveGame();
          }}
        />
      )}

      {isEvidenceBoardOpen && (
        <EvidenceBoard
          nodes={gameState.evidenceNodes.filter((n) => n.isUnlocked)}
          connections={gameState.evidenceConnections}
          onConnect={(a, b) => {
            gameState.connectEvidenceNodes(a, b);
            gameState.saveGame();
          }}
          onRemoveConnection={(id) => {
            gameState.removeEvidenceConnection(id);
            gameState.saveGame();
          }}
          onMoveNode={(id, x, y) => {
            gameState.moveEvidenceNode(id, x, y);
            gameState.saveGame();
          }}
          onClose={() => setIsEvidenceBoardOpen(false)}
        />
      )}

      {isJournalOpen && (
        <JournalModal
          clues={gameState.clues}
          notes={gameState.notes}
          currentTime={derivedTime}
          onClose={() => setIsJournalOpen(false)}
          onSelectInspectClue={(clueId) => {
            if (clueId.includes('clock')) handleInspectModelType('clock');
            else if (clueId.includes('photo')) handleInspectModelType('photo');
            else handleInspectModelType('recorder');
          }}
        />
      )}

      {isInventoryOpen && (
        <InventoryModal items={gameState.inventory} onClose={() => setIsInventoryOpen(false)} onInspectItem3D={handleInspectModelType} onCombineItems={() => showToast('Tentativa de combinar os itens catalogados.')} />
      )}

      {worldArea !== 'school' && activeMinigame && (
        <ChapterMinigames
          activity={activeMinigame}
          onClose={() => setActiveMinigame(null)}
          onComplete={completeMinigame}
        />
      )}

      {clockHuntOpen && (
        <ClockHunt
          found={foundClocks}
          onClose={() => setClockHuntOpen(false)}
          onFinish={() => {
            setClockHuntOpen(false);
            showToast('Os sete relógios foram ajustados. Hora de ir para a escola.');
            gameState.addNote('Ajustei os sete relógios da casa para 07:00.');
            gameState.setStoryFlags((flags) => ({ ...flags, seven_clocks: true, clocks_fixed: true }));
            gameState.saveGame();
          }}
        />
      )}

      {repairClockId && (() => {
        const clock = HOUSE_CLOCKS.find((c) => c.id === repairClockId);
        if (!clock) return null;
        return (
          <ClockRepairModal
            key={`${clock.id}-${foundClocks.includes(clock.id) ? 'fixed' : 'broken'}`}
            clockId={clock.id}
            name={clock.name}
            room={clock.label}
            wrong={clock.wrong}
            target={clock.target}
            alreadyFixed={foundClocks.includes(clock.id)}
            onClose={() => setRepairClockId(null)}
            onFixed={(id) => {
              setFoundClocks((list) => {
                const next = list.includes(id) ? list : [...list, id];
                if (next.length === HOUSE_CLOCKS.length) {
                  showToast('Os sete relógios foram ajustados. Agora são 07:00.');
                  gameState.setStoryFlags((flags) => ({ ...flags, seven_clocks: true, clocks_fixed: true }));
                  gameState.addNote('Ajustei os sete relógios da casa para 07:00.');
                }
                return next;
              });
              gameState.setStoryFlags((flags) => ({ ...flags, [`clock_${id}_fixed`]: true }));
              gameState.addNote(`${clock.name} ajustado para 07:00.`);
              gameState.saveGame();
              setTimeout(() => setRepairClockId(null), 650);
            }}
          />
        );
      })()}

      {isChapterSelectOpen && (
        <ChapterSelectModal
          chapters={chapters}
          currentChapter={gameState.currentChapter}
          onSelectChapter={(num) => {
            if (gameState.checkHasSave()) gameState.loadGame();
            gameState.selectChapter(num);
            bootAudio();
            enterGameplay();
          }}
          onClose={() => setIsChapterSelectOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          crtEnabled={crtEnabled}
          onToggleCrt={setCrtEnabled}
          cameraMotionEnabled={cameraMotionEnabled}
          onToggleCameraMotion={setCameraMotionEnabled}
          onManualSave={() => gameState.saveGame()}
          onResetData={() => {
            gameState.deleteSave();
            setActiveScreen('main_menu');
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isSecondNightCutscene && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-center font-mono select-none animate-fade-in">
          <p className="text-neutral-500 text-xs tracking-[0.5em] mb-4">KYOTO · 03:16 AM</p>
          <p className="text-3xl text-neutral-400 font-title tracking-[0.3em] mb-2">TIC.</p>
          <p className="text-6xl text-red-500 font-title font-bold tracking-[0.3em] animate-pulse">03:17</p>
          <p className="text-neutral-600 text-xs mt-6 tracking-widest">O som do relógio desaparece...</p>
        </div>
      )}

      {caseCompletedOpen && (
        <CaseCompletedModal
          onContinue={() => {
            setCaseCompletedOpen(false);
            setActiveScreen('main_menu');
          }}
        />
      )}

      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] font-serif-jp text-sm text-neutral-100 tracking-wide hud-shadow fade-up pointer-events-none">
          <span className="text-red-400 mr-2">▸</span>
          {toastMessage}
        </div>
      )}

      {activeScreen === 'gameplay' && <div className="vignette" aria-hidden="true" />}
      {crtEnabled && <div className="crt-overlay" aria-hidden="true" />}
    </div>
  );
};

export default App;
