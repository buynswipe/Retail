import { SafeAreaView, StatusBar, StyleSheet, useColorScheme } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { AuthProvider } from "./src/contexts/AuthContext"
import { CartProvider } from "./src/contexts/CartContext"
import { NotificationProvider } from "./src/contexts/NotificationContext"
import { TranslationProvider } from "./src/contexts/TranslationContext"
import SplashScreen from "./src/screens/SplashScreen"
import LoginScreen from "./src/screens/LoginScreen"
import SignupScreen from "./src/screens/SignupScreen"
import RetailerNavigator from "./src/navigators/RetailerNavigator"
import WholesalerNavigator from "./src/navigators/WholesalerNavigator"
import DeliveryNavigator from "./src/navigators/DeliveryNavigator"
import OnboardingScreen from "./src/screens/OnboardingScreen"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"

const Stack = createNativeStackNavigator()

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === "dark"

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AuthProvider>
          <TranslationProvider>
            <CartProvider>
              <NotificationProvider>
                <BottomSheetModalProvider>
                  <SafeAreaView style={styles.container}>
                    <StatusBar
                      barStyle={isDarkMode ? "light-content" : "dark-content"}
                      backgroundColor={styles.container.backgroundColor}
                    />
                    <Stack.Navigator
                      initialRouteName="Splash"
                      screenOptions={{
                        headerShown: false,
                      }}
                    >
                      <Stack.Screen name="Splash" component={SplashScreen} />
                      <Stack.Screen name="Login" component={LoginScreen} />
                      <Stack.Screen name="Signup" component={SignupScreen} />
                      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                      <Stack.Screen name="RetailerHome" component={RetailerNavigator} />
                      <Stack.Screen name="WholesalerHome" component={WholesalerNavigator} />
                      <Stack.Screen name="DeliveryHome" component={DeliveryNavigator} />
                    </Stack.Navigator>
                  </SafeAreaView>
                </BottomSheetModalProvider>
              </NotificationProvider>
            </CartProvider>
          </TranslationProvider>
        </AuthProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
})

export default App
