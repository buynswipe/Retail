"use client"

import type React from "react"
import { useState } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../contexts/AuthContext"
import { useTranslation } from "../contexts/TranslationContext"
import { Text, TextInput, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"

const LoginScreen: React.FC = () => {
  const navigation = useNavigation()
  const { login, verifyOtp } = useAuth()
  const { t, language, setLanguage } = useTranslation()

  const [step, setStep] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await login(phoneNumber)

      if (result.success) {
        setStep(2)
      } else {
        setError(result.error || "Failed to send OTP. Please try again.")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Error sending OTP:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await verifyOtp(phoneNumber, otp)

      if (result.success) {
        // Navigation will be handled by the auth state change in SplashScreen
      } else {
        setError(result.error || "Failed to verify OTP. Please try again.")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Error verifying OTP:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en")
  }

  const showDemoAccounts = () => {
    Alert.alert(
      "Demo Accounts",
      "Admin: 1234567890\nRetailer: 9876543210\nWholesaler: 9876543211\nDelivery: 9876543212\n\nUse any 6 digits as OTP",
      [{ text: "OK" }],
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>RetailBandhu</Text>
          </View>

          <View style={styles.languageToggle}>
            <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
              <Text style={styles.languageText}>{language === "en" ? "हिंदी" : "English"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("login.title")}</Text>
            <Text style={styles.cardSubtitle}>{step === 1 ? t("enter.phone") : t("enter.otp")}</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {step === 1 ? (
              <>
                <TextInput
                  label={t("phone")}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  mode="outlined"
                  style={styles.input}
                  maxLength={10}
                />
                <Button
                  mode="contained"
                  onPress={handleSendOtp}
                  loading={isLoading}
                  disabled={isLoading || phoneNumber.length !== 10}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  {t("send.otp")}
                </Button>

                <TouchableOpacity onPress={showDemoAccounts} style={styles.demoLink}>
                  <Text style={styles.demoText}>{t("demo.accounts")}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  label={t("otp")}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  maxLength={6}
                />
                <Button
                  mode="contained"
                  onPress={handleVerifyOtp}
                  loading={isLoading}
                  disabled={isLoading || otp.length !== 6}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  {t("verify")}
                </Button>

                <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
                  <Text style={styles.backText}>← Back to phone number</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup" as never)}>
                <Text style={styles.signupLink}>{t("signup.title")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#1E40AF",
  },
  languageToggle: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  languageButton: {
    padding: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  languageText: {
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  button: {
    marginBottom: 20,
    backgroundColor: "#1E40AF",
  },
  buttonContent: {
    paddingVertical: 8,
  },
  errorText: {
    color: "#EF4444",
    marginBottom: 15,
    textAlign: "center",
  },
  demoLink: {
    alignSelf: "center",
    marginBottom: 20,
  },
  demoText: {
    color: "#1E40AF",
    textDecorationLine: "underline",
  },
  backLink: {
    alignSelf: "center",
    marginBottom: 20,
  },
  backText: {
    color: "#6B7280",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  signupText: {
    color: "#6B7280",
    marginRight: 5,
  },
  signupLink: {
    color: "#1E40AF",
    fontWeight: "bold",
  },
})

export default LoginScreen
