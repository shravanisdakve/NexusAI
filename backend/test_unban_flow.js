const mongoose = require('mongoose');
const User = require('./models/user');

async function runTest() {
  console.log("=== STARTING UNBAN ROUNDTRIP TEST ===\n");
  
  await mongoose.connect('mongodb+srv://nexusai:nexusai@cluster0.ifojd9.mongodb.net/nexusai?retryWrites=true&w=majority');
  
  const testEmail = 'test_qa@nexus.ai';
  const testPassword = 'Password123!';
  
  // 1. Initial Login
  console.log("[1] Testing initial login...");
  let res = await fetch('http://127.0.0.1:3002/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: testEmail, password: testPassword})
  });
  let data = await res.json();
  if (!data.success) throw new Error("Initial login failed");
  console.log("    ✅ Success! JWT Issued.\n");

  // 2. Ban User via DB (Simulating Admin Action)
  console.log("[2] Admin banning user...");
  await User.findOneAndUpdate({ email: testEmail }, { status: 'banned' });
  console.log("    ✅ User status set to 'banned'\n");

  // 3. Try Login again (Should Fail 403)
  console.log("[3] Testing login as BANNED user...");
  res = await fetch('http://127.0.0.1:3002/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: testEmail, password: testPassword})
  });
  data = await res.json();
  if (res.status === 403) {
    console.log("    ✅ Successfully blocked! (403 Forbidden):", data.message, "\n");
  } else {
    throw new Error("Failed to block banned user. Status was: " + res.status);
  }

  // 4. UNBAN User via DB
  console.log("[4] Admin UNBANNING user...");
  await User.findOneAndUpdate({ email: testEmail }, { status: 'active' });
  console.log("    ✅ User status set to 'active'\n");

  // 5. Try Login again (Should Pass 200)
  console.log("[5] Testing login as UNBANNED user...");
  res = await fetch('http://127.0.0.1:3002/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: testEmail, password: testPassword})
  });
  data = await res.json();
  if (res.status === 200 && data.success) {
    console.log("    ✅ Successfully restored! JWT Issued again.\n");
  } else {
    throw new Error("Failed to restore UNBANNED user. Status was: " + res.status);
  }

  console.log("=== UNBAN ROUNDTRIP TEST PASSED 🎉 ===");
  mongoose.disconnect();
}

runTest().catch(e => {
  console.error("Test failed:", e);
  mongoose.disconnect();
});
