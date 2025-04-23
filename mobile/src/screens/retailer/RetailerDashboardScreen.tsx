"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../contexts/AuthContext"
import { useTranslation } from "../../contexts/TranslationContext"
import { useNotifications } from "../../contexts/NotificationContext"
import { Text, Card, Button, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Bell, ShoppingBag, Search, CreditCard, FileText, MapPin, ChevronRight, Clock } from "lucide-react-native"

const RetailerDashboardScreen: React.FC = () => {
  const navigation = useNavigation()
  const { user } = useAuth()
  const { t } = useTranslation()
  const { unreadCount } = useNotifications()

  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [nearbyWholesalers, setNearbyWholesalers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would fetch data from the API
      // For demo, we'll use mock data

      // Mock recent orders
      const mockOrders = [
        {
          id: "1",
          orderNumber: "ORD-001",
          status: "delivered",
          date: "2023-06-15",
          totalAmount: 2500,
          items: 5,
        },
        {
          id: "2",
          orderNumber: "ORD-002",
          status: "dispatched",
          date: "2023-06-10",
          totalAmount: 1800,
          items: 3,
        },
        {
          id: "3",
          orderNumber: "ORD-003",
          status: "confirmed",
          date: "2023-06-05",
          totalAmount: 3200,
          items: 7,
        },
      ]

      // Mock nearby wholesalers
      const mockWholesalers = [
        {
          id: "1",
          name: "Vikram Singh",
          businessName: "Vikram Wholesale",
          distance: 2.3,
          pinCode: "400001",
          rating: 4.8,
        },
        {
          id: "2",
          name: "Sunil Kapoor",
          businessName: "Kapoor Distributors",
          distance: 3.7,
          pinCode: "400001",
          rating: 4.5,
        },
        {
          id: "3",
          name: "Amit Patel",
          businessName: "Patel Supplies",
          distance: 5.1,
          pinCode: "400002",
          rating: 4.2,
        },
      ]

      setRecentOrders(mockOrders)
      setNearbyWholesalers(mockWholesalers)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed":
        return "#3B82F6" // Blue
      case "confirmed":
        return "#10B981" // Green
      case "rejected":
        return "#EF4444" // Red
      case "dispatched":
        return "#F59E0B" // Orange
      case "delivered":
        return "#8B5CF6" // Purple
      default:
        return "#6B7280" // Gray
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>{t("loading")}</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t("dashboard.welcome")}</Text>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate("Notifications" as never)}
        >
          <Bell color="#1E40AF" size={24} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Browse" as never)}>
            <View style={[styles.actionIcon, { backgroundColor: "#EBF5FF" }]}>
              <Search color="#1E40AF" size={24} />
            </View>
            <Text style={styles.actionText}>Browse</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Orders" as never)}>
            <View style={[styles.actionIcon, { backgroundColor: "#E0F2FE" }]}>
              <ShoppingBag color="#0284C7" size={24} />
            </View>
            <Text style={styles.actionText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Payments" as never)}>
            <View style={[styles.actionIcon, { backgroundColor: "#ECFDF5" }]}>
              <CreditCard color="#059669" size={24} />
            </View>
            <Text style={styles.actionText}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Profile", { screen: "Tax" } as never)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FEF3C7" }]}>
              <FileText color="#D97706" size={24} />
            </View>
            <Text style={styles.actionText}>Tax</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("dashboard.recent.orders")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Orders" as never)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() =>
                  navigation.navigate("Orders", { screen: "OrderDetail", params: { id: order.id } } as never)
                }
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.statusText}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight color="#6B7280" size={20} />
                </View>
                <View style={styles.orderDetails}>
                  <View style={styles.orderDetail}>
                    <Clock color="#6B7280" size={16} />
                    <Text style={styles.orderDetailText}>{formatDate(order.date)}</Text>
                  </View>
                  <Text style={styles.orderAmount}>₹{order.totalAmount.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyCardContent}>
                <Text style={styles.emptyText}>No recent orders</Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("Browse" as never)}
                  style={styles.browseButton}
                >
                  Browse Products
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Find Wholesalers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("dashboard.find.wholesalers")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Browse" as never)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.searchCard}>
            <Card.Content>
              <Text style={styles.searchCardTitle}>Find wholesalers near you</Text>
              <View style={styles.searchInputContainer}>
                <MapPin color="#6B7280" size={20} style={styles.searchIcon} />
                <Text style={styles.pinCodeText}>{user?.pinCode || "Enter PIN code"}</Text>
              </View>
              <Button
                mode="contained"
                onPress={() => navigation.navigate("Browse" as never)}
                style={styles.searchButton}
              >
                Search Nearby
              </Button>
            </Card.Content>
          </Card>

          {nearbyWholesalers.map((wholesaler) => (
            <TouchableOpacity
              key={wholesaler.id}
              style={styles.wholesalerCard}
              onPress={() => navigation.navigate("Browse", { wholesalerId: wholesaler.id } as never)}
            >
              <View style={styles.wholesalerInfo}>
                <Image
                  source={{
                    uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(wholesaler.businessName)}&background=random`,
                  }}
                  style={styles.wholesalerImage}
                />
                <View style={styles.wholesalerDetails}>
                  <Text style={styles.wholesalerName}>{wholesaler.businessName}</Text>
                  <Text style={styles.wholesalerSubtext}>{wholesaler.name}</Text>
                  <View style={styles.wholesalerMeta}>
                    <View style={styles.wholesalerMetaItem}>
                      <MapPin color="#6B7280" size={14} />
                      <Text style={styles.wholesalerMetaText}>{wholesaler.distance} km</Text>
                    </View>
                    <View style={styles.wholesalerMetaItem}>
                      <Text style={styles.wholesalerMetaText}>PIN: {wholesaler.pinCode}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{wholesaler.rating} ★</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  greeting: {
    fontSize: 14,
    color: "#6B7280",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  notificationButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  actionButton: {
    alignItems: "center",
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#4B5563",
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  seeAllText: {
    fontSize: 14,
    color: "#1E40AF",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDetailText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#6B7280",
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyCardContent: {
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: "#1E40AF",
  },
  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
  },
  searchCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  pinCodeText: {
    fontSize: 16,
    color: "#111827",
  },
  searchButton: {
    backgroundColor: "#1E40AF",
  },
  wholesalerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  wholesalerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  wholesalerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  wholesalerDetails: {
    flex: 1,
  },
  wholesalerName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  wholesalerSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  wholesalerMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  wholesalerMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  wholesalerMetaText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  ratingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#D97706",
  },
})

export default RetailerDashboardScreen
