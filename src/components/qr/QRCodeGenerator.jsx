import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const QRCodeGenerator = ({ gymOwnerId, gymName }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  const generateQRCode = async () => {
    if (!gymOwnerId || typeof gymOwnerId !== 'string' || gymOwnerId.trim() === '') {
      toast.error('A valid Gym Owner ID is required to generate QR code');
      console.error('Invalid gymOwnerId:', gymOwnerId);
      return;
    }

    setIsGenerating(true);
    try {
      const qrData = JSON.stringify({
        type: 'gym_owner',
        gymOwnerId: gymOwnerId.trim(),
        gymName: gymName && typeof gymName === 'string' ? gymName.trim() : 'Gym',
        timestamp: new Date().toISOString()
      });

      console.log('QR Code Data:', qrData);
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });

      console.log('Generated QR Code URL:', qrCodeDataUrl.substring(0, 50) + '...');
      setQrCodeUrl(qrCodeDataUrl);
      toast.success('QR Code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `gym-qr-code-${gymOwnerId}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code downloaded!');
  };

  const copyGymOwnerId = async () => {
    if (!gymOwnerId) {
      toast.error('No Gym Owner ID to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(gymOwnerId);
      setCopied(true);
      toast.success('Gym Owner ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <QrCode className="h-5 w-5 mr-2" />
          Gym QR Code
        </CardTitle>
        <CardDescription className="text-gray-400">
          Generate a QR code for your gym to verify members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-700">
          <div className="space-y-2">
            <div>
              <p className="text-gray-400 text-sm">Gym Name</p>
              <p className="text-white font-medium">{gymName || 'Your Gym'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Gym Owner ID</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-mono text-sm">{gymOwnerId || 'Not provided'}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyGymOwnerId}
                  className="h-6 px-2 border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={!gymOwnerId}
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {!qrCodeUrl && (
          <Button
            onClick={generateQRCode}
            disabled={isGenerating || !gymOwnerId}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Generating QR Code...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </>
            )}
          </Button>
        )}

        {qrCodeUrl && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={qrCodeUrl} 
                  alt="Gym QR Code" 
                  className="w-64 h-64"
                />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                Members can scan this QR code to verify their membership status and check if their subscription is active
              </p>
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={downloadQRCode}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                <Button
                  onClick={generateQRCode}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={!gymOwnerId}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <h4 className="text-blue-200 font-medium mb-2">How to use:</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Provide a valid Gym Owner ID and generate the QR code</li>
            <li>• Share this QR code with members or display it at your gym</li>
            <li>• Members scan it from their dashboard to verify membership</li>
            <li>• System checks if member belongs to your gym and subscription is active</li>
            <li>• Active members see "Subscription is Active" message</li>
            <li>• Download and print the QR code for physical display</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;