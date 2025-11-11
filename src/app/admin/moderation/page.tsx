import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function ModerationPage() {
  const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Signalements</h1>
      <table className="w-full text-sm border">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Submission</th>
            <th className="p-2 text-left">Kind</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.id}</td>
              <td className="p-2">{r.submissionId}</td>
              <td className="p-2">{r.kind}</td>
              <td className="p-2">{r.status}</td>
              <td className="p-2">
                <form action={`/api/admin/moderation/${r.id}`} method="post" className="flex gap-2">
                  <input type="hidden" name="action" value="RESOLVED" />
                  <button className="px-2 py-1 text-xs rounded bg-emerald-600 text-white">Resolve</button>
                </form>
                <form action={`/api/admin/moderation/${r.id}`} method="post" className="mt-1">
                  <input type="hidden" name="action" value="REJECTED" />
                  <button className="px-2 py-1 text-xs rounded bg-red-600 text-white">Reject</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


