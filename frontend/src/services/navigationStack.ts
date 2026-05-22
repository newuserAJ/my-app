// Navigation stack manager to prevent mixed-up routing
export type SignUpStep = 'name' | 'phone' | 'details' | 'focus' | 'hub' | 'network' | 'completed';

export interface SignUpState {
  currentStep: SignUpStep;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  day: string;
  month: string;
  year: string;
  gender: string | null;
  focus: string | null;
  hub: string | null;
  network: string | null;
}

// Initial state
export const initialSignUpState: SignUpState = {
  currentStep: 'name',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  day: '',
  month: '',
  year: '',
  gender: null,
  focus: null,
  hub: null,
  network: null,
};

// Validation functions
export const validateStep = (step: SignUpStep, state: SignUpState): boolean => {
  switch (step) {
    case 'name':
      return !!(state.firstName && state.lastName);
    case 'phone':
      return !!(state.phoneNumber && state.phoneNumber.length >= 10);
    case 'details':
      return !!(state.day && state.month && state.year && state.gender);
    case 'focus':
      return !!state.focus;
    case 'hub':
      return !!state.hub;
    case 'network':
      return !!state.network;
    case 'completed':
      return true;
    default:
      return false;
  }
};

// Get next step in flow
export const getNextStep = (currentStep: SignUpStep): SignUpStep | null => {
  const flow: Record<SignUpStep, SignUpStep | null> = {
    name: 'phone',
    phone: 'details',
    details: 'focus',
    focus: 'hub',
    hub: 'network',
    network: 'completed',
    completed: null,
  };
  return flow[currentStep];
};

// Get previous step in flow
export const getPreviousStep = (currentStep: SignUpStep): SignUpStep | null => {
  const flow: Record<SignUpStep, SignUpStep | null> = {
    name: null,
    phone: 'name',
    details: 'phone',
    focus: 'details',
    hub: 'focus',
    network: 'hub',
    completed: 'network',
  };
  return flow[currentStep];
};
