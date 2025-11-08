/**
 * State machine для управления потоком тренировки
 * WarmupTimer → ExerciseWarmup → Rest → WorkingSet → Rest → ... → Finished
 */

export type WorkoutState =
  | 'warmup_timer'
  | 'exercise_warmup'
  | 'working_set'
  | 'rest'
  | 'add_exercise'
  | 'finished';

export type WorkoutEvent =
  | { type: 'NEXT' }
  | { type: 'COMPLETE_SET' }
  | { type: 'TIMER_END' }
  | { type: 'ADD_EXERCISE' }
  | { type: 'FINISH' };

export interface WorkoutContext {
  currentExerciseIndex: number;
  currentSetNumber: number;
  totalExercises: number;
  totalSets: number;
  exercises: any[];
}

export class WorkoutStateMachine {
  private state: WorkoutState = 'warmup_timer';
  private context: WorkoutContext;

  constructor(initialContext: WorkoutContext) {
    this.context = initialContext;
  }

  getState(): WorkoutState {
    return this.state;
  }

  getContext(): WorkoutContext {
    return this.context;
  }

  transition(event: WorkoutEvent): void {
    // TODO: Implement state machine logic
    // This is a placeholder for the actual implementation
    console.log('Transition:', this.state, event);
  }
}

