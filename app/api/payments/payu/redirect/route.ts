import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const txnid = url.searchParams.get("txnid")

    if (!txnid) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 })
    }

    // Get PayU configuration
    const merchantKey = process.env.PAYU_MERCHANT_KEY
    const merchantSalt = process.env.PAYU_MERCHANT_SALT

    if (!merchantKey || !merchantSalt) {
      return NextResponse.json({ error: "Payment gateway configuration is missing" }, { status: 500 })
    }

    // Get payment details from our database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*, order:order_id(*)")
      .eq("transaction_id", txnid)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Generate PayU form HTML
    const payuFormHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting to PayU...</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
          }
          .loader {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 2s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <h2>Redirecting to PayU Payment Gateway...</h2>
        <div class="loader"></div>
        <p>Please do not refresh or close this page.</p>
        
        <form id="payuForm" action="https://secure.payu.in/_payment" method="post">
          <input type="hidden" name="key" value="${merchantKey}" />
          <input type="hidden" name="txnid" value="${payment.transaction_id}" />
          <input type="hidden" name="amount" value="${payment.amount}" />
          <input type="hidden" name="productinfo" value="Order #${payment.order?.order_number}" />
          <input type="hidden" name="firstname" value="${payment.order?.retailer?.name || "Customer"}" />
          <input type="hidden" name="email" value="${payment.order?.retailer?.email || "customer@example.com"}" />
          <input type="hidden" name="phone" value="${payment.order?.retailer?.phone_number || ""}" />
          <input type="hidden" name="surl" value="${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payu/success" />
          <input type="hidden" name="furl" value="${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payu/failure" />
          <input type="hidden" name="udf1" value="${payment.order_id}" />
          <input type="hidden" name="hash" value="${payment.hash || ""}" />
        </form>
        
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
              document.getElementById('payuForm').submit();
            }, 2000);
          });
        </script>
      </body>
      </html>
    `

    return new NextResponse(payuFormHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error in PayU redirect:", error)
    return new NextResponse("Error processing payment redirect", { status: 500 })
  }
}
