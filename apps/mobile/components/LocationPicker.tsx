import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useQuery } from '@apollo/client';
import {
  GET_STATES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS,
} from '@/lib/graphql/queries/locations';

interface LocationOption {
  id: string;
  name: string;
  code: string;
}

export interface LocationValue {
  stateId?: string;
  lgaId?: string;
  wardId?: string;
  pollingUnitId?: string;
}

interface LocationPickerProps {
  value?: LocationValue;
  onChange: (location: LocationValue) => void;
  showPollingUnit?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function LocationPicker({
  value,
  onChange,
  showPollingUnit = true,
  disabled = false,
  error,
}: LocationPickerProps) {
  // Track if this is initial load to prevent cascading resets
  const isInitialLoad = useRef(true);
  const hasInitialized = useRef(false);

  // Local state for selections
  const [stateId, setStateId] = useState(value?.stateId || '');
  const [lgaId, setLgaId] = useState(value?.lgaId || '');
  const [wardId, setWardId] = useState(value?.wardId || '');
  const [pollingUnitId, setPollingUnitId] = useState(value?.pollingUnitId || '');

  // States query - fetches all states on mount
  const { data: statesData, loading: statesLoading, error: statesError } = useQuery(GET_STATES, {
    fetchPolicy: 'cache-first',
  });

  // LGAs query - fetches when stateId is set
  const { data: lgasData, loading: lgasLoading } = useQuery(GET_LGAS, {
    variables: { stateId },
    skip: !stateId,
    fetchPolicy: 'cache-first',
  });

  // Wards query - fetches when lgaId is set
  const { data: wardsData, loading: wardsLoading } = useQuery(GET_WARDS, {
    variables: { lgaId },
    skip: !lgaId,
    fetchPolicy: 'cache-first',
  });

  // Polling Units query - fetches when wardId is set
  const { data: pollingUnitsData, loading: pollingUnitsLoading } = useQuery(GET_POLLING_UNITS, {
    variables: { wardId },
    skip: !wardId || !showPollingUnit,
    fetchPolicy: 'cache-first',
  });

  // Extract data arrays
  const states: LocationOption[] = statesData?.states || [];
  const lgas: LocationOption[] = lgasData?.lgas || [];
  const wards: LocationOption[] = wardsData?.wards || [];
  const pollingUnits: LocationOption[] = pollingUnitsData?.pollingUnits || [];

  // Initialize from value prop
  useEffect(() => {
    if (value && !hasInitialized.current) {
      hasInitialized.current = true;

      if (value.stateId) setStateId(value.stateId);
      if (value.lgaId) setLgaId(value.lgaId);
      if (value.wardId) setWardId(value.wardId);
      if (value.pollingUnitId) setPollingUnitId(value.pollingUnitId);

      // Mark initial load as complete after a short delay
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 1000);
    }
  }, [value]);

