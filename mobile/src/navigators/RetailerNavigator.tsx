import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useTranslation } from "../contexts/TranslationContext"
import { Home, ShoppingBag, Search, CreditCard, User } from "lucide-react-native"

// Screens
import RetailerDashboardScreen from "../screens/retailer/RetailerDashboardScreen"
import RetailerOrdersScreen from "../screens/retailer/RetailerOrdersScreen"
import RetailerOrderDetailScreen from "../screens/retailer/RetailerOrderDetailScreen"
import RetailerBrowseScreen from "../screens/retailer/RetailerBrowseScreen"
import RetailerProductDetailScreen from "../screens/retailer/RetailerProductDetailScreen"
import RetailerCartScreen from "../screens/retailer/RetailerCartScreen"
import RetailerCheckoutScreen from "../screens/retailer/RetailerCheckoutScreen"
import RetailerPaymentsScreen from "../screens/retailer/RetailerPaymentsScreen"
import RetailerProfileScreen from "../screens/retailer/RetailerProfileScreen"
import RetailerNotificationsScreen from "../screens/retailer/RetailerNotificationsScreen"
import RetailerTaxScreen from "../screens/retailer/RetailerTaxScreen"

const Tab = createBottomTabNavigator()
const HomeStack = createNativeStackNavigator()
const OrdersStack = createNativeStackNavigator()
const BrowseStack = createNativeStackNavigator()
const PaymentsStack = createNativeStackNavigator()
const ProfileStack = createNativeStackNavigator()

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={RetailerDashboardScreen} />
      <HomeStack.Screen name="Notifications" component={RetailerNotificationsScreen} />
    </HomeStack.Navigator>
  )
}

const OrdersStackNavigator = () => {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersList" component={RetailerOrdersScreen} />
      <OrdersStack.Screen name="OrderDetail" component={RetailerOrderDetailScreen} />
    </OrdersStack.Navigator>
  )
}

const BrowseStackNavigator = () => {
  return (
    <BrowseStack.Navigator screenOptions={{ headerShown: false }}>
      <BrowseStack.Screen name="BrowseProducts" component={RetailerBrowseScreen} />
      <BrowseStack.Screen name="ProductDetail" component={RetailerProductDetailScreen} />
      <BrowseStack.Screen name="Cart" component={RetailerCartScreen} />
      <BrowseStack.Screen name="Checkout" component={RetailerCheckoutScreen} />
    </BrowseStack.Navigator>
  )
}

const PaymentsStackNavigator = () => {
  return (
    <PaymentsStack.Navigator screenOptions={{ headerShown: false }}>
      <PaymentsStack.Screen name="PaymentsList" component={RetailerPaymentsScreen} />
    </PaymentsStack.Navigator>
  )
}

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={RetailerProfileScreen} />
      <ProfileStack.Screen name="Tax" component={RetailerTaxScreen} />
    </ProfileStack.Navigator>
  )
}

const RetailerNavigator = () => {
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
        name="Orders"
        component={OrdersStackNavigator}
        options={{
          tabBarLabel: t("nav.orders"),
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseStackNavigator}
        options={{
          tabBarLabel: t("nav.products"),
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsStackNavigator}
        options={{
          tabBarLabel: t("nav.payments"),
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

export default RetailerNavigator
