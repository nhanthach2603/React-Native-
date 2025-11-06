// functions/createUser/src/index.ts
import { Client, Users, ID } from 'node-appwrite';

export default async ({ req, res, log, error }: any) => {
  if (!req.body) {
    const message = "Missing body.";
    error(message);
    return res.json({ ok: false, message }, 400);
  }

  // Get the data from the request body
  const { email, password, name, phoneNumber, dateOfBirth } = req.body;

  // Validate the data
  if (!email || !password || !name || !phoneNumber || !dateOfBirth) {
    const message = "Missing required fields: email, password, name, phoneNumber, dateOfBirth.";
    error(message);
    return res.json({ ok: false, message }, 400);
  }

  // Initialize the Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT as string)
    .setProject(process.env.APPWRITE_PROJECT_ID as string)
    .setKey(process.env.APPWRITE_API_KEY as string);

  const users = new Users(client);

  try {
    // Create the user
    const user = await users.create(
      ID.unique(),
      email,
      undefined, // phone
      password,
      name
    );

    log(`User created: ${user.$id}`);

    // Update user preferences
    const formattedPhoneNumber = `+84${phoneNumber.substring(1)}`;
    await users.updatePrefs(user.$id, {
      phone: formattedPhoneNumber,
      dateOfBirth: dateOfBirth,
    });

    log(`Prefs updated for user: ${user.$id}`);

    return res.json({ ok: true, userId: user.$id });
  } catch (e: any) {
    error(e.message);
    return res.json({ ok: false, message: e.message }, 500);
  }
};