import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <AlertCircle size={64} className="text-red-500" />
          </div>
          <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6">
            This service is only available to users who have completed our survey.
          </p>
          <p className="text-sm text-gray-500">
            Please return to the survey and follow the link provided after completion.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            To access directly, you need a valid token parameter.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
