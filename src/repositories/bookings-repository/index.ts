import { prisma } from '@/config';

async function getBooking(userId: number) {
  return prisma.booking.findFirst({
    where: { userId },
    include: { Room: true },
  });
}

async function bookingByUser(userId: number, bookingId: number) {
  return prisma.booking.findFirst({
    where: { id: bookingId, userId },
  });
}

async function postBooking(userId: number, roomId: number) {
  return prisma.booking.create({ data: { userId, roomId } });
}

async function updateBooking(bookingId: number, roomId: number) {
  return prisma.booking.update({ where: { id: bookingId }, data: { roomId } });
}

const bookingRepository = {
  getBooking,
  bookingByUser,
  postBooking,
  updateBooking,
};

export default bookingRepository;
