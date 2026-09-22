import { LocationId } from '../types/game';

export interface HouseClock {
  id: string;
  name: string;
  label: string;
  area: LocationId;
  floor: 1 | 2;
  /** x/z are used for proximity; y only anchors the prompt in the air. */
  position: [number, number, number];
  marker: [number, number, number];
  wrong: string;
  target: string;
  clue: string;
  /** Position inside the floor plan drawn in the checklist, in percent. */
  plan: { x: number; y: number; floor: 1 | 2 };
  /**
   * Walkable spot in front of the clock. Guarantees the prompt appears even
   * when furniture occupies the floor directly beneath the wall.
   */
  standAt: [number, number];
}

export const HOUSE_CLOCKS: HouseClock[] = [
  {
    id: 'bedroom_clock',
    name: 'Despertador do quarto',
    label: 'Quarto',
    area: 'bedroom',
    floor: 2,
    position: [-4.21, 0.79, -1.97],
    marker: [-4.21, 0.98, -1.9],
    wrong: '03:17',
    target: '07:00',
    clue: 'Sobre o criado-mudo, ao lado da cama.',
    plan: { x: 26, y: 40, floor: 2 },
    standAt: [-4.21, -0.95],
  },
  {
    id: 'study_clock',
    name: 'Relógio do escritório',
    label: 'Escritório',
    area: 'study',
    floor: 2,
    position: [4.2, 2.24, -2.4],
    marker: [4.2, 2.44, -2.2],
    wrong: '03:17',
    target: '07:00',
    clue: 'Na parede do escritório, à direita da mesa.',
    plan: { x: 78, y: 34, floor: 2 },
    standAt: [4.2, -1.05],
  },
  {
    id: 'grandma_clock',
    name: 'Relógio do quarto da avó',
    label: 'Quarto da avó',
    area: 'grandma_room',
    floor: 1,
    position: [-8.85, 2.15, -2.42],
    marker: [-8.85, 2.32, -2.4],
    wrong: '03:17',
    target: '07:00',
    clue: 'Acima do altar, perto da janela de papel.',
    plan: { x: 12, y: 36, floor: 1 },
    standAt: [-8.85, -1.3],
  },
  {
    id: 'living_clock',
    name: 'Relógio da sala',
    label: 'Sala',
    area: 'living_room',
    floor: 1,
    position: [-2.6, 2.05, -2.42],
    marker: [-2.6, 2.22, -2.4],
    wrong: '03:17',
    target: '07:00',
    clue: 'Na parede comprida, entre o tokonoma e o telefone.',
    plan: { x: 42, y: 36, floor: 1 },
    standAt: [-2.6, -1.15],
  },
  {
    id: 'kitchen_clock',
    name: 'Relógio da cozinha',
    label: 'Cozinha',
    area: 'kitchen',
    floor: 1,
    position: [2.55, 2.24, -2.34],
    marker: [2.55, 2.44, -2.18],
    wrong: '03:17',
    target: '07:00',
    clue: 'Sobre a bancada, ao lado do exaustor.',
    plan: { x: 62, y: 36, floor: 1 },
    standAt: [2.55, -1.35],
  },
  {
    id: 'hall_clock',
    name: 'Relógio do corredor',
    label: 'Corredor',
    area: 'genkan',
    floor: 1,
    position: [6.9, 2.1, -2.32],
    marker: [6.9, 2.28, -2.12],
    wrong: '03:17',
    target: '07:00',
    clue: 'Antes da entrada, quase escondido pelos retratos.',
    plan: { x: 78, y: 36, floor: 1 },
    standAt: [6.9, -1.25],
  },
  {
    id: 'engawa_clock',
    name: 'Relógio da varanda',
    label: 'Varanda',
    area: 'garden',
    floor: 1,
    position: [-4.85, 1.5, 3.26],
    marker: [-4.85, 1.66, 3.26],
    wrong: '03:17',
    target: '07:00',
    clue: 'Pendurado no poste do beiral, do lado do jardim.',
    plan: { x: 34, y: 76, floor: 1 },
    standAt: [-4.85, 2.55],
  },
];
