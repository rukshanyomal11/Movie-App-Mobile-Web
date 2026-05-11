import { supabase } from './supabaseClient';

const todayDate = getLocalDateString();

export async function signInAdmin({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export function subscribeToAuthChanges(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return subscription;
}

export async function loadAdminProfile(user) {
  let profile = await getProfileByAuthId(user.id);

  if (!profile && user.email) {
    profile = await getProfileByEmail(user.email);
  }

  if (!profile) {
    throw new Error(
      'No app_users record found for this account. Add the same email to app_users and set role = admin.',
    );
  }

  if (profile.role !== 'admin' || profile.status !== 'active') {
    throw new Error('Only active admin accounts can open this dashboard.');
  }

  const now = new Date().toISOString();
  const payload = {
    last_login_at: now,
  };

  if (!profile.auth_user_id) {
    payload.auth_user_id = user.id;
  }

  // Best-effort update — if RLS blocks it, we still allow login using the
  // profile data already fetched above.
  const { error: updateError } = await supabase
    .from('app_users')
    .update(payload)
    .eq('id', profile.id);

  if (updateError) {
    console.warn('Could not update admin profile fields:', updateError.message);
  }

  return mapAdminProfile({ ...profile, ...payload });
}

export async function fetchDashboardData() {
  const [showtimesResult, servicesResult, usersResult, bookingsResult] = await Promise.all([
    supabase
      .from('showtimes')
      .select(
        `
          id,
          show_date,
          start_time,
          ticket_price,
          seats_available,
          status,
          movie:movies!showtimes_movie_id_fkey (
            id,
            title,
            genre,
            language,
            status,
            poster_url
          ),
          screen:screens!showtimes_screen_id_fkey (
            id,
            name,
            format,
            theater:theaters!screens_theater_id_fkey (
              id,
              name,
              city
            )
          )
        `,
      )
      .order('show_date', { ascending: false })
      .order('start_time'),
    supabase
      .from('services')
      .select('id, name, category, branch, price, status, created_at, updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('app_users')
      .select('id, full_name, email, role, status, created_at, last_login_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select(
        `
          id,
          user_id,
          showtime_id,
          booking_code,
          seats_count,
          total_amount,
          payment_status,
          booking_status,
          booked_at,
          user:app_users!bookings_user_id_fkey (
            id,
            full_name,
            email
          ),
          showtime:showtimes!bookings_showtime_id_fkey (
            id,
            show_date,
            start_time,
            movie:movies!showtimes_movie_id_fkey (
              id,
              title
            ),
            screen:screens!showtimes_screen_id_fkey (
              id,
              name,
              theater:theaters!screens_theater_id_fkey (
                id,
                name
              )
            )
          ),
          seats:booking_seats (
            seat_label
          )
        `,
      )
      .order('booked_at', { ascending: false }),
  ]);

  throwIfError(showtimesResult.error);
  throwIfError(servicesResult.error);
  throwIfError(usersResult.error);
  throwIfError(bookingsResult.error);

  const bookings = mapBookings(bookingsResult.data ?? []);
  const movies = mapMovies(showtimesResult.data ?? [], bookingsResult.data ?? []);
  const services = mapServices(servicesResult.data ?? []);
  const users = mapUsers(usersResult.data ?? [], bookingsResult.data ?? []);

  return {
    movies,
    services,
    users,
    bookings,
  };
}

export async function createMovieSchedule(form, adminProfileId) {
  const theaterId = await ensureTheater(form.theaterName, form.city);
  const screenId = await ensureScreen(theaterId, form.hall, form.format);

  const { data: movie, error: movieError } = await supabase
    .from('movies')
    .insert({
      title: form.title,
      genre: form.genre,
      language: form.language,
      status: form.status,
      poster_url: form.posterUrl || null,
      tmdb_id: form.tmdbId || null,
      created_by: adminProfileId,
    })
    .select('id, title')
    .single();

  throwIfError(movieError);

  const { error: showtimeError } = await supabase.from('showtimes').insert({
    movie_id: movie.id,
    screen_id: screenId,
    show_date: todayDate,
    start_time: form.showTime,
    ticket_price: Number(form.ticketPrice),
    seats_available: 120,
    status: 'scheduled',
  });

  throwIfError(showtimeError);

  await writeAuditLog(adminProfileId, 'movie', movie.id, 'create', `Created ${movie.title}`);
}

export async function updateMovieSchedule(showtimeId, movieId, form, adminProfileId) {
  const theaterId = await ensureTheater(form.theaterName, form.city);
  const screenId = await ensureScreen(theaterId, form.hall, form.format);

  // Update movie
  const { error: movieError } = await supabase
    .from('movies')
    .update({
      title: form.title,
      genre: form.genre,
      language: form.language,
      status: form.status,
      poster_url: form.posterUrl || null,
      tmdb_id: form.tmdbId || null,
    })
    .eq('id', movieId);

  throwIfError(movieError);

  // Update showtime
  const { error: showtimeError } = await supabase
    .from('showtimes')
    .update({
      screen_id: screenId,
      start_time: form.showTime,
      ticket_price: Number(form.ticketPrice),
    })
    .eq('id', showtimeId);

  throwIfError(showtimeError);

  await writeAuditLog(adminProfileId, 'movie', movieId, 'update', `Updated ${form.title}`);
}

export async function updateMovieStatus(movieId, nextStatus, adminProfileId) {
  const { error } = await supabase
    .from('movies')
    .update({ status: nextStatus })
    .eq('id', movieId);

  throwIfError(error);
  await writeAuditLog(adminProfileId, 'movie', movieId, 'status_update', nextStatus);
}

export async function deleteMovieSchedule(showtimeId, movieId, movieTitle, adminProfileId) {
  // Delete showtime first (child of movie via foreign key)
  const { error: stError } = await supabase
    .from('showtimes')
    .delete()
    .eq('id', showtimeId);

  throwIfError(stError);

  // Delete the movie record
  const { error: mvError } = await supabase
    .from('movies')
    .delete()
    .eq('id', movieId);

  throwIfError(mvError);

  await writeAuditLog(adminProfileId, 'movie', movieId, 'delete', `Deleted ${movieTitle}`);
}

export async function createService(form, adminProfileId) {
  const { data, error } = await supabase
    .from('services')
    .insert({
      name: form.name,
      category: form.category,
      branch: form.branch,
      price: Number(form.price),
      status: form.status,
      created_by: adminProfileId,
    })
    .select('id, name')
    .single();

  throwIfError(error);
  await writeAuditLog(adminProfileId, 'service', data.id, 'create', `Created ${data.name}`);
}

export async function updateServiceStatus(serviceId, nextStatus, adminProfileId) {
  const { error } = await supabase
    .from('services')
    .update({ status: nextStatus })
    .eq('id', serviceId);

  throwIfError(error);
  await writeAuditLog(adminProfileId, 'service', serviceId, 'status_update', nextStatus);
}

function throwIfError(error) {
  if (error) {
    throw error;
  }
}

async function getProfileByAuthId(authUserId) {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, auth_user_id, role, full_name, email, status, last_login_at, created_at')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  throwIfError(error);
  return data;
}

async function getProfileByEmail(email) {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, auth_user_id, role, full_name, email, status, last_login_at, created_at')
    .eq('email', email)
    .maybeSingle();

  throwIfError(error);
  return data;
}

async function ensureTheater(theaterName, city) {
  const { data: existingTheaters, error: fetchError } = await supabase
    .from('theaters')
    .select('id')
    .eq('name', theaterName)
    .eq('city', city)
    .limit(1);

  throwIfError(fetchError);

  if (existingTheaters?.length) {
    return existingTheaters[0].id;
  }

  const { data, error } = await supabase
    .from('theaters')
    .insert({
      name: theaterName,
      city,
      status: 'active',
    })
    .select('id')
    .single();

  throwIfError(error);
  return data.id;
}

async function ensureScreen(theaterId, hallName, format) {
  const { data: existingScreens, error: fetchError } = await supabase
    .from('screens')
    .select('id')
    .eq('theater_id', theaterId)
    .eq('name', hallName)
    .limit(1);

  throwIfError(fetchError);

  if (existingScreens?.length) {
    return existingScreens[0].id;
  }

  const { data, error } = await supabase
    .from('screens')
    .insert({
      theater_id: theaterId,
      name: hallName,
      seat_capacity: 120,
      format,
    })
    .select('id')
    .single();

  throwIfError(error);
  return data.id;
}

async function writeAuditLog(adminProfileId, entityType, entityId, actionType, note) {
  const { error } = await supabase.from('admin_audit_logs').insert({
    admin_user_id: adminProfileId,
    entity_type: entityType,
    entity_id: entityId,
    action_type: actionType,
    note,
  });

  if (error) {
    console.warn('Audit log write failed:', error.message);
  }
}

function mapAdminProfile(row) {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    role: row.role,
    name: row.full_name,
    email: row.email,
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  };
}

function mapMovies(showtimes, bookings) {
  const soldSeatsByShowtime = new Map();

  for (const booking of bookings) {
    if (
      !booking.showtime_id ||
      booking.booking_status === 'cancelled' ||
      booking.payment_status === 'refunded'
    ) {
      continue;
    }

    soldSeatsByShowtime.set(
      booking.showtime_id,
      (soldSeatsByShowtime.get(booking.showtime_id) ?? 0) + booking.seats_count,
    );
  }

  return showtimes
    .map((row) => ({
      id: row.id,
      movieId: row.movie?.id ?? '',
      title: row.movie?.title ?? 'Untitled',
      genre: row.movie?.genre ?? 'Unassigned',
      language: row.movie?.language ?? 'Unassigned',
      posterUrl: row.movie?.poster_url ?? '',
      showDate: formatDate(row.show_date),
      showDateValue: row.show_date ?? '',
      showTime: formatTime(row.start_time),
      showTimeValue: row.start_time ?? '',
      hall: row.screen?.name ?? 'Unassigned hall',
      branch: row.screen?.theater?.name ?? 'Unassigned theater',
      city: row.screen?.theater?.city ?? 'Unassigned city',
      format: row.screen?.format ?? '2D',
      ticketPrice: Number(row.ticket_price ?? 0),
      seatsLeft: Number(row.seats_available ?? 0),
      ticketsSold: soldSeatsByShowtime.get(row.id) ?? 0,
      status: row.movie?.status ?? 'upcoming',
      showtimeStatus: row.status ?? 'scheduled',
    }))
    .sort(sortMoviesForAdminBoard);
}

function sortMoviesForAdminBoard(a, b) {
  const statusOrder = {
    now_showing: 0,
    featured: 1,
    upcoming: 2,
    paused: 3,
  };

  const statusDiff =
    (statusOrder[a.status] ?? Number.MAX_SAFE_INTEGER) -
    (statusOrder[b.status] ?? Number.MAX_SAFE_INTEGER);

  if (statusDiff !== 0) {
    return statusDiff;
  }

  if (a.showDateValue !== b.showDateValue) {
    return b.showDateValue.localeCompare(a.showDateValue);
  }

  return a.showTimeValue.localeCompare(b.showTimeValue);
}

function mapServices(rows) {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    branch: row.branch,
    price: Number(row.price ?? 0),
    status: row.status,
    updatedAt: formatDateTime(row.updated_at ?? row.created_at),
  }));
}

