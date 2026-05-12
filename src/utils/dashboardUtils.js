export const emptyMovieForm = {
  title: '', genre: '', language: '', theaterName: '', city: '',
  hall: '', format: '2D', showDate: '', showDateEnd: '', showTime: '', ticketPrice: '',
  posterUrl: '', tmdbId: '',
};

export const emptyServiceForm = { name: '', category: '', branch: '', price: '', status: 'active' };

export const movieBoardFilters = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
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

export function getMoviesEmptyMessage(filter) {
  if (filter === 'today') return 'No movies scheduled for today.';
  if (filter === 'upcoming') return 'No upcoming movies scheduled.';
  return 'No movies found in the schedule.';
}

export function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const todayDateStr = getLocalDateString();
