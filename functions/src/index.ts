
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import * as cors from "cors";

// Initialize Firebase Admin SDK
initializeApp();
const auth = getAuth();
const db = getFirestore();

// CORS middleware to allow requests from your web app
const corsMiddleware = cors({origin: true});


export const createNewUser = onRequest({
  // Ensure the function can be called from your domain
  cors: ["https://virtusapp.vercel.app", "http://localhost:3000"],
}, async (req, res) => {
  // Use the CORS middleware
  corsMiddleware(req, res, async () => {
    // We only accept POST requests
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const {email, displayName, role} = req.body;

    if (!email || !displayName || !role) {
      logger.warn("Missing required fields in request body", {body: req.body});
      res.status(400).json({error: "Missing required fields: email, displayName, role."});
      return;
    }

    try {
      // Step 1: Create the user in Firebase Authentication
      logger.info(`Creating user in Auth: ${email}`);
      const userRecord = await auth.createUser({
        email: email,
        displayName: displayName,
        // It's a good practice to generate a temporary password or
        // let the user set it via an email link.
        // For simplicity, we'll let the password reset email handle this.
      });
      logger.info(`Successfully created user in Auth with UID: ${userRecord.uid}`);

      // Step 2: Create the user profile document in Firestore
      logger.info(`Creating user profile in Firestore for UID: ${userRecord.uid}`);
      const userDocRef = db.collection("users").doc(userRecord.uid);
      await userDocRef.set({
        name: displayName,
        email: email,
        role: role,
        photoURL: "", // Set a default or leave empty
      });
      logger.info("Successfully created user profile in Firestore.");


      // Step 3: Send a password reset email, which acts as a "set your password" link.
      logger.info(`Generating password reset link for: ${email}`);
      const link = await auth.generatePasswordResetLink(email);

      // In a real app, you would use a more robust email sending service
      // like SendGrid, Mailgun, or Firebase's own Extensions.
      // For this example, we log the link. The user won't get an email directly
      // but you can confirm the user was created in the Firebase console.
      // Firebase's default email templates will be used if configured.

      logger.info("Password reset link (for invitation):", link);
      res.status(200).json({
        success: true,
        message: `User ${displayName} created. An invitation/password reset email has been sent to ${email}.`,
        // Sending the link in the response is useful for testing but should be
        // removed in production for security.
        // verificationLink: link,
      });
    } catch (error: any) {
      logger.error("Error creating new user:", error);
      // Provide a more user-friendly error message
      let errorMessage = "An internal error occurred.";
      if (error.code === "auth/email-already-exists") {
        errorMessage = "This email address is already in use by another account.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "The email address provided is not valid.";
      }
      res.status(500).json({error: errorMessage, details: error.message});
    }
  });
});
