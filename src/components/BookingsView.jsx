import { SectionPanel, SelectField } from './UI.jsx';
import { BookingsTable } from './DataComponents.jsx';

export function BookingsView({ 
  bookingDate, setBookingDate, availableBookingDates,
  bookingMovieTitle, setBookingMovieTitle, availableBookingMovies,
  bookingShowtimeId, setBookingShowtimeId, availableBookingShowtimes,
  filteredBookings
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <SectionPanel title="Filter Bookings" description="Narrow down bookings by date, movie, and venue.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          <SelectField
            id="b-date"
            label="1. Select Date"
            value={bookingDate}
            onChange={setBookingDate}
            options={availableBookingDates}
            placeholder="-- All Dates --"
          />
          <SelectField
            id="b-movie"
            label="2. Select Movie"
            value={bookingMovieTitle}
            onChange={setBookingMovieTitle}
            options={availableBookingMovies}
            disabled={!bookingDate}
            placeholder={bookingDate ? "-- All Movies --" : "-- Select date first --"}
          />
          <SelectField
            id="b-showtime"
            label="3. Select Location/Hall"
            value={bookingShowtimeId}
            onChange={setBookingShowtimeId}
            options={availableBookingShowtimes}
            disabled={!bookingMovieTitle}
            placeholder={bookingMovieTitle ? "-- All Showtimes --" : "-- Select movie first --"}
          />
        </div>
      </SectionPanel>

      <SectionPanel 
        title={bookingShowtimeId ? "Filtered Bookings" : "All Bookings"} 
        description={bookingShowtimeId ? "Showing bookings for the selected screening." : "Live booking and seat data from Supabase."}
      >
        <BookingsTable bookings={filteredBookings} />
      </SectionPanel>
    </div>
  );
}
