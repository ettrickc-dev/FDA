// POST /api/delete-my-data { confirm: "DELETE" }
// Immediately deletes the logged-in person's account and everything tied to it (spec Section 9).
import { deleteUserData } from './_lib/deletion.js';
import { handler, HttpError, json, readJson, requireUser } from './_lib/http.js';

export default handler('delete-my-data', async (req) => {
  if (req.method !== 'POST') throw new HttpError(405);
  const user = await requireUser(req);
  const { confirm } = await readJson(req, 256);
  if (confirm !== 'DELETE') throw new HttpError(400, 'Type DELETE to confirm.');
  await deleteUserData(user.id);
  return json({ ok: true });
});

export const config = { path: '/api/delete-my-data' };
