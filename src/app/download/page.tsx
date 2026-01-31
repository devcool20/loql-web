import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Download, Smartphone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download loql - Android App",
  description: "Download the loql APK for Android.",
};

export default function DownloadPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '140px 20px 80px' }}>
        
        <div style={{
          width: '80px', 
          height: '80px', 
          background: 'var(--muted)', 
          borderRadius: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <Smartphone size={40} color="var(--primary)" />
        </div>

        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          Download <span style={{color: 'var(--accent)'}}>loql</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--secondary)', maxWidth: '500px', marginBottom: '3rem', lineHeight: 1.6 }}>
          Experience the new way of renting. Get the app on your Android device today.
        </p>
        
        <div style={{ 
          background: 'white', 
          padding: '2.5rem', 
          borderRadius: '32px', 
          border: '1px solid var(--border)', 
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '2rem',
          maxWidth: '400px',
          width: '100%'
        }}>
           <div style={{ 
             width: '200px', 
             height: '200px', 
             background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', 
             borderRadius: '16px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             color: 'white',
             fontSize: '0.875rem'
           }}>
              {/* QR Code Placeholder */}
              <div style={{textAlign: 'center', opacity: 0.7}}>
                QR Code<br/>Coming Soon
              </div>
           </div>
           
           <div style={{width: '100%'}}>
             <a href="/loql.apk" className="btn btn-primary" style={{width: '100%', height: '56px', fontSize: '1.125rem'}}>
               <Download size={24} style={{ marginRight: 12 }} />
               Download APK
             </a>
             <p style={{marginTop: '1rem', fontSize: '0.875rem', color: 'var(--secondary-light)'}}>
               Version 1.0.0 • 15 MB
             </p>
           </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
