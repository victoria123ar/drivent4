import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
    createBookingWithRoomId,
    createTicketTypeRemote,
    createEnrollmentWithAddress,
    createHotel,
    createRoomWithHotelId,
    createTicket,
    createTicketTypeWithHotel,
    createUser,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app)

describe("GET /booking", () => {

    it("should respond with status 401 if no token is given", async () => {
        const response = await server.get("/booking");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("Token is valid", () => {

        it("should respond with 404 if user don't have an enrollment", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(404)

        })
        it("should respond with 404 if user don't have an ticket", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user);

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(404)

        })
        it("should respond with 404 if user doesn't have book", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(404)

        })

        it("should respond with 200 and body if valid information", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);
            const createdBooking = await createBookingWithRoomId(createdRoom.id, user.id)

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.body).toEqual(
                {
                    id: createdBooking.id,
                    Room: {
                        id: createdRoom.id,
                        name: createdRoom.name,
                        capacity: createdRoom.capacity,
                        hotelId: createdRoom.hotelId,
                        createdAt: createdRoom.createdAt.toISOString(),
                        updatedAt: createdRoom.updatedAt.toISOString()
                    }
                }
            )
            expect(response.status).toBe(200)


        })


    })
})


describe("Post /booking", () => {


    it("should respond with status 401 if no token is given", async () => {
        const response = await server.post("/booking");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    describe("Token is valid", () => {


        it("should respond with 404 if there isn't room", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 100 })

            expect(response.status).toBe(404)
        })
        it("should respond with 404 if user don't have an enrollment", async () => {


            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress();
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id })

            expect(response.status).toBe(404)

        })
        it("should respond with 404 if user don't have an ticket", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress();
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id })

            expect(response.status).toBe(404)

        })
        it("should respond with 403 if ticket is remote", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeRemote();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id })

            expect(response.status).toBe(403)
        })
        it("should respond with 403 if ticket is not PAID", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id })

            expect(response.status).toBe(403)
        })
        it("should respond with 200 and bookingId if data is correct", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id })


            expect(response.status).toBe(200)
            expect(response.body).toEqual({ bookingId:  response.body.bookingId})
        })
    })
})

describe("PUT /booking/:bookingId", () => {

    it("should respond with status 401 if no token is given", async () => {
        const response = await server.put(`/booking/${1}`).send({ roomId: 2 });

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await server.put(`/booking/${1}`).send({ roomId: 2 }).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.put(`/booking/${1}`).send({ roomId: 2 }).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("Token valid", () => {

        it("should respond with 404 if there isn't room", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)

            const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`).send({ roomId: 100 })

            expect(response.status).toBe(404)
        })
        it("should respond with 403 if there isn't booking", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);

            const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id })

            expect(response.status).toBe(403)
        })

        it("should change with there is valid room and booking", async () => {

            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);
            const createdRoom2 = await createRoomWithHotelId(createdHotel.id);
            const createdBooking = await createBookingWithRoomId(createdRoom.id, user.id)
            const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom2.id })

            console.log(response.body)

            expect(response.status).toBe(200)
            expect(response.body).toEqual({ bookingId: createdBooking.id })
        })


    })
})