"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Printer, Download, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface InvoicePreviewProps {
  type: "standard" | "detailed"
  isOpen: boolean
  onClose: () => void
  onSelect?: (type: "standard" | "detailed") => void
  isDefault?: boolean
}

export function InvoicePreview({ type, isOpen, onClose, onSelect, isDefault = false }: InvoicePreviewProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write("<html><head><title>Invoice Preview</title>")
      printWindow.document.write("<style>")
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; padding: 20px; }
        .invoice-container { max-width: 800px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { font-weight: bold; background-color: #f8f9fa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .mb-6 { margin-bottom: 24px; }
        .mt-8 { margin-top: 32px; }
        .border-t { border-top: 1px solid #ddd; padding-top: 16px; }
        .border-dashed { border-top: 1px dashed #000; width: 160px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin-bottom: 5px; }
        .header p { color: #666; }
        .company-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .company-details div { width: 48%; }
        .invoice-meta { margin-bottom: 20px; }
        .invoice-meta table { width: 100%; }
        .invoice-meta table td { border: none; padding: 3px 0; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .footer .signature { width: 200px; text-align: center; }
        .footer .signature p { margin-top: 50px; border-top: 1px solid #000; padding-top: 5px; }
        .terms { margin-top: 30px; }
        .terms h4 { margin-bottom: 10px; }
        .terms ul { padding-left: 20px; }
        .terms li { margin-bottom: 5px; }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          button { display: none; }
        }
      `)
      printWindow.document.write("</style></head><body>")
      printWindow.document.write('<div class="invoice-container">')

      if (type === "standard") {
        printWindow.document.write(`
          <div class="header">
            <h1>TAX INVOICE</h1>
            <p>Standard GST Invoice</p>
          </div>
          
          <div class="company-details">
            <div>
              <h3>Seller:</h3>
              <p>Wholesaler Business Name<br>
              GSTIN: 27AADCB2230M1Z3<br>
              123 Business Street<br>
              Mumbai, Maharashtra - 400001<br>
              Phone: 9876543210</p>
            </div>
            <div>
              <h3>Buyer:</h3>
              <p>Retailer Business Name<br>
              GSTIN: 27AABCS1429B1Z1<br>
              456 Shop Avenue<br>
              Mumbai, Maharashtra - 400002<br>
              Phone: 9876543211</p>
            </div>
          </div>
          
          <div class="invoice-meta">
            <table>
              <tr>
                <td><strong>Invoice No:</strong></td>
                <td>INV-2023-001</td>
                <td><strong>Date:</strong></td>
                <td>April 30, 2025</td>
              </tr>
              <tr>
                <td><strong>Order No:</strong></td>
                <td>ORD-2023-001</td>
                <td><strong>Payment:</strong></td>
                <td>PAID</td>
              </tr>
            </table>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-center">Quantity</th>
                <th class="text-right">Price</th>
                <th class="text-right">GST</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Premium Rice</td>
                <td class="text-center">10</td>
                <td class="text-right">₹1,200.00</td>
                <td class="text-right">18%</td>
                <td class="text-right">₹12,000.00</td>
              </tr>
              <tr>
                <td>Refined Oil</td>
                <td class="text-center">5</td>
                <td class="text-right">₹800.00</td>
                <td class="text-right">18%</td>
                <td class="text-right">₹4,000.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="text-right font-bold">Subtotal:</td>
                <td class="text-right">₹16,000.00</td>
              </tr>
              <tr>
                <td colspan="4" class="text-right">Delivery Fee:</td>
                <td class="text-right">₹50.00</td>
              </tr>
              <tr>
                <td colspan="4" class="text-right">Delivery GST:</td>
                <td class="text-right">₹9.00</td>
              </tr>
              <tr>
                <td colspan="4" class="text-right font-bold">Total:</td>
                <td class="text-right font-bold">₹16,059.00</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="terms">
            <h4>Terms & Conditions:</h4>
            <ul>
              <li>Goods once sold will not be taken back or exchanged.</li>
              <li>All disputes are subject to local jurisdiction only.</li>
              <li>E&OE (Errors and Omissions Excepted).</li>
            </ul>
          </div>
          
          <div class="footer">
            <div class="signature">
              <p>Authorized Signature</p>
            </div>
            <div>
              <p>This is a computer-generated invoice.<br>No signature required.</p>
            </div>
          </div>
        `)
      } else {
        printWindow.document.write(`
          <div class="header">
            <h1>DETAILED TAX INVOICE</h1>
            <p>With HSN Codes and Tax Breakup</p>
          </div>
          
          <div class="company-details">
            <div>
              <h3>Seller:</h3>
              <p>Wholesaler Business Name<br>
              GSTIN: 27AADCB2230M1Z3<br>
              123 Business Street<br>
              Mumbai, Maharashtra - 400001<br>
              Phone: 9876543210</p>
            </div>
            <div>
              <h3>Buyer:</h3>
              <p>Retailer Business Name<br>
              GSTIN: 27AABCS1429B1Z1<br>
              456 Shop Avenue<br>
              Mumbai, Maharashtra - 400002<br>
              Phone: 9876543211</p>
            </div>
          </div>
          
          <div class="invoice-meta">
            <table>
              <tr>
                <td><strong>Invoice No:</strong></td>
                <td>INV-2023-001</td>
                <td><strong>Date:</strong></td>
                <td>April 30, 2025</td>
              </tr>
              <tr>
                <td><strong>Order No:</strong></td>
                <td>ORD-2023-001</td>
                <td><strong>Payment:</strong></td>
                <td>PAID</td>
              </tr>
              <tr>
                <td><strong>Place of Supply:</strong></td>
                <td>Maharashtra</td>
                <td><strong>Supply Type:</strong></td>
                <td>Intra-State</td>
              </tr>
            </table>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>HSN Code</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Taxable Value</th>
                <th class="text-right">CGST</th>
                <th class="text-right">SGST</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Premium Rice</td>
                <td>1006</td>
                <td class="text-center">10</td>
                <td class="text-right">₹1,200.00</td>
                <td class="text-right">₹10,169.49</td>
                <td class="text-right">₹915.25 (9%)</td>
                <td class="text-right">₹915.25 (9%)</td>
                <td class="text-right">₹12,000.00</td>
              </tr>
              <tr>
                <td>Refined Oil</td>
                <td>1512</td>
                <td class="text-center">5</td>
                <td class="text-right">₹800.00</td>
                <td class="text-right">₹3,389.83</td>
                <td class="text-right">₹305.08 (9%)</td>
                <td class="text-right">₹305.08 (9%)</td>
                <td class="text-right">₹4,000.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="text-right font-bold">Subtotal:</td>
                <td class="text-right">₹13,559.32</td>
                <td class="text-right">₹1,220.33</td>
                <td class="text-right">₹1,220.33</td>
                <td class="text-right">₹16,000.00</td>
              </tr>
              <tr>
                <td colspan="4" class="text-right">Delivery Fee:</td>
                <td class="text-right">₹42.37</td>
                <td class="text-right">₹3.81</td>
                <td class="text-right">₹3.81</td>
                <td class="text-right">₹50.00</td>
              </tr>
              <tr>
                <td colspan="4" class="text-right font-bold">Total:</td>
                <td class="text-right font-bold">₹13,601.69</td>
                <td class="text-right font-bold">₹1,224.14</td>
                <td class="text-right font-bold">₹1,224.14</td>
                <td class="text-right font-bold">₹16,050.00</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="terms">
            <h4>Terms & Conditions:</h4>
            <ul>
              <li>Goods once sold will not be taken back or exchanged.</li>
              <li>All disputes are subject to local jurisdiction only.</li>
              <li>E&OE (Errors and Omissions Excepted).</li>
            </ul>
          </div>
          
          <div class="footer">
            <div class="signature">
              <p>Authorized Signature</p>
            </div>
            <div>
              <p>This is a computer-generated invoice.<br>No signature required.</p>
            </div>
          </div>
        `)
      }

      printWindow.document.write("</div></body></html>")
      printWindow.document.close()

      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.focus()
        setTimeout(() => {
          setIsPrinting(false)
        }, 1000)
      }
    }
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob(
      [type === "standard" ? "Standard GST Invoice Template" : "Detailed Tax Invoice Template with HSN codes"],
      { type: "text/plain" },
    )
    element.href = URL.createObjectURL(file)
    element.download = type === "standard" ? "standard-gst-invoice-template.txt" : "detailed-tax-invoice-template.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleSelect = () => {
    if (onSelect) {
      onSelect(type)
      toast({
        title: "Template Selected",
        description: `${type === "standard" ? "Standard GST Invoice" : "Detailed Tax Invoice"} set as default template.`,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{type === "standard" ? "Standard GST Invoice" : "Detailed Tax Invoice"}</DialogTitle>
        </DialogHeader>

        <div className="bg-white p-6 border rounded-md max-h-[70vh] overflow-auto">
          {type === "standard" ? (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold">TAX INVOICE</h1>
                <p className="text-gray-500">Standard GST Invoice</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-2">Seller:</h3>
                  <p className="text-sm">
                    Wholesaler Business Name
                    <br />
                    GSTIN: 27AADCB2230M1Z3
                    <br />
                    123 Business Street
                    <br />
                    Mumbai, Maharashtra - 400001
                    <br />
                    Phone: 9876543210
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Buyer:</h3>
                  <p className="text-sm">
                    Retailer Business Name
                    <br />
                    GSTIN: 27AABCS1429B1Z1
                    <br />
                    456 Shop Avenue
                    <br />
                    Mumbai, Maharashtra - 400002
                    <br />
                    Phone: 9876543211
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-bold">Invoice No:</span> INV-2023-001
                </div>
                <div>
                  <span className="font-bold">Date:</span> April 30, 2025
                </div>
                <div>
                  <span className="font-bold">Order No:</span> ORD-2023-001
                </div>
                <div>
                  <span className="font-bold">Payment:</span> PAID
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Item</th>
                      <th className="text-center py-2">Quantity</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">GST</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Premium Rice</td>
                      <td className="text-center py-2">10</td>
                      <td className="text-right py-2">₹1,200.00</td>
                      <td className="text-right py-2">18%</td>
                      <td className="text-right py-2">₹12,000.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Refined Oil</td>
                      <td className="text-center py-2">5</td>
                      <td className="text-right py-2">₹800.00</td>
                      <td className="text-right py-2">18%</td>
                      <td className="text-right py-2">₹4,000.00</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-right py-2 font-bold">
                        Subtotal:
                      </td>
                      <td className="text-right py-2">₹16,000.00</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right py-2">
                        Delivery Fee:
                      </td>
                      <td className="text-right py-2">₹50.00</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right py-2">
                        Delivery GST:
                      </td>
                      <td className="text-right py-2">₹9.00</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right py-2 font-bold">
                        Total:
                      </td>
                      <td className="text-right py-2 font-bold">₹16,059.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div>
                <h4 className="font-bold mb-2">Terms & Conditions:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Goods once sold will not be taken back or exchanged.</li>
                  <li>All disputes are subject to local jurisdiction only.</li>
                  <li>E&OE (Errors and Omissions Excepted).</li>
                </ul>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <div className="w-40">
                  <div className="border-t border-dashed border-black mt-10 pt-1 text-center text-sm">
                    Authorized Signature
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>This is a computer-generated invoice.</p>
                  <p>No signature required.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold">DETAILED TAX INVOICE</h1>
                <p className="text-gray-500">With HSN Codes and Tax Breakup</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-2">Seller:</h3>
                  <p className="text-sm">
                    Wholesaler Business Name
                    <br />
                    GSTIN: 27AADCB2230M1Z3
                    <br />
                    123 Business Street
                    <br />
                    Mumbai, Maharashtra - 400001
                    <br />
                    Phone: 9876543210
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Buyer:</h3>
                  <p className="text-sm">
                    Retailer Business Name
                    <br />
                    GSTIN: 27AABCS1429B1Z1
                    <br />
                    456 Shop Avenue
                    <br />
                    Mumbai, Maharashtra - 400002
                    <br />
                    Phone: 9876543211
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-bold">Invoice No:</span> INV-2023-001
                </div>
                <div>
                  <span className="font-bold">Date:</span> April 30, 2025
                </div>
                <div>
                  <span className="font-bold">Order No:</span> ORD-2023-001
                </div>
                <div>
                  <span className="font-bold">Payment:</span> PAID
                </div>
                <div>
                  <span className="font-bold">Place of Supply:</span> Maharashtra
                </div>
                <div>
                  <span className="font-bold">Supply Type:</span> Intra-State
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Item</th>
                      <th className="text-left py-2">HSN Code</th>
                      <th className="text-center py-2">Qty</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Taxable Value</th>
                      <th className="text-right py-2">CGST</th>
                      <th className="text-right py-2">SGST</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Premium Rice</td>
                      <td className="py-2">1006</td>
                      <td className="text-center py-2">10</td>
                      <td className="text-right py-2">₹1,200.00</td>
                      <td className="text-right py-2">₹10,169.49</td>
                      <td className="text-right py-2">₹915.25 (9%)</td>
                      <td className="text-right py-2">₹915.25 (9%)</td>
                      <td className="text-right py-2">₹12,000.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Refined Oil</td>
                      <td className="py-2">1512</td>
                      <td className="text-center py-2">5</td>
                      <td className="text-right py-2">₹800.00</td>
                      <td className="text-right py-2">₹3,389.83</td>
                      <td className="text-right py-2">₹305.08 (9%)</td>
                      <td className="text-right py-2">₹305.08 (9%)</td>
                      <td className="text-right py-2">₹4,000.00</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-right py-2 font-bold">
                        Subtotal:
                      </td>
                      <td className="text-right py-2">₹13,559.32</td>
                      <td className="text-right py-2">₹1,220.33</td>
                      <td className="text-right py-2">₹1,220.33</td>
                      <td className="text-right py-2">₹16,000.00</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right py-2">
                        Delivery Fee:
                      </td>
                      <td className="text-right py-2">₹42.37</td>
                      <td className="text-right py-2">₹3.81</td>
                      <td className="text-right py-2">₹3.81</td>
                      <td className="text-right py-2">₹50.00</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right py-2 font-bold">
                        Total:
                      </td>
                      <td className="text-right py-2 font-bold">₹13,601.69</td>
                      <td className="text-right py-2 font-bold">₹1,224.14</td>
                      <td className="text-right py-2 font-bold">₹1,224.14</td>
                      <td className="text-right py-2 font-bold">₹16,050.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div>
                <h4 className="font-bold mb-2">Terms & Conditions:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Goods once sold will not be taken back or exchanged.</li>
                  <li>All disputes are subject to local jurisdiction only.</li>
                  <li>E&OE (Errors and Omissions Excepted).</li>
                </ul>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <div className="w-40">
                  <div className="border-t border-dashed border-black mt-10 pt-1 text-center text-sm">
                    Authorized Signature
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>This is a computer-generated invoice.</p>
                  <p>No signature required.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={isDefault ? "default" : "outline"}
              onClick={handleSelect}
              className={isDefault ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isDefault ? "Current Default" : "Set as Default"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? "Printing..." : "Print"}
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
