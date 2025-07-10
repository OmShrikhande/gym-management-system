import { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, Scan, CheckCircle, X, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

// API URL - Use environment variable or fallback to production
const API_URL = import.meta.env.VITE_API_URL || 'https://gym-management-system-ckb0.onrender.com/api';

const QRCodeScanner = ({ onScanSuccess, onClose, memberId }) => {
  const { token, user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const checkCamera = async () => {
      try {
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);
        if (!hasCamera) {
          toast.info('No camera found. You can upload a QR code image to scan.');
        }
      } catch (error) {
        console.error('Error checking camera:', error);
        setHasCamera(false);
      }
    };

    checkCamera();
  }, []);

  const startScanning = async () => {
    if (!hasCamera || !videoRef.current) return;

    try {
      setIsScanning(true);
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          onDecodeError: (error) => {
            console.debug('QR decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      );

      await qrScannerRef.current.start();
      toast.success('Scanner started. Point your camera at a QR code.');
    } catch (error) {
      console.error('Error starting scanner:', error);
      toast.error('Failed to start camera scanner');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      console.log('Processing uploaded image:', file.name, `(${file.size} bytes)`);
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true
      });
      console.log('Scanned image result:', result);
      handleScanResult(result.data);
    } catch (error) {
      console.error('Error scanning image:', error);
      toast.error(`Failed to scan QR code from image: ${error.message || 'Unknown error'}. Ensure the image contains a clear QR code.`);
      setVerificationResult(null);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleScanResult = async (data) => {
    if (isProcessing) return;

    // Check if user is authenticated
    if (!token || !user) {
      toast.error('Please log in to verify membership');
      return;
    }

    setIsProcessing(true);
    stopScanning();

    let qrData = null;

    try {
      console.log('Scanned QR code data:', data);
      try {
        qrData = JSON.parse(data);
      } catch (parseError) {
        throw new Error('Invalid QR code format: Unable to parse JSON');
      }

      console.log('Parsed QR code data:', qrData);

      // Validate QR data
      if (!qrData.type || qrData.type !== 'gym_owner') {
        throw new Error('Invalid QR code: Missing or incorrect type (expected "gym_owner")');
      }
      if (!qrData.gymOwnerId || typeof qrData.gymOwnerId !== 'string' || qrData.gymOwnerId.trim() === '') {
        throw new Error('Invalid QR code: Missing or invalid gymOwnerId');
      }

      // Prepare request data - let server handle timestamp
      const requestData = {
        gymOwnerId: qrData.gymOwnerId,
        memberId: memberId || user?._id
        // Removed timestamp - server will use current time to avoid timezone issues
      };

      console.log('Request data being sent:', requestData);
      console.log('User data:', user);
      console.log('Token exists:', !!token);

      // Make API call to verify membership
      const response = await axios.post(`${API_URL}/attendance/verify`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Verification response:', response.data);
      
      // Log NodeMCU response if present
      if (response.data.nodeMcuResponse) {
        console.log('NodeMCU Response:', response.data.nodeMcuResponse);
      }
      
      const isSuccess = response.data.status === 'success';
      const membershipStatus = response.data.data?.member?.membershipStatus || 'Unknown';

      // If verification is successful, automatically mark attendance
      if (isSuccess) {
        try {
          const attendanceResponse = await axios.post(`${API_URL}/attendance/mark`, requestData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Attendance marked:', attendanceResponse.data);
          
          if (attendanceResponse.data.status === 'success') {
            toast.success('✅ Attendance marked successfully!', {
              duration: 3000,
            });
          }
        } catch (attendanceError) {
          console.error('Error marking attendance:', attendanceError);
          // Don't fail the main verification if attendance marking fails
          toast.warning('Verification successful but attendance marking failed');
        }
      }
      
      setVerificationResult({
        status: response.data.status,
        message: response.data.message,
        gymName: response.data.data?.gym?.name || qrData.gymName || 'Gym',
        membershipStatus: membershipStatus,
        memberName: response.data.data?.member?.name || 'Member'
      });

      if (isSuccess) {
        toast.success(response.data.message, {
          duration: 5000,
        });
      } else {
        toast.error(response.data.message, {
          duration: 5000,
        });
      }

      if (onScanSuccess) {
        onScanSuccess(response.data);
      }

      // Refresh user data after successful attendance marking
      if (isSuccess) {
        // Trigger a refresh of member data
        window.dispatchEvent(new CustomEvent('attendanceMarked', { 
          detail: { memberId: memberId || user?._id } 
        }));
      }

      setTimeout(() => resetScanner(), 3000);
    } catch (error) {
      console.error('Error processing QR code:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Invalid QR code. Please scan a valid gym QR code.';
      setVerificationResult({
        status: 'error',
        message: errorMessage,
        gymName: error.response?.data?.data?.gym?.name || qrData?.gymName || 'Gym',
        membershipStatus: error.response?.data?.data?.member?.membershipStatus || 'Unknown',
        memberName: error.response?.data?.data?.member?.name || 'Member'
      });
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setVerificationResult(null);
    setIsProcessing(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center">
              <Scan className="h-5 w-5 mr-2" />
              Scan Gym QR Code
            </CardTitle>
            <CardDescription className="text-gray-400">
              Scan a gym's QR code to verify your membership status
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              aria-label="Close scanner"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {verificationResult ? (
          <div className="space-y-4">
            <div className={`border rounded-lg p-4 ${verificationResult.status === 'success' ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
              <div className="flex items-center mb-3">
                {verificationResult.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                )}
                <h4 className={`${verificationResult.status === 'success' ? 'text-green-200' : 'text-red-200'} font-medium`}>
                  {verificationResult.status === 'success' ? 'Membership Verified' : 'Verification Failed'}
                </h4>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-gray-400 text-sm">Gym Name</p>
                  <p className="text-white font-medium">{verificationResult.gymName}</p>
                </div>
                {verificationResult.memberName && (
                  <div>
                    <p className="text-gray-400 text-sm">Member</p>
                    <p className="text-white font-medium">{verificationResult.memberName}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400 text-sm">Membership Status</p>
                  <p className={`font-medium ${verificationResult.membershipStatus === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
                    {verificationResult.membershipStatus}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Message</p>
                  <p className="text-white text-sm">{verificationResult.message}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={resetScanner}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                aria-label="Scan another QR code"
              >
                Scan Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className={`w-full h-64 bg-gray-900 rounded-lg object-cover ${isScanning ? 'block' : 'hidden'}`}
                playsInline
                muted
              />
              {!isScanning && (
                <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Camera preview will appear here</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {hasCamera && (
                <>
                  {!isScanning ? (
                    <Button
                      onClick={startScanning}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={isProcessing}
                      aria-label="Start QR code scanner"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Start Scanner
                    </Button>
                  ) : (
                    <Button
                      onClick={stopScanning}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      aria-label="Stop QR code scanner"
                    >
                      <CameraOff className="h-4 w-4 mr-2" />
                      Stop Scanner
                    </Button>
                  )}
                </>
              )}
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={isProcessing}
                aria-label="Upload QR code image"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                disabled={isProcessing}
              />
            </div>

            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <h4 className="text-blue-200 font-medium mb-2">How to scan:</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Click "Start Scanner" to use your camera (if available)</li>
                <li>• Point your camera at the gym's QR code</li>
                <li>• Or click "Upload Image" to select a QR code image</li>
                <li>• Ensure the QR code is clear and well-lit</li>
                <li>• Your membership status will be verified upon successful scan</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeScanner;