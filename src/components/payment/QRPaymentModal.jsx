import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Copy, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * QR Payment Modal Component
 * Displays a QR code for payment and handles payment verification
 */
const QRPaymentModal = ({ 
  isOpen, 
  onClose, 
  onPaymentComplete, 
  memberData, 
  paymentAmount,
  paymentDescription = "Gym Membership Fee",
  gymOwnerUpiId = null,
  gymName = "Gym"
}) => {
  const [copied, setCopied] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [upiId] = useState(gymOwnerUpiId || "gymflow@upi");
  const [showUpiError, setShowUpiError] = useState(false);
  
  // Check if gym owner has UPI ID set
  useEffect(() => {
    if (!gymOwnerUpiId) {
      setShowUpiError(true);
      return;
    }
    setShowUpiError(false);
    
    // Generate QR code URL with gym owner's UPI ID
    const amount = typeof paymentAmount === 'number' ? paymentAmount.toFixed(2) : paymentAmount;
    setQrImageUrl("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=" + 
      encodeURIComponent(upiId) + 
      "&pn=" + encodeURIComponent(gymName) + 
      "&am=" + amount + 
      "&tn=" + encodeURIComponent(paymentDescription));
  }, [upiId, paymentAmount, paymentDescription, gymOwnerUpiId, gymName]);
  
  // Copy UPI ID to clipboard
  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied to clipboard");
    
    // Reset copied state after 3 seconds
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };
  
  // Complete payment with transaction ID
  const handleCompletePayment = async () => {
    if (!paymentId.trim()) {
      toast.error("Please enter the transaction ID");
      return;
    }
    
    setVerifying(true);
    
    try {
      // Simulate processing with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mark payment as verified
      setPaymentVerified(true);
      toast.success("Payment completed successfully!");
      
      // Call the onPaymentComplete callback after a short delay
      setTimeout(() => {
        onPaymentComplete({
          paymentId,
          amount: paymentAmount,
          status: "completed",
          timestamp: new Date().toISOString()
        });
      }, 1000);
    } catch (error) {
      console.error("Payment completion error:", error);
      toast.error("Failed to complete payment. Please try again.");
    } finally {
      setVerifying(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Member Payment</CardTitle>
            <CardDescription className="text-gray-400">
              Scan QR code or use UPI ID, then enter transaction ID
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={verifying}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* UPI Error Message */}
          {showUpiError && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-400">
                <X className="h-5 w-5" />
                <h4 className="font-medium">Payment Setup Required</h4>
              </div>
              <p className="text-red-300 text-sm mt-2">
                The gym owner has not set up their UPI ID for payments yet. 
                Please ask the gym owner to add their UPI ID in their profile settings 
                before proceeding with the payment.
              </p>
              <div className="mt-3 flex gap-2">
                <Button 
                  onClick={onClose}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  Refresh
                </Button>
              </div>
            </div>
          )}
          
          {/* Payment Content - Only show if UPI ID is available */}
          {!showUpiError && (
            <>
              {/* UPI ID Display - Make it prominent */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5 text-blue-400" />
                    <div>
                      <h4 className="text-blue-400 font-medium">Pay to UPI ID</h4>
                      <p className="text-blue-300 text-lg font-mono">{upiId}</p>
                      <p className="text-blue-200 text-sm">{gymName}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopyUpiId}
                    className="text-blue-300 hover:text-blue-100 hover:bg-blue-800/50"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-700/50 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-3">Payment Breakdown</h4>
            
            {/* Show payment breakdown if available */}
            {memberData?.paymentBreakdown ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Plan:</span>
                  <span className="text-white">{memberData.paymentBreakdown.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Plan Price:</span>
                  <span className="text-white">₹{memberData.paymentBreakdown.planPrice}/{memberData.paymentBreakdown.planDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Duration:</span>
                  <span className="text-white">
                    {memberData.paymentBreakdown.selectedDuration === 1 ? '1 Month' :
                     memberData.paymentBreakdown.selectedDuration < 12 ? `${memberData.paymentBreakdown.selectedDuration} Months` :
                     memberData.paymentBreakdown.selectedDuration === 12 ? '1 Year' :
                     memberData.paymentBreakdown.selectedDuration === 24 ? '2 Years' :
                     memberData.paymentBreakdown.selectedDuration === 36 ? '3 Years' :
                     memberData.paymentBreakdown.selectedDuration % 12 === 0 ? `${memberData.paymentBreakdown.selectedDuration / 12} Year${memberData.paymentBreakdown.selectedDuration / 12 > 1 ? 's' : ''}` :
                     `${memberData.paymentBreakdown.selectedDuration} Months`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Plan Cost:</span>
                  <span className="text-white">₹{memberData.paymentBreakdown.planCost}</span>
                </div>
                {memberData.paymentBreakdown.trainerCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Trainer Cost:</span>
                    <span className="text-white">₹{memberData.paymentBreakdown.trainerCost}</span>
                  </div>
                )}
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-300">Total Amount:</span>
                    <span className="text-white">₹{memberData.paymentBreakdown.totalAmount}</span>
                  </div>
                </div>
              </div>
            ) : (
              // Fallback if no breakdown is available
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Amount:</span>
                  <span className="text-white font-medium">₹{paymentAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Description:</span>
                  <span className="text-white">{paymentDescription}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg mb-4">
              {qrImageUrl ? (
                <img 
                  src={qrImageUrl} 
                  alt="Payment QR Code" 
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 bg-gray-700/50 p-2 rounded-lg w-full">
              <QrCode className="h-5 w-5 text-gray-400" />
              <span className="text-white flex-1 truncate">{upiId}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyUpiId}
                className="text-gray-300 hover:text-white"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Transaction ID Input */}
          <div className="space-y-3">
            <Label htmlFor="paymentId" className="text-gray-300">
              Enter Transaction ID <span className="text-red-400">*</span>
            </Label>
            <Input
              id="paymentId"
              placeholder="e.g. UPI123456789, TXN987654321"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white focus:border-blue-500"
              disabled={paymentVerified || verifying}
            />
            <p className="text-xs text-gray-400">
              1. Scan the QR code or use the UPI ID to make payment<br/>
              2. Enter the transaction ID you received after payment<br/>
              3. Click "Complete Payment" to create the member
            </p>
          </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {!showUpiError && (
            <>
              <div className="flex gap-2 w-full">
                <Button 
                  className={`flex-1 ${!paymentId.trim() ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  onClick={handleCompletePayment}
                  disabled={paymentVerified || verifying || !paymentId.trim()}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : paymentVerified ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Payment Completed
                    </>
                  ) : (
                    "Complete Payment"
                  )}
                </Button>
                
                {/* Skip Payment Button for Testing */}
                <Button 
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => {
                    // Generate a test payment ID
                    const testPaymentId = "TEST-" + Math.floor(100000 + Math.random() * 900000);
                    
                    // Call the onPaymentComplete callback with test data
                    onPaymentComplete({
                      paymentId: testPaymentId,
                      amount: paymentAmount,
                      status: "completed",
                      timestamp: new Date().toISOString()
                    });
                    
                    toast.success("Test payment processed");
                  }}
                  disabled={paymentVerified || verifying}
                >
                  Skip Payment (Test)
                </Button>
              </div>
              
              <p className="text-xs text-gray-400 text-center">
                Complete the payment using the QR code or UPI ID above, then enter your transaction ID to create the member.
                <br />
                <span className="text-amber-400">For testing: Use the "Skip Payment" button to bypass actual payment.</span>
              </p>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default QRPaymentModal;