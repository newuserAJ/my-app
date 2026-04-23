// Navigation stack manager to prevent mixed-up routing
export type SignUpStep = 'name' | 'focus' | 'hub' | 'network' | 'details';

export interface SignUpState {
  currentStep: SignUpStep;
  firstName: string;
  lastName: string;
  focus: string | null;
  hub: string | null;
  network: string | null;
  day: string;
  month: string;
  year: string;
  gender: string | null;
}

// Initial state
export const initialSignUpState: SignUpState = {
  currentStep: 'name',
  firstName: '',
  lastName: '',
  focus: null,
  hub: null,
  network: null,
  day: '',
  month: '',
  year: '',
  gender: null,
};

// Validation functions
export const validateStep = (step: SignUpStep, state: SignUpState): boolean => {
  switch (step) {
    case 'name':
      return !!(state.firstName && state.lastName);
    case 'focus':
      return !!state.focus;
    case 'hub':
      return !!state.hub;
    case 'network':
      return !!state.network;
    case 'details':
      return !!(state.day && state.month && state.year && state.gender);
    default:
      return false;
  }
};

// Get next step in flow
export const getNextStep = (currentStep: SignUpStep): SignUpStep | null => {
  const flow: Record<SignUpStep, SignUpStep | null> = {
    name: 'focus',
    focus: 'hub',
    hub: 'network',
    network: 'details',
    details: null,
  };
  return flow[currentStep];
};

// Get previous step in flow
export const getPreviousStep = (currentStep: SignUpStep): SignUpStep | null => {
  const flow: Record<SignUpStep, SignUpStep | null> = {
    name: null,
    focus: 'name',
    hub: 'focus',
    network: 'hub',
    details: 'network',
  };
  return flow[currentStep];
};
