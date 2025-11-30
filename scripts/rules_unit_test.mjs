import fs from 'fs';
import path from 'path';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

const PROJECT_ID = 'fontenews-877a3';

(async () => {
  // Load rules
  const rules = fs.readFileSync(path.resolve('./firestore.rules'), 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules }
  });

  // Create an authenticated context for a user with UID 'NVwtRvafRsXTU7DHdmKlvpJQJGr1'
  const uid = 'NVwtRvafRsXTU7DHdmKlvpJQJGr1';
  const authContext = testEnv.authenticatedContext(uid);
  const db = authContext.firestore();

  // Case: correct authorFirebaseUid
  const okDocRef = db.collection('announcements').doc('unit-test-correct');
  await assertSucceeds(okDocRef.set({ title: 'ok', content: 'ok', createdAt: new Date(), authorFirebaseUid: uid }));
  console.log('PASS: create with correct authorFirebaseUid succeeded (expected)');

  // Case: wrong authorFirebaseUid
  const badDocRef = db.collection('announcements').doc('unit-test-wrong');
  await assertFails(badDocRef.set({ title: 'bad', content: 'bad', createdAt: new Date(), authorFirebaseUid: 'WRONG-UID' }));
  console.log('PASS: create with wrong authorFirebaseUid was denied (expected)');

  // Case: missing authorFirebaseUid
  const missDocRef = db.collection('announcements').doc('unit-test-missing');
  await assertFails(missDocRef.set({ title: 'miss', content: 'miss', createdAt: new Date() }));
  console.log('PASS: create missing authorFirebaseUid was denied (expected)');

  await testEnv.cleanup();
  process.exit(0);
})().catch(err => { console.error('Rule unit test failed:', err); process.exit(1); });
