import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';

const SubscriptionPlans = ({ onSelectPlan, currentPlan = null, isLoading = false }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 999,
      duration: '1 month',
      icon: Star,
      color: 'bg-blue-500',
      popular: false,
      features: [
        'Up to 100 members',
        'Basic member management',
        'QR code generation',
        'Basic reporting',
        'Email support',
        'Mobile app access'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 1999,
      duration: '1 month',
      icon: Crown,
      color: 'bg-purple-500',
      popular: true,
      features: [
        'Up to 500 members',
        'Advanced member management',
        'Workout plan creation',
        'Diet plan management',
        'Advanced reporting',
        'Priority email support',
        'Mobile app access',
        'SMS notifications',
        'Custom branding'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 3999,
      duration: '1 month',
      icon: Zap,
      color: 'bg-gold-500',
      popular: false,
      features: [
        'Unlimited members',
        'Full member management',
        'Advanced workout plans',
        'Comprehensive diet plans',
        'Advanced analytics',
        'Priority phone support',
        'Mobile app access',
        'SMS & WhatsApp notifications',
        'Full custom branding',
        'API access',
        'Multi-location support'
      ]
    }
  ];

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    onSelectPlan(plan);
  };

  const isPlanActive = (planId) => {
    return currentPlan?.plan?.toLowerCase() === planId;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Plan
        </h2>
        <p className="text-gray-600">
          Select the perfect plan for your gym management needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isActive = isPlanActive(plan.id);
          const isSelected = selectedPlan?.id === plan.id;

          return (
            <Card 
              key={plan.id}
              className={`relative transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-blue-500 transform scale-105' 
                  : 'hover:shadow-lg'
              } ${
                isActive 
                  ? 'border-green-500 bg-green-50' 
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {isActive && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto rounded-full ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  {plan.name}
                </CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-gray-900">
                    ₹{plan.price}
                  </div>
                  <div className="text-sm text-gray-600">
                    per {plan.duration}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isLoading || isActive}
                    className={`w-full ${
                      isActive 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : isSelected 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : isActive ? (
                      'Current Plan'
                    ) : isSelected ? (
                      'Selected'
                    ) : (
                      'Select Plan'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-600 space-y-2">
        <p>✓ All plans include 24/7 customer support</p>
        <p>✓ 30-day money-back guarantee</p>
        <p>✓ Easy upgrade or downgrade anytime</p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;