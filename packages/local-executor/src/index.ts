// Barrel export for @usb-ui-test/local-executor.

export {
  DeterministicExecutor,
  type AppContext,
  type DeterministicExecutorConfig,
  type DeterministicRunResult,
  type DriverHandle,
  type ExecutorProgressEvent,
} from './DeterministicExecutor.js';

export {
  detectMode,
  parseStructuredSteps,
} from './parser.js';

export {
  resolveSelector,
  findMatches,
  hasMatch,
  SelectorNotFoundError,
} from './selector.js';

export {
  retryUntil,
  waitUntilStable,
  type WaitOptions,
  type StableOptions,
} from './waiter.js';

export type {
  AssertNotVisibleStep,
  AssertVisibleStep,
  ClearAppDataStep,
  Coordinate,
  InputTextStep,
  LaunchAppStep,
  Selector,
  StepResult,
  StructuredStep,
  SwipeDirection,
  SwipeStep,
  TapOnStep,
  WaitForStep,
} from './types.js';
