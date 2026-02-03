import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[#1a1f2e] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
            <span className="text-2xl">←</span>
          </Link>
          <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
        </div>

        <div className="space-y-6 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to NexusAI. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the Website, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Website or otherwise when you contact us.
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Personal Data:</strong> Name, email address, password, college name, branch, and year of study.</li>
              <li><strong>Usage Data:</strong> Information about how you use our application, including study sessions, notes created, and quiz results.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p>
              We use personal information collected via our Website for a variety of business purposes described below:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>To facilitate account creation and logon process.</li>
              <li>To provide you with the services offered on NexusAI (AI Tutor, Notes, Community, etc.).</li>
              <li>To improve our platform and user experience.</li>
              <li>To protect our Services and ensure security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Data Security</h2>
            <p>
              We aim to protect your personal information through a system of organizational and technical security measures. However, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Updates to This Policy</h2>
            <p>
              We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.
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

export default Privacy;