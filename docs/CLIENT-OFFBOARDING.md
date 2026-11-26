# Manual client offboarding

Offboarding is an operator-run process for the initial managed-service pilot; the product currently has catalog export but no self-service store deletion. Do not promise instant deletion or claim a store was deleted until every step is complete.

1. Verify the request came from the store owner. Agree on the effective cancellation date and any order-retention/legal hold before deleting data.
2. Download the owner's JSON export from `/api/stores/export`. The export contains order/customer data and public image URLs; transfer it securely to the verified owner. If they need image files, download/copy those separately before cleanup.
3. Record the store ID and owner user IDs. Suspend public access first:

   ```sql
   update public.stores
   set status = 'suspended', updated_at = now()
   where slug = 'STORE_SLUG';
   ```

   Confirm exactly one row changed and that `/s/STORE_SLUG` is no longer public.
4. In Supabase Storage, open the `catalove-product-images` bucket and remove the folder `stores/STORE_UUID/`. If the store has legacy user-prefixed uploads, remove those owner's `users/USER_UUID/products/` objects too. The Storage dashboard/API must delete the files; do not delete rows directly from `storage.objects`.
5. After the retention period and the owner's export/media handoff are confirmed, run this SQL in Supabase SQL Editor. Replace the slug in the first line. It intentionally refuses to delete the seeded Catalove store.

   ```sql
   do $$
   declare
     target_store_slug text := 'STORE_SLUG';
     target_store_id uuid;
   begin
     if target_store_slug = 'catalove' then
       raise exception 'Refusing to delete the Catalove platform store';
     end if;

     select id into target_store_id
     from public.stores
     where slug = target_store_slug
     for update;

     if target_store_id is null then
       raise exception 'Store not found';
     end if;

     delete from public.order_request_items where store_id = target_store_id;
     delete from public.order_requests where store_id = target_store_id;
     delete from public.product_availability where store_id = target_store_id;
     delete from public.product_images where store_id = target_store_id;
     delete from public.product_variants where store_id = target_store_id;
     delete from public.products where store_id = target_store_id;
     delete from public.categories where store_id = target_store_id;
     delete from public.business_settings where store_id = target_store_id;
     delete from public.store_media_upload_reservations where store_id = target_store_id;
     delete from public.store_memberships where store_id = target_store_id;
     delete from public.stores where id = target_store_id;
   end $$;
   ```

6. If the owner has no remaining catalogs and requests account deletion, delete the Supabase Auth user through the Auth admin interface after confirming their identity. Do not remove a shared login if the membership model later permits multiple stores.
7. Verify the store no longer resolves, catalog tables have no rows for its ID, its Storage prefixes are empty, and export/media transfer was completed. Record completion time and store slug without retaining customer order details.

The current implementation still needs a scheduled stale-upload cleanup and a self-service cancellation/deletion workflow before large-scale open signup. Until then, review media quotas and process offboarding manually for each client.
