// Nightly retention job (Netlify Scheduled Function — not reachable by URL in production).
// 1. Marks cases whose access window ended as expired.
// 2. Marks abandoned checkouts (pending > 2 days) as failed.
// 3. Deletes draft/expired cases untouched for DRAFT_RETENTION_DAYS (skipped while that is a placeholder).
// 4. Deletes accounts inactive for DRAFT_RETENTION_DAYS that have no cases left.
// 5. Deletes uploaded documents past their delete_after date.
// Logs counts only — never personal data.
import { deleteCases, deleteUserData } from './_lib/deletion.js';
import { admin } from './_lib/http.js';

const days = (name) => {
  const n = Number(process.env[name]);
  return process.env[name] && Number.isInteger(n) && n > 0 ? n : null;
};

export async function runCleanup(now = new Date()) {
  const db = admin();
  const iso = (d) => d.toISOString();
  const counts = { expired: 0, abandoned: 0, casesDeleted: 0, usersDeleted: 0, uploadsDeleted: 0, skipped: [] };

  // 1. expire access
  const { data: ended } = await db.from('payments').select('case_id').eq('status', 'paid').lt('access_expires_at', iso(now));
  const endedIds = [...new Set((ended || []).map((p) => p.case_id).filter(Boolean))];
  if (endedIds.length) {
    const { data: stillPaid } = await db.from('payments').select('case_id').eq('status', 'paid').gte('access_expires_at', iso(now)).in('case_id', endedIds);
    const keep = new Set((stillPaid || []).map((p) => p.case_id));
    const toExpire = endedIds.filter((id) => !keep.has(id));
    if (toExpire.length) {
      await db.from('cases').update({ status: 'expired' }).in('id', toExpire).eq('status', 'paid');
      counts.expired = toExpire.length;
    }
  }

  // 2. abandoned checkouts
  const { data: abandoned } = await db.from('payments').update({ status: 'failed' })
    .eq('status', 'pending').lt('created_at', iso(new Date(now - 2 * 86400_000))).select('id');
  counts.abandoned = abandoned?.length || 0;

  // 3 + 4. inactivity
  const keepDays = days('DRAFT_RETENTION_DAYS');
  if (!keepDays) {
    counts.skipped.push('DRAFT_RETENTION_DAYS not set');
  } else {
    const cutoff = iso(new Date(now - keepDays * 86400_000));
    const { data: stale } = await db.from('cases').select('id').in('status', ['draft', 'expired']).lt('updated_at', cutoff);
    counts.casesDeleted = await deleteCases((stale || []).map((c) => c.id));

    const { data: idle } = await db.from('profiles').select('id').lt('last_active_at', cutoff);
    for (const u of idle || []) {
      const { count } = await db.from('cases').select('id', { count: 'exact', head: true }).eq('user_id', u.id);
      if ((count ?? 0) === 0) { await deleteUserData(u.id); counts.usersDeleted += 1; }
    }
  }

  // 5. uploads past their date
  const { data: oldUploads } = await db.from('uploads').select('id,storage_key').lt('delete_after', iso(now));
  if (oldUploads?.length) {
    try { await db.storage.from('uploads').remove(oldUploads.map((u) => u.storage_key).filter(Boolean)); } catch { /* no bucket yet */ }
    await db.from('uploads').delete().in('id', oldUploads.map((u) => u.id));
    counts.uploadsDeleted = oldUploads.length;
  }

  await db.from('audit_log').insert({ actor: null, action: 'cleanup.run', case_id: null });
  return counts;
}

export default async () => {
  try {
    const c = await runCleanup();
    console.log(`[cleanup] expired=${c.expired} abandoned=${c.abandoned} cases=${c.casesDeleted} users=${c.usersDeleted} uploads=${c.uploadsDeleted} ${c.skipped.join('; ')}`);
  } catch {
    console.error('[cleanup] failed');
  }
};

export const config = { schedule: '@daily' };
