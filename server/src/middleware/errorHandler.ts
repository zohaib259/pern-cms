import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction 
) => {
  logger.error(err.stack);

  res.status(500).json({
    message: err.message || "Internal server error",
  });
};

export default errorHandler;
