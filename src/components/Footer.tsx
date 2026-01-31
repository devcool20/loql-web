import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '3rem 0',
      background: 'white'
    }}>
      <div className="container" style={{display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem'}}>
        <div>
           <div style={{fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
             <span style={{fontFamily: 'var(--font-outfit)'}}>loql</span>
           </div>
           <p style={{color: 'var(--secondary)', maxWidth: '300px'}}>
             SocietyShare is now loql. Renting simplified for communities.
           </p>
        </div>
        
        <div style={{display: 'flex', gap: '3rem'}}>
           <div>
             <h4 style={{fontWeight: 600, marginBottom: '1rem'}}>Company</h4>
             <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--secondary)'}}>
               <Link href="#">About</Link>
               <Link href="#">Careers</Link>
               <Link href="#">Blog</Link>
             </div>
           </div>
           <div>
             <h4 style={{fontWeight: 600, marginBottom: '1rem'}}>Support</h4>
             <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--secondary)'}}>
               <Link href="#">Help Center</Link>
               <Link href="#">Terms of Service</Link>
               <Link href="#">Privacy Policy</Link>
             </div>
           </div>
        </div>
      </div>
      <div className="container" style={{marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--muted)', color: 'var(--secondary-light)', fontSize: '0.875rem'}}>
        © {new Date().getFullYear()} loql. All rights reserved.
      </div>
    </footer>
  );
}
