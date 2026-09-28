// Vercel entry: Express runs as a Vercel Function, so export the app instead of listening.
// Vercel detects this file because it imports express directly.
import express from "express";
import { configureApp } from "./createApp";

export default configureApp(express());
