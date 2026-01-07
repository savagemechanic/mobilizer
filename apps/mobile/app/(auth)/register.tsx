import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { useMutation } from '@apollo/client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { REGISTER } from '@/lib/graphql/mutations/auth';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import LocationPicker, { LocationValue } from '@/components/LocationPicker';
import { PROFESSIONS } from '@/types';
import { Picker } from '@react-native-picker/picker';

// Gender options matching backend enum
const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  gender: z.string().min(1, 'Gender is required'),
  profession: z.string().min(1, 'Profession is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { showToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationValue>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [registerMutation] = useMutation(REGISTER);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      username: '',
      gender: '',
      profession: '',
      phoneNumber: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate location is complete
      if (!location.stateId) {
        setError('Please select a State');
        setIsLoading(false);
        return;
      }
      if (!location.lgaId) {
        setError('Please select an LGA');
        setIsLoading(false);
        return;
      }
      if (!location.wardId) {
        setError('Please select a Ward');
        setIsLoading(false);
        return;
      }
      if (!location.pollingUnitId) {
        setError('Please select a Polling Unit');
        setIsLoading(false);
        return;
      }

      // Merge location data with form data
      const input: any = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username.toLowerCase(),
        phoneNumber: data.phoneNumber,
        gender: data.gender,
      };

      // Add optional fields
      if (data.profession) input.profession = data.profession;

      // Add location fields (all required)
      input.stateId = location.stateId;
      input.lgaId = location.lgaId;
      input.wardId = location.wardId;
      input.pollingUnitId = location.pollingUnitId;

      const { data: result } = await registerMutation({
        variables: {
          input,
        },
      });

      if (result?.register) {
        const { accessToken, refreshToken, user } = result.register;
        await login(accessToken, refreshToken, user);

        // Navigate to the app
        router.replace('/(tabs)');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err.graphQLErrors?.[0]?.message
        || err.message
        || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Mobilizer Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/mobilizer-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name <Text style={styles.requiredAsterisk}>*</Text></Text>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.firstName && styles.inputError]}
                    placeholder="Enter your first name"
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name <Text style={styles.requiredAsterisk}>*</Text></Text>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.lastName && styles.inputError]}
                    placeholder="Enter your last name"
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username <Text style={styles.requiredAsterisk}>*</Text></Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.usernameContainer}>
                    <Text style={styles.usernamePrefix}>@</Text>
                    <TextInput
                      style={[styles.input, styles.usernameInput, errors.username && styles.inputError]}
                      placeholder="username"
                      placeholderTextColor="#999"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onBlur={onBlur}
                      onChangeText={(text) => onChange(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      value={value}
                      editable={!isLoading}
                    />
                  </View>
                )}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username.message}</Text>
              )}
              <Text style={styles.helperText}>3-30 characters, lowercase letters, numbers, and underscores only</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender <Text style={styles.requiredAsterisk}>*</Text></Text>
              <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.pickerContainer, errors.gender && styles.pickerError]}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      enabled={!isLoading}
                      style={styles.picker}
                      dropdownIconColor="#000"
                    >
                      <Picker.Item label="Select your gender" value="" color="#666" style={styles.pickerItem} />
                      {GENDERS.map((gender) => (
                        <Picker.Item key={gender.value} label={gender.label} value={gender.value} color="#000" style={styles.pickerItem} />
                      ))}
                    </Picker>
                  </View>
                )}
              />
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Profession <Text style={styles.requiredAsterisk}>*</Text></Text>
              <Controller
                control={control}
                name="profession"
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.pickerContainer, errors.profession && styles.pickerError]}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      enabled={!isLoading}
                      style={styles.picker}
                      dropdownIconColor="#000"
                    >
                      <Picker.Item label="Select your profession" value="" color="#666" style={styles.pickerItem} />
                      {PROFESSIONS.map((profession) => (
                        <Picker.Item key={profession} label={profession} value={profession} color="#000" style={styles.pickerItem} />
                      ))}
                    </Picker>
                  </View>
                )}
              />
              {errors.profession && (
                <Text style={styles.errorText}>{errors.profession.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email <Text style={styles.requiredAsterisk}>*</Text></Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone <Text style={styles.requiredAsterisk}>*</Text></Text>
              <Controller
                control={control}
                name="phoneNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.phoneNumber && styles.inputError]}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
              )}
            </View>

            {/* Location Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location <Text style={styles.requiredAsterisk}>*</Text></Text>
              <LocationPicker
                value={location}
                onChange={setLocation}
                disabled={isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password <Text style={styles.requiredAsterisk}>*</Text></Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="Enter your password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      autoComplete="password-new"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password <Text style={styles.requiredAsterisk}>*</Text></Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]}
                      placeholder="Confirm your password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="password-new"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity disabled={isLoading}>
                  <Text style={styles.link}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F9F9F9',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  requiredAsterisk: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernamePrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginRight: 4,
    marginLeft: 12,
  },
  usernameInput: {
    flex: 1,
    paddingLeft: 8,
  },
  helperText: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    overflow: 'hidden',
  },
  pickerError: {
    borderColor: '#FF3B30',
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
    width: '100%',
    color: '#000',
  },
  pickerItem: {
    fontSize: 16,
    color: '#000',
  },
});
