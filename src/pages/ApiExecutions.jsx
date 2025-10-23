import React, { useState, useEffect } from 'react';
import { PledgeExecutionRecord } from '@/api/entities';
import { Loader2, ServerCrash } from 'lucide-react';

export default function ApiExecutions() {
  const [executions, setExecutions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        setIsLoading(true);
        const data = await PledgeExecutionRecord.list('-created_date');
        setExecutions(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch executions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExecutions();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
            <p className="text-lg font-medium text-gray-400">Fetching Executions...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ServerCrash className="w-10 h-10 mx-auto mb-3 text-red-500" />
            <p className="text-xl font-bold text-red-400">Failed to Fetch Data</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (!executions || executions.length === 0) {
      return <p className="text-gray-500">No execution records found in the database.</p>;
    }

    return (
      <pre className="text-sm whitespace-pre-wrap word-wrap break-word">
        <code>{JSON.stringify(executions, null, 2)}</code>
      </pre>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gray-900 text-green-400 min-h-screen font-mono">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 border-b border-gray-700 pb-3">/api/executions</h1>
      <div className="bg-black rounded-xl p-4 md:p-6 border border-gray-800 shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
}