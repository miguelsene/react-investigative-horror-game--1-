import { useCallback, useMemo, useState } from 'react';
import { ActivityId, ChapterBeat, LocationId, WorldMapId } from '../types/game';

export interface ChapterState {
  map: WorldMapId;
  location: LocationId;
  floor: 1 | 2;
  time: string;
  phase: ChapterBeat;
  completed: ActivityId[];
  beats: ChapterBeat[];
}

const INITIAL: ChapterState = {
  map: 'house2',
  location: 'bedroom',
  floor: 2,
  time: '03:17',
  phase: 'prologue_317',
  completed: [],
  beats: [],
};

const beatExists = (list: ChapterBeat[], beat: ChapterBeat) => list.includes(beat);

export const CHAPTER_OBJECTIVES: Partial<Record<ChapterBeat, string>> = {
  prologue_317: 'Aguarde o pesadelo terminar.',
  wake_0620: 'Prepare-se para a escola.',
  morning_room: 'Arrume a cama, organize a mesa e prepare a mochila.',
  ready_downstairs: 'Desça para o café da manhã.',
  breakfast: 'Converse com a avó e alimente Watson.',
  clocks_started: 'Encontre os sete relógios marcados em 03:17.',
  seven_clocks: 'Volte à cozinha depois de verificar os relógios.',
  leave_house: 'Saia de casa para a escola.',
  route_school: 'Siga pela rua residencial até o portão da escola.',
  emi_met: 'Encontre Emi no corredor da escola.',
  class_biology: 'Complete a aula de Biologia.',
  class_math: 'Complete a aula de Matemática.',
  class_chemistry: 'Complete a aula de Química.',
  class_physics: 'Complete a aula de Física.',
  lunch: 'Fale com Emi no intervalo.',
  school_done: 'Volte para casa.',
  route_home: 'Percorra o caminho de volta no fim da tarde.',
  home_1807: 'Converse com a avó.',
  dinner_prepared: 'Ajude a preparar o jantar.',
  night_reading: 'Organize o material e leia um pouco antes de dormir.',
  second_317: 'Investigue a janela às 03:17.',
  handprint: 'Examine a marca no vidro.',
  chapter_complete: 'Capítulo concluído.',
};

export const useChapterOne = () => {
  const [state, setState] = useState<ChapterState>(INITIAL);

  const completeActivity = useCallback((activity: ActivityId) => {
    setState((previous) => {
      if (previous.completed.includes(activity)) return previous;
      return { ...previous, completed: [...previous.completed, activity] };
    });
  }, []);

  const isComplete = useCallback((activity: ActivityId) => state.completed.includes(activity), [state.completed]);

  const goBeat = useCallback((beat: ChapterBeat, patch?: Partial<ChapterState>) => {
    setState((previous) => ({
      ...previous,
      ...patch,
      phase: beat,
      beats: beatExists(previous.beats, beat) ? previous.beats : [...previous.beats, beat],
    }));
  }, []);

  const travel = useCallback((map: WorldMapId, location: LocationId, floor: 1 | 2, time: string, beat?: ChapterBeat) => {
    setState((previous) => ({
      ...previous,
      map,
      location,
      floor,
      time,
      phase: beat ?? previous.phase,
      beats: beat && !beatExists(previous.beats, beat) ? [...previous.beats, beat] : previous.beats,
    }));
  }, []);

  const objective = useMemo(() => CHAPTER_OBJECTIVES[state.phase] ?? 'Investigue.', [state.phase]);

  const morningCount = useMemo(
    () => ['bed', 'desk', 'bag', 'uniform'].filter((id) => state.completed.includes(id as ActivityId)).length,
    [state.completed],
  );

  const clockCount = useMemo(() => {
    const clocks: ActivityId[] = [];
    // Placeholder count; the chapter system marks discovered clocks through clues.
    return clocks.length;
  }, []);

  const resetChapter = useCallback(() => setState(INITIAL), []);

  return { state, setState, completeActivity, isComplete, goBeat, travel, objective, morningCount, clockCount, resetChapter };
};

export type ChapterOneController = ReturnType<typeof useChapterOne>;
