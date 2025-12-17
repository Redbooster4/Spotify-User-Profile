import './ArtistCard.css';
import ChromaGrid from '../React-bits/ChromaGrid.jsx';

export default function ArtistCard({ artists }) {
    if (!artists.length || !artists) {
        return <p style={{ color: "white" }}>Loading artists...</p>;
    }
    const top5artists = artists.slice(0, 6)
        .map(artists => ({
            image: artists.images.find(img => img.width === 320)?.url ||
                artists.images[0]?.url,
            title: artists.name,
            url: artists.external_urls.spotify,
        }));

    return (
        <div className='artist-card'>
            <ChromaGrid
                items={top5artists}
                radius={999}
                damping={0.45}
                fadeOut={0.5}
                ease="power3.out"
            />
        </div>
    );
}