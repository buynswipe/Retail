"use client"

import type React from "react"
import { useEffect } from "react"
import { View, Image, StyleSheet, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../contexts/AuthContext"
import { Text } from "react-native"

const { width } = Dimensions.get("window")

const SplashScreen: React.FC = () => {
  const navigation = useNavigation()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (user) {
          // Navigate based on user role
          switch (user.role) {
            case "retailer":
              navigation.reset({
                index: 0,
                routes: [{ name: "RetailerHome" as never }],
              })
              break
            case "wholesaler":
              navigation.reset({
                index: 0,
                routes: [{ name: "WholesalerHome" as never }],
              })
              break
            case "delivery":
              navigation.reset({
                index: 0,
                routes: [{ name: "DeliveryHome" as never }],
              })
              break
            case "admin":
              // For demo, we'll redirect admin to retailer home
              navigation.reset({
                index: 0,
                routes: [{ name: "RetailerHome" as never }],
              })
              break
            default:
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" as never }],
              })
          }
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" as never }],
          })
        }
      }
    }, 2000) // 2 seconds splash screen

    return () => clearTimeout(timer)
  }, [navigation, user, isLoading])

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>RetailBandhu</Text>
      <Text style={styles.subtitle}>Connecting Retail Supply Chain</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1E40AF", // Blue color
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280", // Gray color
  },
})

export default SplashScreen
