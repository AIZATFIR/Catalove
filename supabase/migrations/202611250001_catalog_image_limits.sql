-- Apply new upload limits to the dedicated Catalove bucket without changing its
-- visibility or policies. Existing public product images remain readable.
update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'catalove-product-images';
