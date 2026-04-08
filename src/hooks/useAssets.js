import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// Hook to fetch all assets
export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*');
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
};

// Hook to update asset status with optimistic update
export const useUpdateAssetStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ asset_tag, status }) => {
      const { data, error } = await supabase
        .from('assets')
        .update({ status })
        .eq('asset_tag', asset_tag)
        .select();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onMutate: async (newAsset) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['assets'] });

      // Snapshot the previous value
      const previousAssets = queryClient.getQueryData(['assets']);

      // Optimistically update to the new value
      queryClient.setQueryData(['assets'], (old) =>
        old.map((asset) =>
          asset.asset_tag === newAsset.asset_tag ? { ...asset, ...newAsset } : asset
        )
      );

      // Return a context object with the snapshotted value
      return { previousAssets };
    },
    onError: (err, newAsset, context) => {
      // Rollback to the previous value on error
      queryClient.setQueryData(['assets'], context.previousAssets);
    },
    onSettled: () => {
      // Invalidate and refetch the assets query to get the fresh data from the server
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};
