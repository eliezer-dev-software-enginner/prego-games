import { cookies } from 'next/headers';
import { adminAuth } from '../../config/firebase-admin';

export async function verifyAdmin() {
  const session = (await cookies()).get('session');
  if (!session) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(session.value);
    if (decoded.uid !== process.env.ADMIN_UID) return null;
    return decoded;
  } catch {
    return null;
  }
}
