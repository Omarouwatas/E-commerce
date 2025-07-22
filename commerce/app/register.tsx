import React, { useState } from 'react';
import { StyleSheet, View, ImageBackground, TouchableOpacity, Text, TextInput, SafeAreaView, ScrollView } from 'react-native';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/constants';
const RegisterScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    nom: '',
  });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: '',
      nom: '',
    };

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
      valid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await axios.post('${BASE_URL}/api/auth/register', {
        nom: formData.nom,
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 201) {
        router.replace('/login');
      }
    } catch (err) {
      const error = err as AxiosError<any>;
      setSubmitError(
        error.response?.data?.msg || 
        error.message || 
        'Erreur lors de l\'inscription'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/images/logo.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>Rejoignez notre plateforme</Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.nom ? styles.inputError : null]}
                  placeholder="Nom"
                  placeholderTextColor="#B0B0B0"
                  value={formData.nom}
                  onChangeText={(text) => handleChange('nom', text)}
                  autoCapitalize="words"
                />
                {errors.nom ? <Text style={styles.errorText}>{errors.nom}</Text> : null}
                
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="Email"
                  placeholderTextColor="#B0B0B0"
                  value={formData.email}
                  onChangeText={(text) => handleChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                
                <TextInput
                  style={[styles.input, errors.password ? styles.inputError : null]}
                  placeholder="Mot de passe"
                  placeholderTextColor="#B0B0B0"
                  value={formData.password}
                  onChangeText={(text) => handleChange('password', text)}
                  secureTextEntry
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>
              
              {submitError ? (
                <Text style={styles.submitErrorText}>{submitError}</Text>
              ) : null}
              
              <TouchableOpacity 
                style={[styles.registerButton, isSubmitting && styles.buttonDisabled]} 
                onPress={handleRegister}
                disabled={isSubmitting}
              >
                <Text style={styles.registerButtonText}>
                  {isSubmitting ? 'Inscription...' : 'S\'inscrire'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={() => router.replace('/login')}
              >
                <Text style={styles.loginButtonText}>Déjà un compte ? Se connecter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '300',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  submitErrorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;