import { Router } from "express";
import { getSubject, listSubjects } from "../controllers/subject.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const subjectRouter = Router();

subjectRouter.get("/", asyncHandler(listSubjects));
subjectRouter.get("/:id", asyncHandler(getSubject));
