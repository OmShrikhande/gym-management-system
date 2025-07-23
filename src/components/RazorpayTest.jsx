import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getRazorpayKeyWithValidation, loadRazorpayScript, initializeRazorpayCheckout } from "@/utils/razorpayUtils";
import { useAuth } from "@/contexts/AuthContext";

const RazorpayTest = () => {
  const { authFetch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState({});

  const testAuthToken = () => {
    const tokenSources = [
      { name: 'gymflow_token (localStorage)', value: localStorage.getItem('gymflow_token') },
      { name: 'token (localStorage)', value: localStorage.getItem('token') },
      { name: 'gymflow_token (sessionStorage)', value: sessionStorage.getItem('gymflow_token') },
      { name: 'token (sessionStorage)', value: sessionStorage.getItem('token') }
    ];

    console.log('🔍 Authentication Token Test:');
    tokenSources.forEach(source => {
      const hasToken = source.value ? '✅' : '❌';
      const tokenPreview = source.value ? `${source.value.substring(0, 20)}...` : 'Not found';
      console.log(`${hasToken} ${source.name}: ${tokenPreview}`);
    });

    const activeToken = tokenSources.find(source => source.value);
    if (activeToken) {
      toast.success(`Found token: ${activeToken.name}`);
      return activeToken.value;
    } else {
      toast.error('No authentication token found');
      return null;
    }
  };

  const testRazorpayKey = async () => {
    setIsLoading(true);
    try {
      console.log('🔑 Testing Razorpay key fetch...');
      const key = await getRazorpayKeyWithValidation(authFetch);
      console.log('✅ Razorpay key test successful:', key);
      toast.success(`Razorpay key fetched: ${key}`);
      setTestResults(prev => ({ ...prev, razorpayKey: key }));
      return key;
    } catch (error) {
      console.error('❌ Razorpay key test failed:', error);
      toast.error(`Razorpay key test failed: ${error.message}`);
      setTestResults(prev => ({ ...prev, razorpayKeyError: error.message }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const testRazorpayScript = async () => {
    setIsLoading(true);
    try {
      console.log('📜 Testing Razorpay script loading...');
      const loaded = await loadRazorpayScript();
      if (loaded) {
        console.log('✅ Razorpay script test successful');
        toast.success('Razorpay script loaded successfully');
        setTestResults(prev => ({ ...prev, scriptLoaded: true }));
      } else {
        throw new Error('Script loading failed');
      }
    } catch (error) {
      console.error('❌ Razorpay script test failed:', error);
      toast.error(`Script loading failed: ${error.message}`);
      setTestResults(prev => ({ ...prev, scriptError: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const testFullIntegration = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing full Razorpay integration...');
      
      // Test payment options
      const options = {
        amount: 100, // ₹1.00 in paise
        currency: 'INR',
        name: 'GymFlow Test',
        description: 'Test Payment',
        order_id: 'test_order_' + Date.now(),
        handler: function (response) {
          console.log('✅ Payment successful:', response);
          toast.success('Test payment completed successfully!');
          setTestResults(prev => ({ 
            ...prev, 
            paymentTest: 'success',
            paymentId: response.razorpay_payment_id 
          }));
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            toast.info('Payment cancelled by user');
            setTestResults(prev => ({ ...prev, paymentTest: 'cancelled' }));
          }
        }
      };

      const razorpay = await initializeRazorpayCheckout(options);
      razorpay.open();
      
      console.log('✅ Full integration test initiated');
      toast.success('Razorpay checkout opened successfully!');
      
    } catch (error) {
      console.error('❌ Full integration test failed:', error);
      toast.error(`Integration test failed: ${error.message}`);
      setTestResults(prev => ({ ...prev, integrationError: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults({});
    
    // Test 1: Authentication
    const token = testAuthToken();
    if (!token) return;

    // Test 2: Razorpay Key
    try {
      await testRazorpayKey();
    } catch (error) {
      return; // Stop if key fetch fails
    }

    // Test 3: Script Loading
    await testRazorpayScript();

    // Test 4: Full Integration (optional)
    toast.info('All basic tests completed. Click "Test Full Integration" to test payment flow.');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Razorpay Integration Test</CardTitle>
        <CardDescription>
          Test the Razorpay integration to diagnose issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={testAuthToken}
            variant="outline"
            disabled={isLoading}
          >
            Test Auth Token
          </Button>
          
          <Button 
            onClick={testRazorpayKey}
            variant="outline"
            disabled={isLoading}
          >
            Test Razorpay Key
          </Button>
          
          <Button 
            onClick={testRazorpayScript}
            variant="outline"
            disabled={isLoading}
          >
            Test Script Loading
          </Button>
          
          <Button 
            onClick={testFullIntegration}
            variant="outline"
            disabled={isLoading}
          >
            Test Full Integration
          </Button>
        </div>

        <Button 
          onClick={runAllTests}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Running Tests...' : 'Run All Tests'}
        </Button>

        {Object.keys(testResults).length > 0 && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RazorpayTest;