function mapUsers(rows, bookings) {
  const bookingsByUser = new Map();

  for (const booking of bookings) {
    if (!booking.user_id) {
      continue;
    }

    bookingsByUser.set(booking.user_id, (bookingsByUser.get(booking.user_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    email: row.email,
    joinedAt: formatDate(row.created_at),
    lastSeen: row.last_login_at ? formatDateTime(row.last_login_at) : 'Never',
    bookingsCount: bookingsByUser.get(row.id) ?? 0,
    status: row.status,
  }));
}

function mapBookings(rows) {
  return rows.map((row) => ({
    id: row.id,
    userId: row.user?.id ?? '',
    showtimeId: row.showtime?.id ?? '',
    code: row.booking_code,
    userName: row.user?.full_name ?? 'Unknown user',
    movieTitle: row.showtime?.movie?.title ?? 'Unknown movie',
    seats:
      row.seats?.length > 0
        ? row.seats.map((seat) => seat.seat_label).join(', ')
        : `${row.seats_count} seat(s)`,
    total: Number(row.total_amount ?? 0),
    paymentStatus: row.payment_status,
    bookingStatus: row.booking_status,
    bookedAt: formatDateTime(row.booked_at),
  }));
}

function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value.includes('T') ? value : `${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) {
    return 'Unknown';
  }

  const [hours = '0', minutes = '0'] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
