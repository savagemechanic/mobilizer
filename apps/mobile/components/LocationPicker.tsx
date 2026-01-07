import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useQuery, useLazyQuery } from '@apollo/client';
import {
  GET_STATES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS,
  LOOKUP_LOCATION_BY_CODE,
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

type InputMode = 'pvc' | 'dropdown';

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

  // Input mode toggle - default to PVC code
  const [inputMode, setInputMode] = useState<InputMode>('pvc');

  // Code input state
  const [locationCode, setLocationCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isCodeLookupSuccess, setIsCodeLookupSuccess] = useState(false);

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

  // Location code lookup query
  const [lookupLocationByCode, { loading: codeLookupLoading }] = useLazyQuery(
    LOOKUP_LOCATION_BY_CODE,
    {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        const result = data?.lookupLocationByCode;
        if (result?.valid) {
          setCodeError(null);
          setIsCodeLookupSuccess(true);

          // Auto-populate the dropdowns
          if (result.state) {
            setStateId(result.state.id);
          }
          if (result.lga) {
            setLgaId(result.lga.id);
          }
          if (result.ward) {
            setWardId(result.ward.id);
          }
          if (result.pollingUnit) {
            setPollingUnitId(result.pollingUnit.id);
          }

          // Notify parent
          onChange({
            stateId: result.state?.id,
            lgaId: result.lga?.id,
            wardId: result.ward?.id,
            pollingUnitId: result.pollingUnit?.id,
          });
        } else {
          setCodeError(result?.error || 'Invalid location code');
          setIsCodeLookupSuccess(false);
        }
      },
      onError: (err) => {
        setCodeError(err.message || 'Failed to lookup location');
        setIsCodeLookupSuccess(false);
      },
    }
  );

  // Extract data arrays
  const states: LocationOption[] = statesData?.states || [];
  const lgas: LocationOption[] = lgasData?.lgas || [];
  const wards: LocationOption[] = wardsData?.wards || [];
  const pollingUnits: LocationOption[] = pollingUnitsData?.pollingUnits || [];

  // Initialize from value prop - only when value actually has data
  useEffect(() => {
    // Only initialize if value has actual location data
    const hasLocationData = value?.stateId || value?.lgaId || value?.wardId || value?.pollingUnitId;

    if (hasLocationData && !hasInitialized.current) {
      hasInitialized.current = true;

      if (value.stateId) setStateId(value.stateId);
      if (value.lgaId) setLgaId(value.lgaId);
      if (value.wardId) setWardId(value.wardId);
      if (value.pollingUnitId) setPollingUnitId(value.pollingUnitId);

      // Mark initial load as complete after a short delay
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 1000);
    } else if (!hasLocationData && !hasInitialized.current) {
      // No initial value, mark as ready for user input
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 500);
    }
  }, [value]);

  // Notify parent of changes (only after initial load)
  const notifyChange = useCallback((newValue: LocationValue) => {
    if (!isInitialLoad.current) {
      onChange(newValue);
    }
  }, [onChange]);

  // Format code with auto-hyphens (XX-XX-XX-XXX format: 2-2-2-3 digits)
  const formatLocationCode = (digits: string): string => {
    // Build formatted string with hyphens after 2nd, 4th, and 6th digits
    let formatted = '';
    for (let i = 0; i < digits.length && i < 9; i++) {
      formatted += digits[i];
      // Add hyphen immediately after 2nd, 4th, and 6th digit
      if (i === 1 || i === 3 || i === 5) {
        formatted += '-';
      }
    }

    return formatted;
  };

  // Handle code input change with auto-formatting
  const handleCodeChange = (text: string) => {
    // Get only digits from new and old values
    const newDigits = text.replace(/\D/g, '');
    const oldDigits = locationCode.replace(/\D/g, '');

    let finalDigits = newDigits;

    // Check if user tried to delete a hyphen (text is shorter but digits are same)
    // This happens when cursor is right after a hyphen and user presses delete
    if (text.length < locationCode.length && newDigits.length === oldDigits.length) {
      // User deleted a hyphen - also remove the digit before it
      // Find which hyphen was deleted by comparing positions
      // Hyphens are at positions 2, 5, 8 in formatted string (after indices 1, 3, 5 of digits)
      // If old was "12-34-" and new is "12-34", the trailing hyphen was deleted
      // We should remove the last digit to get "12-3"
      if (oldDigits.length > 0) {
        finalDigits = oldDigits.slice(0, -1);
      }
    }

    const formatted = formatLocationCode(finalDigits);
    setLocationCode(formatted);
    setCodeError(null);
    setIsCodeLookupSuccess(false);
  };

  // Handle code lookup
  const handleCodeLookup = () => {
    if (!locationCode.trim()) {
      setCodeError('Please enter a location code');
      Keyboard.dismiss();
      return;
    }
    // Run the lookup first, then dismiss keyboard
    lookupLocationByCode({ variables: { code: locationCode.trim() } });
    Keyboard.dismiss();
  };

  // Handle state change
  const handleStateChange = (newStateId: string) => {
    if (newStateId === stateId) return;

    setStateId(newStateId);
    setLgaId('');
    setWardId('');
    setPollingUnitId('');
    setIsCodeLookupSuccess(false);

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
    setIsCodeLookupSuccess(false);

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
    setIsCodeLookupSuccess(false);

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
      {/* Mode Toggle - Use PVC Code first (left), Select Manually second (right) */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'pvc' && styles.modeButtonActive]}
          onPress={() => setInputMode('pvc')}
          disabled={disabled}
        >
          <Text style={[styles.modeButtonText, inputMode === 'pvc' && styles.modeButtonTextActive]}>
            Use PVC Code
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'dropdown' && styles.modeButtonActive]}
          onPress={() => setInputMode('dropdown')}
          disabled={disabled}
        >
          <Text style={[styles.modeButtonText, inputMode === 'dropdown' && styles.modeButtonTextActive]}>
            Select Manually
          </Text>
        </TouchableOpacity>
      </View>

      {/* PVC Code Mode */}
      {inputMode === 'pvc' && (
        <View style={styles.codeSection}>
          {/* PVC Instruction Image - shows where to find the code */}
          <View style={styles.pvcImageContainer}>
            <Image
              source={require('@/assets/images/pvc-code-location.png')}
              style={styles.pvcImage}
              resizeMode="contain"
            />
            <Text style={styles.pvcImageCaption}>
              Enter your PVC location code (like the one circled above).{'\n'}If you don't have it, press Select Manually to select your location.
            </Text>
          </View>

          {/* Code input and lookup button - now below image */}
          <View style={styles.codeInputRow}>
            <TextInput
              style={[
                styles.codeInput,
                codeError && styles.codeInputError,
                isCodeLookupSuccess && styles.codeInputSuccess,
              ]}
              value={locationCode}
              onChangeText={handleCodeChange}
              placeholder="XX-XX-XX-XXX"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={12}
              editable={!disabled}
              onSubmitEditing={handleCodeLookup}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.lookupButton, codeLookupLoading && styles.lookupButtonDisabled]}
              onPress={handleCodeLookup}
              disabled={disabled || codeLookupLoading}
            >
              {codeLookupLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.lookupButtonText}>Enter</Text>
              )}
            </TouchableOpacity>
          </View>

          {codeError && <Text style={styles.errorText}>{codeError}</Text>}

          {/* Show populated dropdowns after successful lookup */}
          {isCodeLookupSuccess && (
            <View style={styles.foundLocationSection}>
              <Text style={styles.foundLocationTitleSuccess}>Location Found!</Text>

              {/* State Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>State</Text>
                <View style={[styles.pickerContainer, statesError && styles.pickerError]}>
                  {statesLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#007AFF" />
                    </View>
                  ) : (
                    <Picker
                      selectedValue={stateId}
                      onValueChange={handleStateChange}
                      style={styles.picker}
                      itemStyle={styles.pickerItemStyle}
                      enabled={!disabled}
                    >
                      <Picker.Item label="Select State" value="" />
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
              </View>

              {/* LGA Picker */}
              {!!stateId && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>LGA</Text>
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
            </View>
          )}
        </View>
      )}

      {/* Dropdown Mode */}
      {inputMode === 'dropdown' && (
        <View style={styles.dropdownSection}>
          {/* State Picker */}
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
                    {lgaId && <Text style={styles.loadingText}>Loading...</Text>}
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
                    {wardId && <Text style={styles.loadingText}>Loading...</Text>}
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
                    {pollingUnitId && <Text style={styles.loadingText}>Loading...</Text>}
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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#FFF',
  },
  codeSection: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
  },
  codeInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: '#000',
  },
  codeInputError: {
    borderColor: '#FF3B30',
  },
  codeInputSuccess: {
    borderColor: '#34C759',
    backgroundColor: '#F0FFF4',
  },
  lookupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  lookupButtonDisabled: {
    backgroundColor: '#A0C4FF',
  },
  lookupButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  successText: {
    color: '#34C759',
    fontSize: 13,
    marginTop: 8,
  },
  pvcImageContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  pvcImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  pvcImageCaption: {
    fontSize: 13,
    color: '#4A5568',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  foundLocationSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  foundLocationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  foundLocationTitleSuccess: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 12,
  },
  dropdownSection: {
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
});
