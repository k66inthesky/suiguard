import { CheckIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'On Demand',
    price: '$0.1 USDC',
    period: '/report',
    description: 'Perfect for individual developers and small projects',
    features: [
      'Basic security audit',
      'Up to 1000 lines of code',
      '2-week turnaround',
      'PDF report',
      'Email support',
    ],
    buttonText: 'Get Started',
    buttonStyle:
      'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:cursor-pointer',
    popular: false,
  },
  {
    name: 'Individual',
    price: '$20 USDC',
    period: '/month',
    description: 'Ideal for production-ready applications',
    features: [
      'Comprehensive security audit',
      'Up to 8000 lines of code',
      '1-week turnaround',
      'Detailed report + remediation guidance',
      'Priority support',
      'Re-audit after fixes (1x)',
      'Security badge',
    ],
    buttonText: 'Get Started',
    buttonStyle: 'bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer',
    popular: true,
  },
    {
    name: 'Pro',
    price: '$50 USDC',
    period: '/month',
    description: 'For large-scale DeFi protocols',
    features: [
      'Full platform security review',
      'Unlimited lines of code',
      'Custom timeline',
      'Ongoing security monitoring',
      'Dedicated security team',
      'Unlimited re-audits',
      'Public security report',
      '24/7 support',
    ],
    buttonText: 'Contact Us',
    buttonStyle: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section className="py-24 bg-white flex flex-col items-center" id="pricing">
      <div className="container mx-auto px-6 flex flex-col items-center gap-10">
        <div className="text-center mb-16 flex flex-col items-center gap-2">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your security needs
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-xl p-8 shadow-sm border transition-all duration-300 hover:shadow-lg relative ${
                plan.popular ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                  {plan.period && <span className="text-gray-600">{plan.period}</span>}
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex flex-col gap-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-gray-700">
                    <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/get-started"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`block w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ${plan.buttonStyle}`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
