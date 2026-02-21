import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../legal.module.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | loql",
  description: "Terms of Service for loql",
};

export default function TermsOfService() {
  return (
    <main>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Last Updated: February 21, 2026</p>
        
        <div className={styles.content}>
          <p>
            Welcome to loql! These Terms of Service ("Terms") govern your use of the loql website, mobile application, and related services (collectively, the "Services") operated by loql ("we", "us", or "our").
          </p>
          <p>
            By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, do not use the Services.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            You must be at least 18 years old to use our Services. By creating an account, you represent and warrant that you are of legal age to form a binding contract and are not barred from receiving services under the laws of applicable jurisdictions.
          </p>

          <h2>2. Your Account</h2>
          <p>
            You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </p>

          <h2>3. The Services</h2>
          <p>
            Loql is a platform that allows users to rent items to and from others in their community. We do not own, sell, control, or manage any of the items listed on the Services, nor are we a party to the rental agreements between users.
          </p>

          <h2>4. User Responsibilities</h2>
          <ul>
            <li>You agree to use the Services only for lawful purposes.</li>
            <li>You must ensure that any items you list for rent are safe, legal, and accurately described.</li>
            <li>You agree to return rented items on time and in the condition they were received.</li>
            <li>You will not use the Services to distribute spam, malware, or abusive content.</li>
            <li>You will not attempt to bypass our security measures or scrape our data.</li>
          </ul>

          <h2>5. Fees and Payments</h2>
          <p>
            Certain services may require payment. You agree to pay all applicable fees and taxes. Payments are processed through third-party payment providers, and you are subject to their terms and conditions. We are not responsible for errors made by payment processors.
          </p>

          <h2>6. Content Ownership and License</h2>
          <p>
            You retain ownership of any content you submit to the Services. However, by providing content, you grant loql a non-exclusive, worldwide, royalty-free license to use, copy, modify, and display your content in connection with operating and promoting the Services.
          </p>

          <h2>7. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account and access to the Services at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to us, other users, or third parties.
          </p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>
            THE SERVICES ARE PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOQL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, ARISING OUT OF YOUR USE OF THE SERVICES OR ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES.
          </p>

          <h2>10. Dispute Resolution</h2>
          <p>
            Any disputes arising out of or relating to these Terms or the Services will be resolved through binding arbitration, rather than in court, except that you may assert claims in small claims court if your claims qualify.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. If we make material changes, we will notify you by updating the date at the top of these Terms and, in some cases, providing additional notice. Your continued use of the Services after the changes become effective constitutes your acceptance of the new Terms.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at: <a href="mailto:support@loql.in" style={{color: '#2563eb', textDecoration: 'underline'}}>support@loql.in</a>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
