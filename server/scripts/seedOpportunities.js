import 'dotenv/config';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Competition from '../models/Competition.js';

const projects = [
  { slug: 'campus-connect', title: 'Campus Connect', category: 'Full-stack Web Development', description: 'Build a friendly place for students to discover campus clubs, events, and people with shared interests.', skills: ['React', 'Node.js', 'MongoDB', 'UI design'], opportunities: 'Frontend, backend, and product design contributors' },
  { slug: 'study-buddy', title: 'Study Buddy', category: 'Artificial Intelligence', description: 'Prototype a study companion that helps learners organise notes and find a steady study rhythm.', skills: ['Python', 'LLM APIs', 'React', 'UX research'], opportunities: 'AI, frontend, and research contributors' },
  { slug: 'open-source-starter-kit', title: 'Open Source Starter Kit', category: 'Desktop Application Development', description: 'Create a clear, approachable desktop tool for first-time contributors to explore open source projects.', skills: ['JavaScript', 'Electron', 'Git', 'Documentation'], opportunities: 'Desktop, documentation, and community contributors' },
];

const competitions = [
  { slug: 'build-for-good', title: 'Build for Good Hackathon', description: 'Team up to make a small, useful digital tool that helps your community.', eligibility: 'Open to students of all experience levels. Teams of 1–4.', registrationDetails: 'Submit the form to register your interest. Selected participants will receive event details by email.', deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
  { slug: 'data-story-challenge', title: 'Data Story Challenge', description: 'Turn an open dataset into a short, thoughtful story with a clear visual.', eligibility: 'Open to beginner and intermediate data learners.', registrationDetails: 'Share a short note about the question you would like to explore.', deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000) },
];

if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI before seeding projects and competitions.');
await mongoose.connect(process.env.MONGODB_URI);
try {
  for (const project of projects) await Project.updateOne({ slug: project.slug }, { $setOnInsert: project }, { upsert: true });
  for (const competition of competitions) await Competition.updateOne({ slug: competition.slug }, { $setOnInsert: competition }, { upsert: true });
  console.log(`Seeded ${projects.length} projects and ${competitions.length} competitions (existing items were left unchanged).`);
} finally {
  await mongoose.disconnect();
}
