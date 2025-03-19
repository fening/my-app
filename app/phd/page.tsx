import { phoneNumbers, airtimeTransactions } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

// Make this server component to fetch data server-side
export const dynamic = "force-dynamic"; // Disable caching for this page

async function AdminPage() {
  // Fetch data from database
  const allPhoneNumbers = await phoneNumbers.getAll();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Phone Number Database</h1>
      
      <Card className="shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-gray-50">
          <CardTitle>Stored Phone Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-2 px-4 font-medium text-gray-600">ID</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Phone Number</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Created At</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allPhoneNumbers.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{entry.id}</td>
                    <td className="py-3 px-4">{entry.phone_number}</td>
                    <td className="py-3 px-4">{new Date(entry.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4">{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</td>
                  </tr>
                ))}
                {allPhoneNumbers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No phone numbers found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminPage;
