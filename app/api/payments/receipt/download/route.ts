import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { errorHandler } from "@/lib/error-handler"
import { format } from "date-fns"

// In a real application, you would use a PDF generation library like PDFKit or jsPDF
// For this example, we'll just return a simple HTML file that can be printed/saved as PDF

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError) {
      console.error("Error fetching payment:", paymentError)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", payment.order_id)
      .single()

    if (orderError) {
      console.error("Error fetching order:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Get product details for each order item
    const productIds = order.items.map((item: any) => item.product_id)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds)

    if (productsError) {
      console.error("Error fetching products:", productsError)
    }

    // Map products to order items
    const productsMap = (products || []).reduce((acc: Record<string, any>, product: any) => {
      acc[product.id] = product
      return acc
    }, {})

    const orderItemsWithProducts = order.items.map((item: any) => ({
      ...item,
      product: productsMap[item.product_id] || { name: `Product #${item.product_id}` },
    }))

    // Generate HTML receipt
    const html = generateReceiptHTML(payment, { ...order, items: orderItemsWithProducts })

    // Return HTML with appropriate headers
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="receipt-${payment.reference_id || payment.id}.html"`,
      },
    })
  } catch (error) {
    return errorHandler(error, "Error generating receipt", {
      status: 500,
      response: NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 }),
    })
  }
}

function generateReceiptHTML(payment: any, order: any) {
  const subtotal = order.total_amount
  const deliveryFee = order.delivery_charge || 0
  const gst = order.delivery_charge_gst || 0
  const total = subtotal + deliveryFee + gst

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt - ${payment.reference_id || payment.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #eee;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #eee;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .info-box {
          width: 48%;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        th {
          background-color: #f9f9f9;
        }
        .text-right {
          text-align: right;
        }
        .total-row {
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #777;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>Payment Receipt</h1>
          <div>
            <p>Receipt #: ${payment.reference_id || payment.id}</p>
            <p>Date: ${format(new Date(payment.payment_date || payment.created_at), "dd MMM yyyy")}</p>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-box">
            <h3>Order Information</h3>
            <p>Order #: ${order.order_number}</p>
            <p>Date: ${format(new Date(order.created_at), "dd MMM yyyy")}</p>
            <p>Status: ${order.status}</p>
          </div>
          <div class="info-box">
            <h3>Payment Information</h3>
            <p>Method: ${payment.payment_method}</p>
            <p>Status: ${payment.payment_status}</p>
            ${payment.transaction_id ? `<p>Transaction ID: ${payment.transaction_id}</p>` : ""}
          </div>
        </div>
        
        <h3>Order Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Price</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item: any) => `
              <tr>
                <td>${item.product?.name || `Product #${item.product_id}`}</td>
                <td class="text-right">₹${item.unit_price.toFixed(2)}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">₹${item.total_price.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
            <tr>
              <td colspan="3" class="text-right">Subtotal</td>
              <td class="text-right">₹${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-right">Delivery Fee</td>
              <td class="text-right">₹${deliveryFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-right">GST</td>
              <td class="text-right">₹${gst.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" class="text-right">Total</td>
              <td class="text-right">₹${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>For any queries, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
