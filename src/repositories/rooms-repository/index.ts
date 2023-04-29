import { prisma } from "@/config";

async function getRoomById(roomId: number){
    return prisma.room.findUnique({
        where: {id: roomId}, include: {Booking: true}
    });
}

const roomRepository = {
    getRoomById,
}

export default roomRepository;