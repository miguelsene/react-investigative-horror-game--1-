import { useEffect, useRef, type FC } from 'react';
import EmbeddedPc from '../pc-escola/EmbeddedPc';
import { useOS, getTaskStatus } from '../pc-escola/os/store';

interface SchoolComputerProps {
  completed: boolean;
  onRunExercise: () => void;
  onClose: () => void;
  onExerciseComplete: () => void;
}

export const SchoolComputer: FC<SchoolComputerProps> = ({ onClose, onExerciseComplete }) => {
  const task = useOS((state) => state.task);
  const wasCompleted = useRef(false);

  useEffect(() => {
    if (getTaskStatus(useOS.getState()).completed && !wasCompleted.current) {
      wasCompleted.current = true;
      onExerciseComplete();
    }
  }, [task, onExerciseComplete]);

  return <EmbeddedPc onExit={onClose} />;
};