  // Mark initial load complete if no value provided
  useEffect(() => {
    if (!value || !value.stateId) {
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 500);
    }
  }, []);

  // Notify parent of changes (only after initial load)
  const notifyChange = useCallback((newValue: LocationValue) => {
    if (!isInitialLoad.current) {
      onChange(newValue);
    }
  }, [onChange]);

  // Handle state change
  const handleStateChange = (newStateId: string) => {
    if (newStateId === stateId) return;

    setStateId(newStateId);
    setLgaId('');
    setWardId('');
    setPollingUnitId('');

    notifyChange({
      stateId: newStateId || undefined,
      lgaId: undefined,
      wardId: undefined,
      pollingUnitId: undefined,
    });
  };

  // Handle LGA change
  const handleLgaChange = (newLgaId: string) => {
    if (newLgaId === lgaId) return;

    setLgaId(newLgaId);
    setWardId('');
    setPollingUnitId('');

    notifyChange({
      stateId: stateId || undefined,
      lgaId: newLgaId || undefined,
      wardId: undefined,
      pollingUnitId: undefined,
    });
  };

  // Handle ward change
  const handleWardChange = (newWardId: string) => {
    if (newWardId === wardId) return;

    setWardId(newWardId);
    setPollingUnitId('');

    notifyChange({
      stateId: stateId || undefined,
      lgaId: lgaId || undefined,
      wardId: newWardId || undefined,
      pollingUnitId: undefined,
    });
  };

  // Handle polling unit change
  const handlePollingUnitChange = (newPollingUnitId: string) => {
    if (newPollingUnitId === pollingUnitId) return;

    setPollingUnitId(newPollingUnitId);

    notifyChange({
      stateId: stateId || undefined,
      lgaId: lgaId || undefined,
      wardId: wardId || undefined,
      pollingUnitId: newPollingUnitId || undefined,
    });
  };

  // Format label - show code and name
  const formatLabel = (item: LocationOption) => `${item.code} - ${item.name}`;

  return (
    <View style={styles.container}>
      {/* State Picker - Always show */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>State</Text>
        <View style={[styles.pickerContainer, (error || statesError) && styles.pickerError]}>
          {statesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : statesError ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>Failed to load states</Text>
            </View>
          ) : (
            <Picker
              selectedValue={stateId}
              onValueChange={handleStateChange}
              style={styles.picker}
              itemStyle={styles.pickerItemStyle}
              enabled={!disabled}
            >
              <Picker.Item label={statesLoading ? "Loading..." : (states.length === 0 ? "No states available" : "Select State")} value="" />
              {states.map((state) => (
                <Picker.Item
                  key={state.id}
                  label={formatLabel(state)}
                  value={state.id}
                />
              ))}
            </Picker>
          )}
        </View>
        {statesError && <Text style={styles.errorText}>{statesError.message}</Text>}
      </View>

      {/* LGA Picker */}
      {!!stateId && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>LGA (Local Government Area)</Text>
          <View style={styles.pickerContainer}>
            {lgasLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : (
              <Picker
                selectedValue={lgaId}
                onValueChange={handleLgaChange}
                style={styles.picker}
                itemStyle={styles.pickerItemStyle}
                enabled={!disabled}
              >
                <Picker.Item label="Select LGA" value="" />
                {lgas.map((lga) => (
                  <Picker.Item
                    key={lga.id}
                    label={formatLabel(lga)}
                    value={lga.id}
                  />
                ))}
              </Picker>
            )}
          </View>
        </View>
      )}

      {/* Ward Picker */}
      {!!lgaId && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ward</Text>
          <View style={styles.pickerContainer}>
            {wardsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : (
              <Picker
                selectedValue={wardId}
                onValueChange={handleWardChange}
                style={styles.picker}
                itemStyle={styles.pickerItemStyle}
                enabled={!disabled}
              >
                <Picker.Item label="Select Ward" value="" />
                {wards.map((ward) => (
                  <Picker.Item
                    key={ward.id}
                    label={formatLabel(ward)}
                    value={ward.id}
                  />
                ))}
              </Picker>
            )}
          </View>
        </View>
      )}

      {/* Polling Unit Picker */}
      {showPollingUnit && !!wardId && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Polling Unit</Text>
          <View style={styles.pickerContainer}>
            {pollingUnitsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : (
              <Picker
                selectedValue={pollingUnitId}
                onValueChange={handlePollingUnitChange}
                style={styles.picker}
                itemStyle={styles.pickerItemStyle}
                enabled={!disabled}
              >
                <Picker.Item label="Select Polling Unit" value="" />
                {pollingUnits.map((unit) => (
                  <Picker.Item
                    key={unit.id}
                    label={formatLabel(unit)}
                    value={unit.id}
                  />
                ))}
              </Picker>
            )}
          </View>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: Platform.OS === 'ios' ? 150 : 50,
  },
  pickerError: {
    borderColor: '#FF3B30',
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
    color: '#000',
  },
  pickerItemStyle: {
    fontSize: 16,
    color: '#000',
  },
  loadingContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
});
