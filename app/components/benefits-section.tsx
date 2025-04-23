"use client"

import { useTranslation } from "./translation-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Store, Warehouse, Truck } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function BenefitsSection() {
  const { t } = useTranslation()
  const [openDialog, setOpenDialog] = useState<string | null>(null)

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Retailer Benefits */}
          <Card className="shadow-md border-blue-100">
            <CardHeader className="text-center">
              <Store className="h-16 w-16 mx-auto text-blue-500 mb-2" />
              <CardTitle className="text-2xl">{t("benefits.retailer.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xl mb-6">{t("benefits.retailer.description")}</p>
              <Button
                variant="outline"
                className="text-blue-500 border-blue-500 hover:bg-blue-50 transform transition-transform active:scale-95"
                onClick={() => setOpenDialog("retailer")}
              >
                {t("learn.more")}
              </Button>
            </CardContent>
          </Card>

          {/* Wholesaler Benefits */}
          <Card className="shadow-md border-blue-100">
            <CardHeader className="text-center">
              <Warehouse className="h-16 w-16 mx-auto text-orange-500 mb-2" />
              <CardTitle className="text-2xl">{t("benefits.wholesaler.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xl mb-6">{t("benefits.wholesaler.description")}</p>
              <Button
                variant="outline"
                className="text-orange-500 border-orange-500 hover:bg-orange-50 transform transition-transform active:scale-95"
                onClick={() => setOpenDialog("wholesaler")}
              >
                {t("learn.more")}
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Partner Benefits */}
          <Card className="shadow-md border-blue-100">
            <CardHeader className="text-center">
              <Truck className="h-16 w-16 mx-auto text-green-500 mb-2" />
              <CardTitle className="text-2xl">{t("benefits.delivery.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xl mb-6">{t("benefits.delivery.description")}</p>
              <Button
                variant="outline"
                className="text-green-500 border-green-500 hover:bg-green-50 transform transition-transform active:scale-95"
                onClick={() => setOpenDialog("delivery")}
              >
                {t("learn.more")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Retailer Dialog */}
      <Dialog open={openDialog === "retailer"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center">
              <Store className="h-8 w-8 text-blue-500 mr-2" />
              {t("benefits.retailer.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-lg">
            <p>• Browse nearby wholesalers using pin code or GPS</p>
            <p>• Order products with easy catalog navigation</p>
            <p>• Track orders in real-time</p>
            <p>• Pay using UPI or Cash on Delivery</p>
            <p>• Get instant order confirmations via WhatsApp</p>
            <p>• Download GST-compliant invoices</p>
            <p>• Export tax reports for your business</p>
            <p>• Voice-guided interface in English and Hindi</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wholesaler Dialog */}
      <Dialog open={openDialog === "wholesaler"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center">
              <Warehouse className="h-8 w-8 text-orange-500 mr-2" />
              {t("benefits.wholesaler.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-lg">
            <p>• Manage your product catalog with ease</p>
            <p>• Receive and confirm orders from retailers</p>
            <p>• Get real-time notifications for new orders</p>
            <p>• Track inventory and get low stock alerts</p>
            <p>• Receive secure payments directly to your bank</p>
            <p>• Generate GST-compliant receipts</p>
            <p>• View commission rates transparently</p>
            <p>• Export tax reports for your business</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delivery Partner Dialog */}
      <Dialog open={openDialog === "delivery"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center">
              <Truck className="h-8 w-8 text-green-500 mr-2" />
              {t("benefits.delivery.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-lg">
            <p>• Receive delivery assignments in your area</p>
            <p>• Accept or decline deliveries based on your availability</p>
            <p>• Use GPS navigation to find delivery locations</p>
            <p>• Verify deliveries using OTP or photo proof</p>
            <p>• Earn fixed charges per delivery</p>
            <p>• Get payments directly to your bank account</p>
            <p>• View delivery history and earnings</p>
            <p>• Export tax reports for your business</p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
