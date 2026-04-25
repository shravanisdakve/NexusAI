const mongoose = require('mongoose');
const User = require('./backend/models/user');
require('dotenv').config({ path: './backend/.env' });

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find({ displayName: /Shravani/i });
    console.log('Found users:', JSON.stringify(users, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
