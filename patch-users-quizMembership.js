// patch-users-quizMembership.js
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // If you need a specific project, add: projectId: "your-project-id"
});

const db = admin.firestore();

async function patchUsers() {
  const usersSnapshot = await db.collection("users").get();

  const batch = db.batch();
  let patchedCount = 0;

  usersSnapshot.forEach((docSnap) => {
    const userData = docSnap.data();
    if (typeof userData.quizMembership === "undefined") {
      batch.update(docSnap.ref, { quizMembership: {} });
      patchedCount++;
    }
  });

  if (patchedCount > 0) {
    await batch.commit();
    console.log(`Patched ${patchedCount} user(s) with empty quizMembership.`);
  } else {
    console.log("All users already have quizMembership.");
  }
}

patchUsers().then(() => process.exit());
