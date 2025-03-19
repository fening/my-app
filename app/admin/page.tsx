import { phoneNumbers, airtimeTransactions } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

// Make this server component to fetch data server-side
export const dynamic = "force-dynamic"; // Disable caching for this page

async function AdminPage() {
  // Fetch data from database
  const allPhoneNumbers = await phoneNumbers.getAll();
  
  return (
    <div className="container mx-auto py-12 px-4 bg-white">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Phone Number Database
        </h1>
        <div className="bg-gray-100 rounded-md py-2 px-4 shadow-sm">
          <span className="font-bold">{allPhoneNumbers.length}</span>
          <span className="text-gray-500 ml-2">Total Records</span>
        </div>
      </div>
      
      <Card className="shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-2xl">Stored Phone Numbers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-6 font-medium text-gray-600 text-lg">ID</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600 text-lg">Phone Number</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600 text-lg">Created At</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600 text-lg">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allPhoneNumbers.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-5 px-6 text-base">{entry.id}</td>
                    <td className="py-5 px-6 text-base font-medium text-gray-900">{entry.phone_number}</td>
                    <td className="py-5 px-6 text-base">{new Date(entry.created_at).toLocaleString()}</td>
                    <td className="py-5 px-6 text-base">{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</td>
                  </tr>
                ))}
                {allPhoneNumbers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-lg text-gray-500">
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
