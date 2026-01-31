import ItemCard from './ItemCard';
import { FEATURED_ITEMS } from '@/lib/data';

export default function Listings() {
  return (
    <section className="section container">
      <div style={{marginBottom: '2rem'}}>
         <h2 style={{fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem'}}>Rent Anything</h2>
         <p style={{color: 'var(--secondary)'}}>Discover items available in your neighborhood</p>
      </div>
      
      <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '24px'
      }}>
        {FEATURED_ITEMS.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
