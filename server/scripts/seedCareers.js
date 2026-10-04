import 'dotenv/config';
import mongoose from 'mongoose';
import CareerField from '../models/CareerField.js';

const sampleResources = [
  { type: 'video', title: 'How the web works', description: 'Understand browsers, servers, and the journey between them.', duration: '18 min' },
  { type: 'guide', title: 'HTML & CSS foundations', description: 'Build a strong foundation in page structure and visual styles.', duration: '25 min' },
  { type: 'project', title: 'Your first responsive page', description: 'Practice by making a page that works across screen sizes.', duration: '45 min' },
];

const careers = [
  { slug: 'full-stack', name: 'Full-stack development', description: 'Build complete web experiences, from your first component to a live product.', category: 'Technology', tag: 'MOST POPULAR', icon: '◈', color: 'lilac', estimatedWeeks: 8 },
  { slug: 'data-science', name: 'Data science', description: 'Make sense of data with Python, visualisation and practical machine learning.', category: 'Technology', tag: 'IN DEMAND', icon: '⌘', color: 'peach', estimatedWeeks: 6 },
  { slug: 'cyber-security', name: 'Cyber security', description: 'Learn the principles and tools behind safer systems and networks.', category: 'Technology', tag: 'GROWING FAST', icon: '⬡', color: 'mint', estimatedWeeks: 7 },
  { slug: 'product-design', name: 'Product design', description: 'Turn thoughtful research and clear ideas into useful digital products.', category: 'Creative', tag: 'CREATIVE', icon: '✳', color: 'blue', estimatedWeeks: 5 },
];

if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI before seeding career paths.');
await mongoose.connect(process.env.MONGODB_URI);
try {
  for (const career of careers) {
    await CareerField.updateOne({ slug: career.slug }, {
      $setOnInsert: {
        ...career,
        phases: [
          { title: 'Get comfortable with the web', order: 1, duration: '2 WEEKS', resources: sampleResources },
          { title: 'Build with JavaScript', order: 2, duration: '3 WEEKS', resources: [
            { type: 'video', title: 'JavaScript fundamentals', description: 'Learn the building blocks of the language.', duration: '32 min' },
            { type: 'guide', title: 'Working with the DOM', description: 'Make web pages respond to user input.', duration: '20 min' },
            { type: 'project', title: 'Create an interactive dashboard', description: 'Bring your new skills together in a small project.', duration: '60 min' },
          ] },
          { title: 'Create full-stack apps', order: 3, duration: '3 WEEKS', resources: [
            { type: 'video', title: 'React, APIs & your first backend', description: 'Connect a user interface to server data.', duration: '40 min' },
            { type: 'guide', title: 'Databases made approachable', description: 'Learn how applications save and retrieve information.', duration: '25 min' },
            { type: 'project', title: 'Ship a project to your portfolio', description: 'Plan, build, and share a complete project.', duration: '2 hours' },
          ] },
        ],
      },
    }, { upsert: true });
  }
  console.log(`Seeded ${careers.length} career paths (existing paths were left unchanged).`);
} finally {
  await mongoose.disconnect();
}
