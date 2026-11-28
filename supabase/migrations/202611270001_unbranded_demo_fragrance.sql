-- Use original, unbranded artwork for the public showcase fragrance sample.
-- Limit the change to the seeded Catalove showcase and known stock-image URLs.
update public.product_images as image
set
  storage_path = case
    when image.storage_path like 'https://images.unsplash.com/photo-1594035910387-fea47794261f%' then '/demo-assets/fragrance-sample.svg'
    when image.storage_path like 'https://images.unsplash.com/photo-1523293182086-7651a899d37f%' then '/demo-assets/fragrance-detail.svg'
  end,
  alt_text = case
    when image.storage_path like 'https://images.unsplash.com/photo-1594035910387-fea47794261f%' then 'Sample parfum generik tanpa merek'
    when image.storage_path like 'https://images.unsplash.com/photo-1523293182086-7651a899d37f%' then 'Detail ilustrasi botol parfum generik'
  end
from public.products as product
join public.stores as store on store.id = product.store_id
where image.product_id = product.id
  and image.store_id = product.store_id
  and store.slug = 'catalove'
  and product.slug = 'sample-03-fragrance'
  and image.storage_path like any (array[
    'https://images.unsplash.com/photo-1594035910387-fea47794261f%',
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f%'
  ]);
