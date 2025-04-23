import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useTranslation } from "../contexts/TranslationContext"
import { Home, ShoppingBag, Package, CreditCard, User } from "lucide-react-native"

// Screens
import WholesalerDashboardScreen from "../screens/wholesaler/WholesalerDashboardScreen"
import WholesalerOrdersScreen from "../screens/wholesaler/WholesalerOrdersScreen"
import WholesalerOrderDetailScreen from "../screens/wholesaler/WholesalerOrderDetailScreen"
import WholesalerProductsScreen from "../screens/wholesaler/WholesalerProductsScreen"
import WholesalerProductDetailScreen from "../screens/wholesaler/WholesalerProductDetailScreen"
import WholesalerAddProductScreen from "../screens/wholesaler/WholesalerAddProductScreen"
import WholesalerPaymentsScreen from "../screens/wholesaler/WholesalerPaymentsScreen"
import WholesalerProfileScreen from "../screens/wholesaler/WholesalerProfileScreen"
import WholesalerNotificationsScreen from "../screens/wholesaler/WholesalerNotificationsScreen"
import WholesalerTaxScreen from "../screens/wholesaler/WholesalerTaxScreen"

const Tab = createBottomTabNavigator()
const HomeStack = createNativeStackNavigator()
const OrdersStack = createNativeStackNavigator()
const ProductsStack = createNativeStackNavigator()
const PaymentsStack = createNativeStackNavigator()
const ProfileStack = createNativeStackNavigator()

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={WholesalerDashboardScreen} />
      <HomeStack.Screen name="Notifications" component={WholesalerNotificationsScreen} />
    </HomeStack.Navigator>
  )
}

const OrdersStackNavigator = () => {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersList" component={WholesalerOrdersScreen} />
      <OrdersStack.Screen name="OrderDetail" component={WholesalerOrderDetailScreen} />
    </OrdersStack.Navigator>
  )
}

const ProductsStackNavigator = () => {
  return (
    <ProductsStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductsStack.Screen name="ProductsList" component={WholesalerProductsScreen} />
      <ProductsStack.Screen name="ProductDetail" component={WholesalerProductDetailScreen} />
      <ProductsStack.Screen name="AddProduct" component={WholesalerAddProductScreen} />
    </ProductsStack.Navigator>
  )
}

const PaymentsStackNavigator = () => {
  return (
    <PaymentsStack.Navigator screenOptions={{ headerShown: false }}>
      <PaymentsStack.Screen name="PaymentsList" component={WholesalerPaymentsScreen} />
    </PaymentsStack.Navigator>
  )
}

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={WholesalerProfileScreen} />
      <ProfileStack.Screen name="Tax" component={WholesalerTaxScreen} />
    </ProfileStack.Navigator>
  )
}

const WholesalerNavigator = () => {
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
        name="Products"
        component={ProductsStackNavigator}
        options={{
          tabBarLabel: t("nav.products"),
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
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

export default WholesalerNavigator
