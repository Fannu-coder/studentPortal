import express from 'express';
import { createApp } from './server/app.js';

const app = createApp(express);

export default app;
