import express from "express";
import dotenv from "dotenv"
import connectDB from "./db/connectDB";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoute from "./routes/user.route";
import restaurantRoute from "./routes/restaurant.route";
import menuRoute from "./routes/menu.route";
import orderRoute from "./routes/order.route";
import riderRoute from "./routes/rider.route";
import reviewRoute from "./routes/review.route";
import chatRoute from "./routes/chat.route";
import path from "path";
import http from "http";
import { initializeSocket } from "./utils/socket";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;

const DIRNAME = path.resolve();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json());
app.use(cookieParser());
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true
}
app.use(cors(corsOptions));
//api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/restaurant", restaurantRoute);
app.use("/api/v1/menu", menuRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/rider", riderRoute);
app.use("/api/v1/review", reviewRoute);
app.use("/api/v1/chat", chatRoute);

app.use(express.static(path.join(DIRNAME, "/Frontend/dist")));

app.use("*", (_, res) => {
    res.sendFile(path.resolve(DIRNAME, "Frontend", "dist", "index.html"));
});

const server = http.createServer(app);
initializeSocket(server);

server.listen(PORT, () => {
    console.log(`Server listen at port ${PORT}`);
    connectDB();
});