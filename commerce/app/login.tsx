import React, { useState } from 'react';
import { View, SafeAreaView, ImageBackground, TouchableOpacity, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants';
import { useGoogleLogin } from '@/utils/googleAuth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleLogin = async () => {
    try {
        console.log(email, password);
      const res = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
  
      const token = res.data.access_token;
      const role = res.data.role;
  
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('role', role);
      
      if (role === 'ADMIN') {
        router.replace('/(admin)'); 
        
      }
      else{router.replace('/(tabs)/home');}
      setMsg('Connexion réussie');
    } catch (err) {
      const error = err as AxiosError<any>;
      setMsg(error.response?.data?.msg || 'Erreur');
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
          <View style={styles.formContainer}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>Accédez à votre compte</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#B0B0B0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            {msg ? <Text style={styles.messageText}>{msg}</Text> : null}
            
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </TouchableOpacity>
            
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Pas encore membre ?</Text>
              <View style={styles.dividerLine} />
            </View>
            

            
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={() => router.push('/register')}
            >
              <Text style={styles.registerButtonText}> S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

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
    color: '#4CAF50',
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
    marginBottom: 40,
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
  messageText: {
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
  loginButton: {
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
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '80%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: '#E0E0E0',
    fontSize: 14,
    marginHorizontal: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    marginBottom: 20,
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  socialButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'normal',
  },
});