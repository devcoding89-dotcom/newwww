
'use client';

import {
  type Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function signUp(auth: Auth, data: any) {
  const { email, password, displayName } = data;
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await sendEmailVerification(user);
  await updateProfile(user, { displayName });

  const db = getFirestore(auth.app);
  const userDocRef = doc(db, 'users', user.uid);
  const profileData = {
    displayName,
    email,
    isAdmin: false,
    subscriptionTier: 'free',
    createdAt: new Date().toISOString()
  };
  
  try {
    await setDoc(userDocRef, profileData, { merge: true });
  } catch (firestoreError) {
    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'write',
      requestResourceData: profileData,
    });
    errorEmitter.emit('permission-error', permissionError);
    
    try {
      await deleteUser(user);
    } catch (deleteError) {
      console.error("Failed to roll back user creation after profile save failure:", deleteError);
    }

    throw new Error('Failed to save user profile. Your account was not created.');
  }

  return user;
}

export async function signIn(auth: Auth, data: any) {
  const { email, password } = data;
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signInWithGoogle(auth: Auth) {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  const db = getFirestore(auth.app);
  const userDocRef = doc(db, 'users', user.uid);
  const profileData = {
    displayName: user.displayName,
    email: user.email,
    subscriptionTier: 'free' // Default for new Google users
  };
  
  try {
    await setDoc(userDocRef, profileData, { merge: true });
  } catch (firestoreError) {
    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'write',
      requestResourceData: profileData,
    });
    errorEmitter.emit('permission-error', permissionError);

    await firebaseSignOut(auth);
    
    throw new Error('Failed to save user profile. Please try again.');
  }

  return user;
}

export async function signOut(auth: Auth) {
  await firebaseSignOut(auth);
}

export async function resetPassword(auth: Auth, email: string) {
  await sendPasswordResetEmail(auth, email);
}
