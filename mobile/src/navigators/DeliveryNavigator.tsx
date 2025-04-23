import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useTranslation } from "../contexts/TranslationContext"
import { Home, Truck, MapPin, CreditCard, User } from "lucide-react-native"

// Screens
import DeliveryDashboardScreen from "../screens/delivery/DeliveryDashboardScreen"
import DeliveryAssignmentsScreen from "../screens/delivery/DeliveryAssignmentsScreen"
import DeliveryActiveScreen from "../screens/delivery/DeliveryActiveScreen"
import DeliveryDetailScreen from "../screens/delivery/DeliveryDetailScreen"
import DeliveryHistoryScreen from "../screens/delivery/DeliveryHistoryScreen"
import DeliveryEarningsScreen from "../screens/delivery/DeliveryEarningsScreen"
import DeliveryProfileScreen from "../screens/delivery/DeliveryProfileScreen"
import DeliveryNotificationsScreen from "../screens/delivery/DeliveryNotificationsScreen"
import DeliveryMapScreen from "../screens/delivery/DeliveryMapScreen"

const Tab = createBottomTabNavigator()
const HomeStack = createNativeStackNavigator()
const AssignmentsStack = createNativeStackNavigator()
const ActiveStack = createNativeStackNavigator()
const EarningsStack = createNativeStackNavigator()
const ProfileStack = createNativeStackNavigator()

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DeliveryDashboardScreen} />
      <HomeStack.Screen name="Notifications" component={DeliveryNotificationsScreen} />
    </HomeStack.Navigator>
  )
}

const AssignmentsStackNavigator = () => {
  return (
    <AssignmentsStack.Navigator screenOptions={{ headerShown: false }}>
      <AssignmentsStack.Screen name="AssignmentsList" component={DeliveryAssignmentsScreen} />
      <AssignmentsStack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
      <AssignmentsStack.Screen name="Map" component={DeliveryMapScreen} />
    </AssignmentsStack.Navigator>
  )
}

const ActiveStackNavigator = () => {
  return (
    <ActiveStack.Navigator screenOptions={{ headerShown: false }}>
      <ActiveStack.Screen name="ActiveDeliveries" component={DeliveryActiveScreen} />
      <ActiveStack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
      <ActiveStack.Screen name="Map" component={DeliveryMapScreen} />
    </ActiveStack.Navigator>
  )
}

const EarningsStackNavigator = () => {
  return (
    <EarningsStack.Navigator screenOptions={{ headerShown: false }}>
      <EarningsStack.Screen name="EarningsList" component={DeliveryEarningsScreen} />
      <EarningsStack.Screen name="History" component={DeliveryHistoryScreen} />
    </EarningsStack.Navigator>
  )
}

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={DeliveryProfileScreen} />
    </ProfileStack.Navigator>
  )
}

const DeliveryNavigator = () => {
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1E40AF",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: t("nav.home"),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Assignments"
        component={AssignmentsStackNavigator}
        options={{
          tabBarLabel: "Find Jobs",
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Active"
        component={ActiveStackNavigator}
        options={{
          tabBarLabel: "Active",
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsStackNavigator}
        options={{
          tabBarLabel: "Earnings",
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: t("nav.profile"),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}

export default DeliveryNavigator
