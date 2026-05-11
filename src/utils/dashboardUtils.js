export const emptyMovieForm = {
  title: '', genre: '', language: '', theaterName: '', city: '',
  hall: '', format: '2D', showTime: '', ticketPrice: '', status: 'now_showing',
  posterUrl: '', tmdbId: '',
};

export const emptyServiceForm = { name: '', category: '', branch: '', price: '', status: 'active' };

export const movieBoardFilters = [
  { value: 'now_showing', label: 'Now Showing' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'paused', label: 'Paused' },
  { value: 'all', label: 'All' },
];

export function getErrorMessage(e) {
  if (!e) return 'Unexpected error.';
  if (typeof e === 'string') return e;
  return e.message || 'Unexpected error.';
}

export function getTodayLabel() {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
}

export function getViewTitle(v) {
  const map = { 
    dashboard: 'Dashboard', 
    movies: 'Movie Schedule', 
    services: 'Services', 
    users: 'App Users', 
    bookings: 'Bookings', 
    'seat-maps': 'Seat Maps', 
    database: 'Database' 
  };
  return map[v] || v;
}

export function matchesMovieBoardFilter(movie, filter) {
  if (filter === 'all') return true;
  if (filter === 'now_showing') {
    return ['now_showing', 'featured'].includes(movie.status) && movie.showtimeStatus !== 'cancelled';
  }
  if (filter === 'paused') {
    return movie.status === 'paused' || movie.showtimeStatus === 'cancelled';
  }
  return movie.status === filter;
}

export function getMoviesEmptyMessage(filter) {
  if (filter === 'now_showing') return 'No now showing movies in the schedule.';
  if (filter === 'upcoming') return 'No upcoming movies in the schedule.';
  if (filter === 'paused') return 'No paused movies in the schedule.';
  return 'No movies found in the schedule.';
}
