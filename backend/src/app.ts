import "./bootstrap";
import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import bodyParser from 'body-parser';
import "./database";
import uploadConfig from "./config/upload";
import AppError from "./errors/AppError";
import routes from "./routes";
import { logger } from "./utils/logger";
import path from 'path';
import { messageQueue, sendScheduledMessages } from "./queues";
import {typeExport} from './uploads-flowbuilder'

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();

app.set("queues", {
  messageQueue,
  sendScheduledMessages
});
app.use(bodyParser.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
    // origin: 'http://192.168.1.12:3000',
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(Sentry.Handlers.requestHandler());
app.use("/public", express.static(uploadConfig.directory));
// app.use('/uploads', express.static('src/uploads'));
app.use('/uploads-flowbuilder', express.static(path.join(__dirname, '/uploads-flowbuilder')));
app.use(routes);

app.use(Sentry.Handlers.errorHandler());

app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
