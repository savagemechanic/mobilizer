import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface State {
  id: string;
  name: string;
  code: string;
  countryId: string;
}

interface LGA {
  id: string;
  name: string;
  code: string;
  stateId: string;
}

interface Ward {
  id: string;
  name: string;
  code: string;
  lgaId: string;
}

interface PollingUnit {
  id: string;
  name: string;
  code: string;
  wardId: string;
}

interface LocationsState {
  // State
  countries: Country[];
  states: State[];
  lgas: LGA[];
  wards: Ward[];
  pollingUnits: PollingUnit[];

  // Selection
  selectedCountryId: string | null;
  selectedStateId: string | null;
  selectedLgaId: string | null;
  selectedWardId: string | null;
  selectedPollingUnitId: string | null;

  // Loading states
  countriesLoading: boolean;
  statesLoading: boolean;
  lgasLoading: boolean;
  wardsLoading: boolean;
  pollingUnitsLoading: boolean;

  // Actions
  setCountries: (countries: Country[]) => void;
  setStates: (states: State[]) => void;
  setLGAs: (lgas: LGA[]) => void;
  setWards: (wards: Ward[]) => void;
  setPollingUnits: (pollingUnits: PollingUnit[]) => void;

  setSelectedCountryId: (id: string | null) => void;
  setSelectedStateId: (id: string | null) => void;
  setSelectedLgaId: (id: string | null) => void;
  setSelectedWardId: (id: string | null) => void;
  setSelectedPollingUnitId: (id: string | null) => void;

  setCountriesLoading: (loading: boolean) => void;
  setStatesLoading: (loading: boolean) => void;
  setLGAsLoading: (loading: boolean) => void;
  setWardsLoading: (loading: boolean) => void;
  setPollingUnitsLoading: (loading: boolean) => void;

  // Reset cascade
  resetFromCountry: () => void;
  resetFromState: () => void;
  resetFromLGA: () => void;
  resetFromWard: () => void;
  resetAll: () => void;
}

export const useLocationsStore = create<LocationsState>()(
  persist(
    (set) => ({
      // Initial state
      countries: [],
      states: [],
      lgas: [],
      wards: [],
      pollingUnits: [],

      selectedCountryId: null,
      selectedStateId: null,
      selectedLgaId: null,
      selectedWardId: null,
      selectedPollingUnitId: null,

      countriesLoading: false,
      statesLoading: false,
      lgasLoading: false,
      wardsLoading: false,
      pollingUnitsLoading: false,

  // Setters
  setCountries: (countries) => set({ countries }),
  setStates: (states) => set({ states }),
  setLGAs: (lgas) => set({ lgas }),
  setWards: (wards) => set({ wards }),
  setPollingUnits: (pollingUnits) => set({ pollingUnits }),

  setSelectedCountryId: (id) => set({ selectedCountryId: id }),
  setSelectedStateId: (id) => set({ selectedStateId: id }),
  setSelectedLgaId: (id) => set({ selectedLgaId: id }),
  setSelectedWardId: (id) => set({ selectedWardId: id }),
  setSelectedPollingUnitId: (id) => set({ selectedPollingUnitId: id }),

  setCountriesLoading: (loading) => set({ countriesLoading: loading }),
  setStatesLoading: (loading) => set({ statesLoading: loading }),
  setLGAsLoading: (loading) => set({ lgasLoading: loading }),
  setWardsLoading: (loading) => set({ wardsLoading: loading }),
  setPollingUnitsLoading: (loading) => set({ pollingUnitsLoading: loading }),

  // Reset cascading selections
  resetFromCountry: () =>
    set({
      selectedStateId: null,
      selectedLgaId: null,
      selectedWardId: null,
      selectedPollingUnitId: null,
      states: [],
      lgas: [],
      wards: [],
      pollingUnits: [],
    }),

  resetFromState: () =>
    set({
      selectedLgaId: null,
      selectedWardId: null,
      selectedPollingUnitId: null,
      lgas: [],
      wards: [],
      pollingUnits: [],
    }),

  resetFromLGA: () =>
    set({
      selectedWardId: null,
      selectedPollingUnitId: null,
      wards: [],
      pollingUnits: [],
    }),

  resetFromWard: () =>
    set({
      selectedPollingUnitId: null,
      pollingUnits: [],
    }),

  resetAll: () =>
    set({
      selectedCountryId: null,
      selectedStateId: null,
      selectedLgaId: null,
      selectedWardId: null,
      selectedPollingUnitId: null,
      states: [],
      lgas: [],
      wards: [],
      pollingUnits: [],
    }),
    }),
    {
      name: 'locations-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist the selected location IDs
        // Location lists should be fetched fresh on app load
        selectedCountryId: state.selectedCountryId,
        selectedStateId: state.selectedStateId,
        selectedLgaId: state.selectedLgaId,
        selectedWardId: state.selectedWardId,
        selectedPollingUnitId: state.selectedPollingUnitId,
      }),
    }
  )
);
