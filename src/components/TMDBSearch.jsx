import { useState, useRef, useEffect } from 'react';
import { Search, X, Film, Star, Loader2, ImageOff } from 'lucide-react';

const TMDB_KEY   = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE  = 'https://api.themoviedb.org/3';
const IMG_BASE   = 'https://image.tmdb.org/t/p/w185';

// Map TMDB genre IDs → names
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

function resolveGenre(ids = []) {
  return ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 2).join(', ') || 'Unassigned';
}

async function searchTMDB(query) {
  const url = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  const data = await res.json();
  return data.results.slice(0, 8);
}

export function TMDBSearch({ onSelect }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [selected, setSelected] = useState(null);
  const debounceRef             = useRef(null);
  const inputRef                = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setError(''); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const movies = await searchTMDB(query);
        setResults(movies);
        if (!movies.length) setError('No movies found. Try a different title.');
      } catch (e) {
        setError(e.message || 'Search failed.');
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(movie) {
    const genre    = resolveGenre(movie.genre_ids);
    const year     = movie.release_date ? movie.release_date.slice(0, 4) : '';
    const language = movie.original_language?.toUpperCase() || '';

    setSelected(movie);
    setResults([]);
    setQuery(movie.title);

    // Map TMDB language codes to readable names
    const langMap = { en: 'English', si: 'Sinhala', ta: 'Tamil', hi: 'Hindi', fr: 'French', de: 'German', ja: 'Japanese', ko: 'Korean', zh: 'Chinese' };
    const langName = langMap[movie.original_language] || movie.original_language?.toUpperCase() || '';

    onSelect({ title: movie.title, genre, language: langName, year, posterPath: movie.poster_path, overview: movie.overview });
  }

  function handleClear() {
    setQuery(''); setResults([]); setSelected(null); setError('');
    onSelect({ title: '', genre: '', language: '' });
    inputRef.current?.focus();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.5rem 0.875rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--line-gold)',
          borderRadius: 'var(--radius)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
          onFocus={() => {}}
        >
          {loading
            ? <Loader2 size={16} style={{ color: 'var(--gold)', flexShrink: 0, animation: 'spin 0.8s linear infinite' }} />
            : <Search size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search TMDB — e.g. Avengers, Dune, Oppenheimer…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: '0.875rem', padding: 0,
            }}
          />
          {query && (
            <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', padding: 0, display: 'flex' }}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <X size={13} /> {error}
        </p>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '0.75rem',
          maxHeight: '320px',
          overflowY: 'auto',
          padding: '0.25rem',
        }}>
          {results.map(movie => (
            <MovieResultCard key={movie.id} movie={movie} onSelect={handleSelect} />
          ))}
        </div>
      )}

      {/* Selected movie preview */}
      {selected && !results.length && (
        <SelectedMoviePreview movie={selected} onClear={handleClear} />
      )}
    </div>
  );
}

function MovieResultCard({ movie, onSelect }) {
  const [imgError, setImgError] = useState(false);
  const year = movie.release_date?.slice(0, 4) || '—';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(movie)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 0,
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
        cursor: 'pointer', textAlign: 'left', padding: 0,
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--gold-glow)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Poster */}
      <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--surface-strong)', position: 'relative', overflow: 'hidden' }}>
        {movie.poster_path && !imgError ? (
          <img
            src={`${IMG_BASE}${movie.poster_path}`}
            alt={movie.title}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
            <ImageOff size={24} />
          </div>
        )}
        {rating && (
          <div style={{
            position: 'absolute', top: '0.375rem', right: '0.375rem',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            borderRadius: '4px', padding: '0.15rem 0.35rem',
            display: 'flex', alignItems: 'center', gap: '0.2rem',
            fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24',
          }}>
            <Star size={9} fill="#fbbf24" /> {rating}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.5rem 0.625rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: '0.15rem',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {movie.title}
        </p>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{year}</p>
      </div>
    </button>
  );
}

function SelectedMoviePreview({ movie, onClear }) {
  const [imgError, setImgError] = useState(false);
  const genre    = resolveGenre(movie.genre_ids);
  const year     = movie.release_date?.slice(0, 4) || '—';
  const rating   = movie.vote_average ? movie.vote_average.toFixed(1) : null;

  return (
    <div style={{
      display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
      padding: '0.875rem', background: 'var(--gold-dim)',
      border: '1px solid var(--line-gold)', borderRadius: 'var(--radius)',
    }}>
      {/* Poster thumb */}
      <div style={{ width: 56, flexShrink: 0, borderRadius: 6, overflow: 'hidden', aspectRatio: '2/3', background: 'var(--surface-strong)' }}>
        {movie.poster_path && !imgError ? (
          <img src={`${IMG_BASE}${movie.poster_path}`} alt={movie.title} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}><Film size={18} /></div>}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gold)' }}>{movie.title}</p>
          <button type="button" onClick={onClear} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', padding: 0, flexShrink: 0 }}><X size={14} /></button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{year}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{genre}</span>
          {rating && <span style={{ fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Star size={10} fill="#fbbf24" />{rating}</span>}
        </div>
        {movie.overview && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.375rem', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {movie.overview}
          </p>
        )}
        <p style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.375rem', fontWeight: 600 }}>
          ✓ Form auto-filled below
        </p>
      </div>
    </div>
  );
}
