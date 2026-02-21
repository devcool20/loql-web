import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../legal.module.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | loql",
  description: "Privacy Policy for loql",
};

export default function PrivacyPolicy() {
  return (
    <main>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last Updated: February 21, 2026</p>
        
        <div className={styles.content}>
          <p>
            Welcome to loql. This Privacy Policy ("Policy") describes how loql ("we", "us", or "our") collects, uses, and shares your personal information when you use our website, mobile application, and related services (collectively, the "Services").
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul>
            <li><strong>Account Information:</strong> When you register, we collect your name, email address, phone number, and society/community details.</li>
            <li><strong>Google User Data:</strong> If you use Google OAuth to sign in, we collect your Google email address and basic profile information to authenticate you and create your account.</li>
            <li><strong>User Content:</strong> Information you post on the Services, including items you list for rent, descriptions, messages, and counter-offers.</li>
            <li><strong>Transaction Data:</strong> Details about your rentals, payments (processed through third-party providers), and rental history.</li>
          </ul>

          <p>We also automatically collect certain information when you use our Services, such as your IP address, device information, and usage patterns.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our Services.</li>
            <li>Process your transactions and send related information.</li>
            <li>Verify your identity and manage your account.</li>
            <li>Communicate with you about products, services, offers, and events.</li>
            <li>Monitor and analyze trends, usage, and activities.</li>
            <li>Prevent fraud and enforce our Terms of Service.</li>
          </ul>

          <h2>3. Google API Services User Data Policy</h2>
          <p>
            Loql's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{color: '#2563eb', textDecoration: 'underline'}}>Google API Services User Data Policy</a>, including the Limited Use requirements.
          </p>

          <h2>4. How We Share Your Information</h2>
          <p>We may share your information as follows:</p>
          <ul>
            <li><strong>With Other Users:</strong> We share your profile information (like your name and community) and listings with other users to facilitate rentals.</li>
            <li><strong>With Service Providers:</strong> We share information with vendors who perform services on our behalf, such as payment processing and data analytics.</li>
            <li><strong>For Legal Reasons:</strong> We may disclose information if required by law or in response to legal requests.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, sale of company assets, or acquisition.</li>
          </ul>

          <h2>5. Your Choices</h2>
          <p>
            You can access and update your account information at any time through your profile settings. You may also request deletion of your account and personal data by contacting us at support@loql.in.
          </p>

          <h2>6. Data Security</h2>
          <p>
            We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
          </p>

          <h2>7. Changes to this Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you by updating the "Last Updated" date at the top of this Policy and, in some cases, providing additional notice (such as adding a statement to our homepage or sending an email notification).
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:support@loql.in" style={{color: '#2563eb', textDecoration: 'underline'}}>support@loql.in</a>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
