// functions/createUser/src/index.ts
import { Client, Users, ID } from 'node-appwrite';

// This is your Appwrite function
// It's executed each time we get a request
export default async ({ req, res, log, error }: any) => {
  // Why not try to parse the body?
  if (!req.body) {
    const message = "Missing body.";
    error(message);
    return res.json({ ok: false, message }, 400);
  }

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    const message = "Missing required fields: email, password, name.";
    error(message);
    return res.json({ ok: false, message }, 400);
  }

  // Initialization
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT as string)
    .setProject(process.env.APPWRITE_PROJECT_ID as string)
    .setKey(process.env.APPWRITE_API_KEY as string);

  const users = new Users(client);

  try {
    // Create user
    const user = await users.create(
      ID.unique(),
      email,
      undefined, // phone
      password,
      name
    );

    log(`User created: ${user.$id}`);

    // You can do more things here, like adding the user to a team
    // or setting preferences.

    return res.json({ ok: true, userId: user.$id });
  } catch (e: any) {
    error(e.message);
    return res.json({ ok: false, message: e.message }, 500);
  }
};
