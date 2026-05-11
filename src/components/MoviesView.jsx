import { SectionPanel } from './UI.jsx';
import { MovieForm, MoviesTable } from './DataComponents.jsx';
import { TMDBSearch } from './TMDBSearch.jsx';

export function MoviesView({ 
  movieForm, setMovieForm, handleMovieSubmit, editingMovie, handleCancelEdit,
  movieBoardFilters, movieBoardFilter, setMovieBoardFilter,
  visibleMovies, handleMovieStatusChange, handleDeleteMovie, handleEditMovie,
  getMoviesEmptyMessage
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* TMDB Search */}
      <SectionPanel
        title="Search Movie from TMDB"
        description="Search a movie to auto-fill the form below — powered by The Movie Database."
      >
        <TMDBSearch
          onSelect={({ title, genre, language, posterPath, tmdbId }) =>
            setMovieForm(cur => ({
              ...cur,
              ...(title    ? { title }    : {}),
              ...(genre    ? { genre }    : {}),
              ...(language ? { language } : {}),
              ...(tmdbId   ? { tmdbId }   : {}),
              posterUrl: posterPath ? `https://image.tmdb.org/t/p/w342${posterPath}` : '',
            }))
          }
        />
      </SectionPanel>

      {/* Form + Schedule */}
      <div className="content-grid--wide" style={{ display: 'grid', gap: '1.25rem' }}>
        <SectionPanel 
          title={editingMovie ? "Edit Movie Schedule" : "Add Movie Schedule"} 
          description={editingMovie ? "Update the existing schedule details." : "Fill in the remaining details and save to Supabase."}
          highlight={!!editingMovie}
        >
          <MovieForm 
            form={movieForm} 
            onChange={setMovieForm} 
            onSubmit={handleMovieSubmit} 
            isEditing={!!editingMovie}
            onCancel={handleCancelEdit}
          />
        </SectionPanel>
        <SectionPanel
          title="Today's Schedule"
          description="Status-based movie board. A movie stays here on future days until the admin pauses or deletes it."
          action={(
            <div className="filter-chip-group" role="tablist" aria-label="Movie schedule filters">
              {movieBoardFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`filter-chip ${movieBoardFilter === filter.value ? 'filter-chip--active' : ''}`}
                  onClick={() => setMovieBoardFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        >
          <MoviesTable
            movies={visibleMovies}
            onStatusChange={handleMovieStatusChange}
            onDelete={handleDeleteMovie}
            onEdit={handleEditMovie}
            editingId={editingMovie?.id}
            emptyMessage={getMoviesEmptyMessage(movieBoardFilter)}
          />
        </SectionPanel>
      </div>
    </div>
  );
}
