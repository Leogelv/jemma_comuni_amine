'use client';

import { useQuery } from '@tanstack/react-query';

export interface UpsertUserPayload {
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

export function useUpsertTgUser(values: UpsertUserPayload) {
  return useQuery({
    queryKey: ['user', values.telegram_id],
    queryFn: async () => {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upsert user');
      }

      return response.json();
    },
    enabled: !!values.telegram_id,
  });
}
