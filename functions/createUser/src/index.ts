// functions/createUser/src/index.ts
import { Client, Users, ID, Account } from 'node-appwrite';

export default async ({ req, res, log, error }: any) => {
  // Step 0: Check for required Appwrite environment variables
  if (
    !process.env.APPWRITE_ENDPOINT ||
    !process.env.APPWRITE_PROJECT_ID ||
    !process.env.APPWRITE_API_KEY
  ) {
    error('Missing environment variables. Please set them in your Appwrite function settings.');
    return res.json({ ok: false, message: 'Server configuration error.' }, 500);
  }

  // Step 1: Check if the user is authenticated
  if (!req.headers['x-appwrite-user-jwt']) {
    error('Authentication failed. User JWT not found.');
    return res.json({ ok: false, message: 'Not authenticated.' }, 401);
  }

  try {
    // Step 2: Verify the role of the user calling the function
    const userClient = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT as string)
      .setProject(process.env.APPWRITE_PROJECT_ID as string)
      .setJWT(req.headers['x-appwrite-user-jwt']);

    const account = new Account(userClient);
    const callingUser = await account.get();
    const userPrefs = callingUser.prefs as { role?: string };

    const allowedRoles = ['quanlynhansu', 'admin'];
    if (!userPrefs.role || !allowedRoles.includes(userPrefs.role)) {
      error(`Permission denied. User ${callingUser.$id} with role '${userPrefs.role}' attempted to create a user.`);
      return res.json({ ok: false, message: 'Permission denied. You do not have rights to create a new user.' }, 403);
    }

    // Step 3: If role is correct, proceed to create the new user
    if (!req.body) {
      error('Request body is missing.');
      return res.json({ ok: false, message: "Missing body." }, 400);
    }

    const { email, password, name, phoneNumber, dateOfBirth } = req.body;

    if (!email || !password || !name || !phoneNumber || !dateOfBirth) {
      const message = "Missing required fields: email, password, name, phoneNumber, dateOfBirth.";
      error(message);
      return res.json({ ok: false, message }, 400);
    }

    // Initialize the Admin client to perform user creation
    const adminClient = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT as string)
      .setProject(process.env.APPWRITE_PROJECT_ID as string)
      .setKey(process.env.APPWRITE_API_KEY as string);

    const adminUsers = new Users(adminClient);

    // Create the new user
    const newUser = await adminUsers.create(
      ID.unique(),
      email,
      undefined, // phone
      password,
      name
    );

    log(`User ${callingUser.name} (${callingUser.$id}) created a new user: ${newUser.name} (${newUser.$id})`);

    // Update the new user's preferences
    const formattedPhoneNumber = `+84${phoneNumber.substring(1)}`;
    await adminUsers.updatePrefs(newUser.$id, {
      phone: formattedPhoneNumber,
      dateOfBirth: dateOfBirth,
      role: 'unassigned' // Default role for a new user
    });

    log(`Prefs updated for user: ${newUser.$id}`);

    return res.json({ ok: true, userId: newUser.$id });

  } catch (e: any) {
    error(e.message);
    return res.json({ ok: false, message: e.message }, 500);
  }
};
