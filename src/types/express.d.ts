import { Request } from "express";

declare module "express" {
  interface Request {
    file?: Express.Multer.File;
  }
}
