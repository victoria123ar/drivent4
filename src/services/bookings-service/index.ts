import { notFoundError, forbiddenError } from '@/errors';
import enrollmentRepository from '@/repositories/enrollment-repository';
import ticketsRepository from '@/repositories/tickets-repository';
import bookingRepository from '@/repositories/bookings-repository';
import roomRepository from '@/repositories/rooms-repository';

async function getBooking(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw notFoundError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw forbiddenError();

  const booking = await bookingRepository.getBooking(userId);
  if (!booking) throw notFoundError();

  const newBooking = {
    id: booking.id,
    Room: {
      id: booking.Room.id,
      name: booking.Room.name,
      capacity: booking.Room.capacity,
      hotelId: booking.Room.hotelId,
      createdAt: booking.Room.createdAt,
      updatedAt: booking.Room.updatedAt,
    },
  };
  return newBooking;
}

async function postBooking(userId: number, roomId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw notFoundError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw forbiddenError();
  if (ticket.status !== 'PAID') throw forbiddenError();

  const ticketType = await ticketsRepository.findTicketTypeById(ticket.ticketTypeId);

  const room = await roomRepository.getRoomById(roomId);
  if (ticketType.isRemote || !ticketType.includesHotel) throw forbiddenError();
  if (!room) throw notFoundError();
  if (room.Booking.length === room.capacity) throw forbiddenError();

  const booking = await bookingRepository.postBooking(userId, roomId);
  return booking;
}

async function updateBooking(userId: number, roomId: number, bookingId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw notFoundError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw forbiddenError();
  if (ticket.status !== 'PAID') throw forbiddenError();

  const ticketType = await ticketsRepository.findTicketTypeById(ticket.ticketTypeId);

  const room = await roomRepository.getRoomById(roomId);
  if (ticketType.isRemote || !ticketType.includesHotel) throw forbiddenError();
  if (!room) throw notFoundError();
  if (room.Booking.length === room.capacity) throw forbiddenError();

  const booking = await bookingRepository.getBooking(userId);
  if (!booking) throw forbiddenError();

  const bookingUser = await bookingRepository.bookingByUser(userId, bookingId);
  if (!bookingUser) throw forbiddenError();

  const newBooking = await bookingRepository.updateBooking(bookingId, roomId);
  return newBooking;
}

const bookingsService = {
  getBooking,
  postBooking,
  updateBooking,
};

export default bookingsService;
