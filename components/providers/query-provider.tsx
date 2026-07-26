// QueryProvider for react query, providing a QueryClient to the application.
// This component wraps its children with the QueryClientProvider, allowing them to have access and use react query's features.
// The QueryClient is configured with default options, for queries, including stale time, gc time, refetch behavior, and retry attempts.

"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60 * 5, // 5 minutes
						gcTime: 1000 * 60 * 30, // 30 minutes
						refetchOnWindowFocus: false,
						retry: 1,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}
