import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[#1a1f2e] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
            <span className="text-2xl">←</span>
          </Link>
          <h1 className="text-4xl font-bold text-white">Terms and Conditions</h1>
        </div>

        <div className="space-y-6 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using NexusAI, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, then you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
            <p className="mt-2">
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">3. Use of AI Services</h2>
            <p>
              NexusAI provides AI-powered tools (Tutor, Simulators, etc.). While we strive for accuracy, AI-generated content may occasionally contain errors or inaccuracies. Users are encouraged to verify critical information from official academic sources.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of NexusAI and its licensors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Termination</h2>
            <p>
              We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
            <p>
              In no event shall NexusAI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          <div className="pt-8 border-t border-gray-800 text-center">
            <Link to="/login" className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;