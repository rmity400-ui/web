const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK to communicate with Authentication and Firestore services
admin.initializeApp();

/**
 * Cloud Function: deleteUserAuth
 * HTTPS Callable function to safely delete a user's Firebase Authentication account
 * This function is protected and can only be executed by administrators.
 */
exports.deleteUserAuth = functions.https.onCall(async (data, context) => {
  // 1. Verify that the request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called with proper authentication.'
    );
  }

  // 2. Validate that the caller possesses Admin privileges (using email or custom claims)
  const callerEmail = context.auth.token.email;
  const isAdmin = callerEmail === 'mit@gmail.com';

  if (!isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only verified administrators are allowed to delete accounts.'
    );
  }

  const targetUid = data.uid;
  if (!targetUid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be provided with a valid target user UID.'
    );
  }

  try {
    // 3. Delete the target user account securely from Firebase Authentication
    await admin.auth().deleteUser(targetUid);
    
    
    // Log success message in Cloud Logs
    console.log(`Successfully deleted auth record for user ID: ${targetUid}`);
    return { success: true, message: `Successfully deleted user authentication account for ${targetUid}.` };
  } catch (error) {
    console.error(`Error deleting user auth: ${error.message}`);
    throw new functions.https.HttpsError('internal', `Failed to delete authentication account: ${error.message}`);
  }
});
