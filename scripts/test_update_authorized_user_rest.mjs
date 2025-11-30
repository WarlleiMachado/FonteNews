import fetch from 'node-fetch';
import fs from 'fs';

const apiKey = 'AIzaSyAWQz-_BDuMtGdGwS9KpAUZvC4_0kpjoAM';
const email = 'dudadapan@gmail.com';
const password = 'QnaB95PwbU4A1'; // senha temporária que geramos
const projectId = 'fontenews-877a3';
const docPath = `projects/${projectId}/databases/(default)/documents/authorizedUsers/TX81hye4NPnL55BaX8FZ`;

(async ()=>{
  try{
    // Sign in
    const signResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const signJson = await signResp.json();
    if(signJson.error){
      console.error('Sign-in failed', signJson);
      process.exit(1);
    }
    const idToken = signJson.idToken;
    console.log('Signed in, got idToken of length', idToken.length);

    // Prepare patch to set status to inactive
    const patchBody = {
      fields: {
        status: { stringValue: 'inactive' }
      }
    };

    const patchResp = await fetch(`https://firestore.googleapis.com/v1/${docPath}?updateMask.fieldPaths=status`, {
      method: 'PATCH', headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patchBody)
    });
    const patchJson = await patchResp.json();
    console.log('Patch response status:', patchResp.status);
    console.log(JSON.stringify(patchJson, null, 2));
  }catch(err){
    console.error('Error', err);
  }
})();
