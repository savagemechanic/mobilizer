import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useQuery } from '@apollo/client';
import { useLocationsStore } from '@/store/locations';
import {
  GET_COUNTRIES,
  GET_STATES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS,
} from '@/lib/graphql/queries/locations';

interface LocationPickerProps {
  level?: 'NATIONAL' | 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT';
  onCountryChange?: (countryId: string | null) => void;
  onStateChange?: (stateId: string | null) => void;
  onLgaChange?: (lgaId: string | null) => void;
  onWardChange?: (wardId: string | null) => void;
  onPollingUnitChange?: (pollingUnitId: string | null) => void;
}

export function LocationPicker({
  level = 'POLLING_UNIT',
  onCountryChange,
  onStateChange,
  onLgaChange,
  onWardChange,
  onPollingUnitChange,
}: LocationPickerProps) {
  const {
    countries,
    states,
    lgas,
    wards,
    pollingUnits,
    selectedCountryId,
    selectedStateId,
    selectedLgaId,
    selectedWardId,
    selectedPollingUnitId,
    setCountries,
    setStates,
    setLGAs,
    setWards,
    setPollingUnits,
    setSelectedCountryId,
    setSelectedStateId,
    setSelectedLgaId,
    setSelectedWardId,
    setSelectedPollingUnitId,
    resetFromCountry,
    resetFromState,
    resetFromLGA,
    resetFromWard,
  } = useLocationsStore();

  // Fetch countries
  const { loading: countriesLoading } = useQuery(GET_COUNTRIES, {
    onCompleted: (data) => {
      if (data?.countries) {
        setCountries(data.countries);
      }
    },
  });

  // Fetch states when country is selected
  const { loading: statesLoading } = useQuery(GET_STATES, {
    variables: { countryId: selectedCountryId },
    skip: !selectedCountryId || level === 'NATIONAL',
    onCompleted: (data) => {
      if (data?.states) {
        setStates(data.states);
      }
    },
  });

  // Fetch LGAs when state is selected
  const { loading: lgasLoading } = useQuery(GET_LGAS, {
    variables: { stateId: selectedStateId },
    skip: !selectedStateId || level === 'NATIONAL' || level === 'STATE',
    onCompleted: (data) => {
      if (data?.lgas) {
        setLGAs(data.lgas);
      }
    },
  });

  // Fetch wards when LGA is selected
  const { loading: wardsLoading } = useQuery(GET_WARDS, {
    variables: { lgaId: selectedLgaId },
    skip: !selectedLgaId || level === 'NATIONAL' || level === 'STATE' || level === 'LGA',
    onCompleted: (data) => {
      if (data?.wards) {
        setWards(data.wards);
      }
    },
  });

  // Fetch polling units when ward is selected
  const { loading: pollingUnitsLoading } = useQuery(GET_POLLING_UNITS, {
    variables: { wardId: selectedWardId },
    skip: !selectedWardId || level !== 'POLLING_UNIT',
    onCompleted: (data) => {
      if (data?.pollingUnits) {
        setPollingUnits(data.pollingUnits);
      }
    },
  });

  // Handle country change
  const handleCountryChange = (countryId: string) => {
    if (countryId === selectedCountryId) return;

    setSelectedCountryId(countryId || null);
    resetFromCountry();
    onCountryChange?.(countryId || null);
  };

  // Handle state change
  const handleStateChange = (stateId: string) => {
    if (stateId === selectedStateId) return;

    setSelectedStateId(stateId || null);
    resetFromState();
    onStateChange?.(stateId || null);
  };

  // Handle LGA change
  const handleLgaChange = (lgaId: string) => {
    if (lgaId === selectedLgaId) return;

    setSelectedLgaId(lgaId || null);
    resetFromLGA();
    onLgaChange?.(lgaId || null);
  };

  // Handle ward change
  const handleWardChange = (wardId: string) => {
    if (wardId === selectedWardId) return;

    setSelectedWardId(wardId || null);
    resetFromWard();
    onWardChange?.(wardId || null);
  };

  // Handle polling unit change
  const handlePollingUnitChange = (pollingUnitId: string) => {
    if (pollingUnitId === selectedPollingUnitId) return;

    setSelectedPollingUnitId(pollingUnitId || null);
    onPollingUnitChange?.(pollingUnitId || null);
  };

  return (
    <View style={styles.container}>
      {/* Country Picker */}
      {level !== 'NATIONAL' && (
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Country</Text>
          {countriesLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Picker
              selectedValue={selectedCountryId || ''}
              onValueChange={handleCountryChange}
              style={styles.picker}
            >
              <Picker.Item label="Select Country" value="" />
              {countries.map((country) => (
                <Picker.Item
                  key={country.id}
                  label={country.name}
                  value={country.id}
                />
              ))}
            </Picker>
          )}
        </View>
      )}

      {/* State Picker */}
      {level !== 'NATIONAL' && selectedCountryId && (
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>State</Text>
          {statesLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Picker
              selectedValue={selectedStateId || ''}
              onValueChange={handleStateChange}
              style={styles.picker}
              enabled={states.length > 0}
            >
              <Picker.Item label="Select State" value="" />
              {states.map((state) => (
                <Picker.Item key={state.id} label={state.name} value={state.id} />
              ))}
            </Picker>
          )}
        </View>
      )}

      {/* LGA Picker */}
      {(level === 'LGA' || level === 'WARD' || level === 'POLLING_UNIT') &&
        selectedStateId && (
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>LGA</Text>
            {lgasLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Picker
                selectedValue={selectedLgaId || ''}
                onValueChange={handleLgaChange}
                style={styles.picker}
                enabled={lgas.length > 0}
              >
                <Picker.Item label="Select LGA" value="" />
                {lgas.map((lga) => (
                  <Picker.Item key={lga.id} label={lga.name} value={lga.id} />
                ))}
              </Picker>
            )}
          </View>
        )}

      {/* Ward Picker */}
      {(level === 'WARD' || level === 'POLLING_UNIT') && selectedLgaId && (
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Ward</Text>
          {wardsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Picker
              selectedValue={selectedWardId || ''}
              onValueChange={handleWardChange}
              style={styles.picker}
              enabled={wards.length > 0}
            >
              <Picker.Item label="Select Ward" value="" />
              {wards.map((ward) => (
                <Picker.Item key={ward.id} label={ward.name} value={ward.id} />
              ))}
            </Picker>
          )}
        </View>
      )}

      {/* Polling Unit Picker */}
      {level === 'POLLING_UNIT' && selectedWardId && (
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Polling Unit</Text>
          {pollingUnitsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Picker
              selectedValue={selectedPollingUnitId || ''}
              onValueChange={handlePollingUnitChange}
              style={styles.picker}
              enabled={pollingUnits.length > 0}
            >
              <Picker.Item label="Select Polling Unit" value="" />
              {pollingUnits.map((unit) => (
                <Picker.Item key={unit.id} label={unit.name} value={unit.id} />
              ))}
            </Picker>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  pickerContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  picker: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
});
