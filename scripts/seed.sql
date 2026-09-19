-- Clear existing tables cleanly
TRUNCATE TABLE order_items, orders, product_images, products, categories CASCADE;

-- Ensure columns exist if table was created previously
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric VARCHAR(100);

-- Insert Categories
INSERT INTO categories (name, slug) VALUES
  ('Abayas', 'abayas'),
  ('Hijabs', 'hijabs'),
  ('Dresses', 'dresses'),
  ('Bags', 'bags'),
  ('Daily Modest', 'daily-modest'),
  ('Evening Wear', 'evening-wear');

-- Insert Products & Product Images using CTE
WITH 
cat_abayas AS (SELECT id FROM categories WHERE slug = 'abayas'),
cat_hijabs AS (SELECT id FROM categories WHERE slug = 'hijabs'),
cat_dresses AS (SELECT id FROM categories WHERE slug = 'dresses'),
cat_bags AS (SELECT id FROM categories WHERE slug = 'bags'),
cat_daily AS (SELECT id FROM categories WHERE slug = 'daily-modest'),
cat_evening AS (SELECT id FROM categories WHERE slug = 'evening-wear'),

inserted_products AS (
  INSERT INTO products (category_id, name, description, price, stock, is_available, colors, sizes, fabric) VALUES
    -- 1
    ((SELECT id FROM cat_abayas), 'The Oasis Emerald', 'Signature Silk Blend abaya in vibrant emerald green. Fluid and elegant silhouette.', 24500, 15, true, ARRAY['Emerald Green', 'Onyx Black', 'Champagne'], ARRAY['XS', 'S', 'M', 'L', 'XL'], 'Fine Silk'),
    -- 2
    ((SELECT id FROM cat_daily), 'Sahara Structure', 'Premium Linen Essentials in beige / sand tone for everyday modest wear.', 18200, 20, true, ARRAY['Beige', 'Sand', 'Terracotta'], ARRAY['S', 'M', 'L', 'XL'], 'Premium Linen'),
    -- 3
    ((SELECT id FROM cat_daily), 'Rose Dawn', 'Crepe Georgette traditional drape in soft blush pink.', 16800, 18, true, ARRAY['Blush Pink', 'Dusty Rose', 'Ivory'], ARRAY['XS', 'S', 'M', 'L'], 'Fine Silk'),
    -- 4
    ((SELECT id FROM cat_evening), 'Midnight Velvet', 'Rich plush velvet in midnight blue designed for evening occasions.', 28000, 10, true, ARRAY['Midnight Blue', 'Deep Navy', 'Noir'], ARRAY['S', 'M', 'L', 'XL'], 'Velvet'),
    -- 5
    ((SELECT id FROM cat_dresses), 'Mist Wrap Dress', 'Flowing Georgette wrap dress in elegant light grey.', 19500, 12, true, ARRAY['Light Grey', 'Sage Green', 'Charcoal'], ARRAY['XS', 'S', 'M', 'L'], 'Fine Silk'),
    -- 6
    ((SELECT id FROM cat_abayas), 'Heritage White', 'Algerian Artisanal Embroidery on pristine white linen. Limited edition piece.', 22000, 8, true, ARRAY['Pristine White', 'Off-White'], ARRAY['S', 'M', 'L'], 'Premium Linen'),
    -- 7
    ((SELECT id FROM cat_abayas), 'Sahara Night Silk Abaya', 'Charcoal Silk luxury abaya with subtle gold threading.', 48000, 6, true, ARRAY['Charcoal', 'Gold Accent', 'Black'], ARRAY['S', 'M', 'L', 'XL'], 'Fine Silk'),
    -- 8
    ((SELECT id FROM cat_daily), 'Algiers Morning Linen', 'Pure Algerian Linen dress in gentle blush pink tone.', 32000, 14, true, ARRAY['Blush Pink', 'Natural Linen', 'Bone'], ARRAY['S', 'M', 'L'], 'Premium Linen'),
    -- 9
    ((SELECT id FROM cat_hijabs), 'The Rosewater Silk', 'Fine silk hijab in soft rosewater shade, lightweight and breathable.', 8500, 25, true, ARRAY['Rosewater', 'Pearl White', 'Pale Peach'], ARRAY['One Size'], 'Fine Silk'),
    -- 10
    ((SELECT id FROM cat_abayas), 'Noir Signature Abaya', 'Signature jet-black abaya with tailored finish and contemporary cut.', 24000, 12, true, ARRAY['Jet Black', 'Onyx'], ARRAY['XS', 'S', 'M', 'L', 'XL'], 'Fine Silk'),
    -- 11
    ((SELECT id FROM cat_dresses), 'Champagne Pleated Dress', 'Elegant champagne pleated dress designed for modest sophistication.', 19500, 10, true, ARRAY['Champagne', 'Warm Gold', 'Nude'], ARRAY['S', 'M', 'L'], 'Fine Silk'),
    -- 12
    ((SELECT id FROM cat_bags), 'Caramel Structural Bag', 'Premium structured leather bag in rich caramel tone with metallic accents.', 32000, 15, true, ARRAY['Caramel', 'Espresso', 'Tan'], ARRAY['One Size'], 'Leather'),
    -- 13
    ((SELECT id FROM cat_abayas), 'Midnight Silk Abaya', 'Crafted from 100% pure Mulberry silk, this piece embodies fluid elegance. Minimalist silhouette elevated by subtle tailoring.', 24500, 12, true, ARRAY['Midnight Black', 'Emerald', 'Champagne'], ARRAY['XS', 'S', 'M', 'L', 'XL'], 'Fine Silk'),
    -- 14
    ((SELECT id FROM cat_bags), 'Structured Top Handle', 'Handcrafted structured top-handle leather bag.', 32000, 8, true, ARRAY['Tan', 'Black', 'Burgundy'], ARRAY['One Size'], 'Leather'),
    -- 15
    ((SELECT id FROM cat_hijabs), 'Silk Chiffon Hijab', 'Ultra-soft silk chiffon scarf designed for effortless draping.', 8500, 30, true, ARRAY['Rosewater', 'Olive', 'Ivory', 'Noir'], ARRAY['One Size'], 'Fine Silk')
  RETURNING id, name, price
)

INSERT INTO product_images (product_id, url, is_primary, "order") VALUES
  -- 1: The Oasis Emerald
  ((SELECT id FROM inserted_products WHERE name = 'The Oasis Emerald'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxx-INYaf3GvQeh-YHKEznILiOe69Puc3ehR9OCj-lnPVOC0h9zoilyhAuJ9fgkIlOWyoqJknd2foS8QjXZPwzT8n7ZqdU6oDV-JZ0x8lGWaOCKgyEIR_oZVYjChxYvtzHfHQEl0NJnpFejEtSe9bXXp_-RZrZi0Bt6ZHRQE4QN1er-bg7zW7-ASrJfwQ6RrXl1Rh9X5Vw3vfCsh3ju2qG90MydrGYIZk25azDvQ7d267hKEu5D3IK', true, 0),

  -- 2: Sahara Structure
  ((SELECT id FROM inserted_products WHERE name = 'Sahara Structure'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Oa5sG3C9FDS_ZRZ_0WGUSzuJg_B4_cd61_wE5Au3evN6dkkE2mEiXCcFWd3-mwxeOjroQxK9ouFkQ1lFAxHhOElVWb4P9-wrdQ6UaNQhY_sQoxPtyn9lUhbZlwXI0m9hJcqr9FEa-YOTys6vix9QPNVuxcG0hiGPwBp4UZ0_DRb3NYHsd5w8Nj2coKj9Zj4FIge2_C9-KIYlLYJHX6LepNLu6onL1b22oJNjbwvrlJaRVdjAMoQk', true, 0),

  -- 3: Rose Dawn
  ((SELECT id FROM inserted_products WHERE name = 'Rose Dawn'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM2FXhYUdgVlxYf6kO7rOQcWXrBTADHy1Tx3zTrKqmmo8DqCiJ0xq_EHLhSw6iY0H1dUa3MS7Ee8Wr-lb99dhcl6sw7F8fB0EwlI89pQdkxUz3ap7_oljPXe0p6nGoSVGMyCG5dRIBBHEPoUrk9ag8YoRNhAYGjiEXa6M5ULLW35Mxo42jxTNLL3l8iZTRM9bAC9TksGglAR0EknexDCWSa9GL7lTYbBKD3wHbticWrGZQH16JU0fZ', true, 0),

  -- 4: Midnight Velvet
  ((SELECT id FROM inserted_products WHERE name = 'Midnight Velvet'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkU_NUp14KQmz_NJvRgz9iCO3U3acdjx3-EuNHXqxZ7gGt4NiALjAN_dnkdXTVMNc_5toMIew3YsVp2gtlOenhx53wT1EiGthoE_DygrNAo3TkNjNnt2buKsgvKrX-wvhkaZzRgdtv1L70oQyIlMtdQIPH49SoVcO55ClpaS4TduMn_H-X0n7BGngaVP13_FBCyD5OVa2Kaz7jvFzvyyvqGQzd5GJV0n9r3bHHjpBkbvIT0IkpHfgg', true, 0),

  -- 5: Mist Wrap Dress
  ((SELECT id FROM inserted_products WHERE name = 'Mist Wrap Dress'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuABXiJehIRyET95AvN8GOOKFEr7SYWQFwMUYv8QbpSrmMpaZdcbNpeIVOUMyPRehcKxD_IqMPBL-jzfnblcmMc_zINKZKQuVoz9Qj6VRndcyBBBjyRCwolHmLGwGlF-jwFR07-rNdR5BXukM0m3xt9iYmR6rP1uTbdqYIQNHWzlYE5MetKzL3rvRW5dNZVCWXjRR56TUAkTsOd8CLgQHY_8Ius2BXee1JMEwuYvJ2JauRKA_Bpjm3i7', true, 0),

  -- 6: Heritage White
  ((SELECT id FROM inserted_products WHERE name = 'Heritage White'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuB51mImGoQGyVukclyI8Mi1iFjAdE0xA3VExE_Edxaxx9FlIY6QP2CM9WvhVTJWJrPYZgNIF0DdtvdNjHVaJCWJy4S9LgrQSnysmN90eKrgco4dJYQO4V2Zvaxu4Lk1FiiK7Jb3KeWQUOcp-EQRwDsDjncXML42Xp9VFcB8ehABwm_yreVVz4Ip1nwVLIVGgRWNurP8LaDFV_6XFzX2zBHIaiy5tb3rC9xLslsBDX30y6XqJzf-2XFT', true, 0),

  -- 7: Sahara Night Silk Abaya
  ((SELECT id FROM inserted_products WHERE name = 'Sahara Night Silk Abaya'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYeV_tDfk25z70MI08UxOQB1d0FNzbiVV39Pvygho5u3fV32VkABCS3FEqIlhN_3D4YC7o6fCf8UYHx3HmBr7IOsWbNAgkrIIV8nQyT-meyhcficG1cIsMzjYrnOKyGf8iwbMrbNKqxqQMpYJwA0yheMD96iLKskItKt8AJ5p--3vTwOTW6YgalDXsaOWwVcy_3Sgg9zRr6_rlDhS6SXbZJuB6EZjmxFUf6jWYSfVtz1jXEQUsBWom', true, 0),

  -- 8: Algiers Morning Linen
  ((SELECT id FROM inserted_products WHERE name = 'Algiers Morning Linen'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQOR7ftHwsLm6TZfygYPAIS4WPzhrfKoa8Jd1mhfTVWP4nERgA_r7RMbQcu2h87xmLacgMV4We8cbA_S8MNQ_37cwi6z4y4mpLnNCl9MbAS0IwfbkI4AqAetL1KiZo9jecH6rle4DjSzWj51y2LEj_wqg0mHp1PLdYcWMdzB5k5RnmJyCvS_u03inc1ij5svQIh7QR6Sv1fLbUEIHmSNT_djLBgIEH0n9kDiZilD7o7I3T3VKfQAvX', true, 0),

  -- 9: The Rosewater Silk
  ((SELECT id FROM inserted_products WHERE name = 'The Rosewater Silk'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuCB_UFvZNcEiZ5cifm73sIeI0bBjoMa0u3Uu1WZPQs137ti-4iNDKg7rsQyqWqaC6-B87Xxj7zIL4bb39VwO3MEqYQH9CMnTi2Aj41lCaW5MDEzmKrbPER7pzZSjSvoxrwuq7uPPnigKk_C5PPM884ZgAMG_HQLiQuLqU434Lusfrxql6QI4wqwDUSUx5f6Ni9yU2mclfmmsGHfXWaL60HuoB2KTTWcruvkf4soHRRNM7y5IF75yxoN', true, 0),

  -- 10: Noir Signature Abaya
  ((SELECT id FROM inserted_products WHERE name = 'Noir Signature Abaya'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuCO63fjsvZRHx3VWfvDVSdEpD808acLgzhX2PB7Tbdvq3hhlAvTMKPqAd0WdX0YvLqIw0oMygkkPodn_d5h37lZkYP1HQnLuQami5lDkUY2RbTEqA-H-mrvgA796IVdrE4N0r9QGE2nGK__ugIMRmaz9tF6UXo784CQbaJB-NYSyA8YNPF7XWr8u3Jv9T8ACdonYxmPEOXhy-46mYTp17RC2AFX100F2BPsCGA11tSAfW0I9eIAxN-i', true, 0),

  -- 11: Champagne Pleated Dress
  ((SELECT id FROM inserted_products WHERE name = 'Champagne Pleated Dress'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHrYScDSP4vUIzoPXTkvBVsOnkF9E8WhXDEI-h0OM6jluxm7sL_WZJkdFh6Hs11CvYODnKsySE4Eij2FGbw8_rwwHtqG_WHmmJmkstD4cLkZphnqUnP05akiZNkroXY6kZzs2u6lZ_nVr8EER9mTmD0qyBJeDVocLnmDd4CChf2bALGsNP0_O-ZOA-SepZYWEdDJPb2-jlqaRL0tE2TJhz3aYKucXRJ6pS8iI0IBbdCSYFFoMYwjQK', true, 0),

  -- 12: Caramel Structural Bag
  ((SELECT id FROM inserted_products WHERE name = 'Caramel Structural Bag'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWyZHOHkbpgyBX4wmuxWwBLxpVuM1YVXs4wRfuFw_oIacF2ISCgJr4Oi9DRh-MMq0i8AftzCWv_2f4GyxUMhFxXUgYUBIWr5fQ_iwXJQpqkF8JcPbYXsgfaQg2JlOVWAURTl5IP_fEAl_EVe0CxvIB4tR9GxTITt5tvXZCfGurrCfWGQ-aqPYJoQxF6HNM2mclXYqmYU9j8egFTL_2gd5pTFaY7UXAMPbF66DHmaWADPb4lVaDfyhj', true, 0),

  -- 13: Midnight Silk Abaya (4 images)
  ((SELECT id FROM inserted_products WHERE name = 'Midnight Silk Abaya'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuANNFyy2xJQfuCigG0xguRmssrXTWRIUmJdNa4CNUYaxYQc1Mun9YNa9pxvLLUWcW61sKGpvuXPB-4gFSdH-CGl8au3qSx96C2iF-GJ_eX_wvJSB8GFu93Gde2WKuMbEjaTdTt3HMTYihudHCwDi6EpF_AJe60KRN3TkqRzHD5A5-Ftwd-s0ZQg1x-hghM1eGzYHncIWu4BhlgtUUsDrBFoBsz3b0YGpdh8jRytbhS97ueM80Km8ODp', true, 0),
  ((SELECT id FROM inserted_products WHERE name = 'Midnight Silk Abaya'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3mgFDw9RiY_3iynctWpYbGNzXi59govVLEPRS73RE_rYMN2CVSXjoI6rcGMzwUqqlsHgck35i-GDJOBvCqfPF4zlfk5HvX_kPknb6YgLb4sx9GxU0bDLPCgGeVdmincm-X4jp6QdlsjAZIz6GlVvEkkuOF8qkfD_gLAYx29dKIN-mGBWGjFY5ee1B3qyu5cCC0aNyo4jOK3Datt0lXxuuxIGRsa9q7CDQzbaVkBCRT8itlDwF-9ey', false, 1),
  ((SELECT id FROM inserted_products WHERE name = 'Midnight Silk Abaya'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8AZ83Xgpl7vApxAYXQ4BoW59P331KwHieEER7dqV-g5EUH1_fhDLYDtA6baMti0C0CnI7vNnSbjmlJtv2J9gDd3VdedV8U-XGTrHF463JiefkgkWGP7lMfjipGEpdSsToSjvFt2Zap-uviYrJbJtIrC-QowMvkU_lMFGAfFEB6X67dAK1mE7gbQAcQsUHdOVSTYvv1v8nqqOIhA4_rrwuxupJMsx-f_1E5CzbMcxGBhuqEQB0ly-S', false, 2),
  ((SELECT id FROM inserted_products WHERE name = 'Midnight Silk Abaya'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHvuslRKxTEcjHP6mbOlA7xQo8xOsbqfcfziQ2lQRIwzbxQLeDGgbHbViuseG3zDfMhRe2tEvjBSNkyu-2iD_skEbJua3mkAcLh-X5Iaer8b9BhIuXHlveQUjWLsUKCkfHXMexEh2TNp2vdcDu21suFSS0kwAUOu9VNNRaFjjC_4QIL-8RHtME0sq-RRh-vHOOwzEQX8Qg6Q2rjoDJ_8NepjbLIozHTT5_wHrvsres2-tkeX5UQoxN', false, 3),

  -- 14: Structured Top Handle
  ((SELECT id FROM inserted_products WHERE name = 'Structured Top Handle'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuD09VBx7HPCMduGGNywCWfTMDzb1_snkAvNtRiI9zOy2nkWLDJ_OtXPTLdCC_mnWUHdAuzfxrDkXkgCjP2QVzbPSw1Db5nZAqma8YbzpQJJK83Jxq1mBpjv626xq7wJJYeHWNG-wylKZJxlVfDvh6F2Y5C0ZfVXAXqcjFWRs7ttMOWQwkk-M9JpHl-lPIK22vJM_f4yyftR56_zEhYi4CP1nz7l_8CacwdFJEdEBQmH-Yc0j0gQr9Bx', true, 0),

  -- 15: Silk Chiffon Hijab
  ((SELECT id FROM inserted_products WHERE name = 'Silk Chiffon Hijab'), 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8Ro7k_F6wNNAemdksqMKBocjHA8pl0diJA2NSMqrmfouEmxqkDzIl-2bQXIiki1MbxxtcHY5XgHuMMCDK6UgIP-lLXtiW62SfYipwAinZWynXu174pCIgIK6QUiXqhNp8QZ9ur4qXTP6GGZWxH-AJG9EFjDwfs_DhuA_DY2IWmv8jiF-viAivVOks_OVliKqttVVKRXE67JJvHcLNbpPSMxLw8FIJCqsgr-KM8asFRELCKzcNRcAn', true, 0);

-- Populate Product Variants for all products so variant_id references work
INSERT INTO product_variants (product_id, color, size, stock)
SELECT 
  p.id,
  c.color,
  s.size,
  COALESCE(
    p.stock / NULLIF((SELECT COUNT(*) FROM unnest(p.colors) c2 CROSS JOIN unnest(p.sizes) s2), 0),
    0
  )
FROM products p
CROSS JOIN unnest(p.colors) AS c(color)
CROSS JOIN unnest(p.sizes) AS s(size)
WHERE cardinality(p.colors) > 0 AND cardinality(p.sizes) > 0
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Seed Orders
INSERT INTO orders (id, customer_name, customer_phone, customer_instagram, customer_address, wilaya, total_price, status, zvit_tracking_id, notes, created_at) VALUES
  (1, 'Amina Benali', '0550123456', '@amina_ben', 'Cité 500 Logements, Bâtiment B4, Hydra', 'Alger', 33000.00, 'pending', NULL, 'Appeler avant de livrer s''il vous plaît', NOW() - INTERVAL '1 hour'),
  (2, 'Meriem Khelifi', '0661234567', '@meriem.kh', '14 Rue Larbi Ben M''hidi', 'Oran', 49000.00, 'confirmed', 'ZV-ORN-8921', 'Paiement à la livraison', NOW() - INTERVAL '4 hours'),
  (3, 'Yasmine Bouzid', '0770345678', NULL, 'Cité Bellevue, Villa 12, Sidi Mabrouk', 'Constantine', 24500.00, 'shipped', 'ZV-CST-4412', 'Livraison à domicile express', NOW() - INTERVAL '1 day'),
  (4, 'Fatima Zohra Mansouri', '0560456789', '@fz_mansouri', 'Boulevard Colonel Amirouche', 'Tizi Ouzou', 26700.00, 'delivered', 'ZV-TZO-1102', 'Commande reçue avec soin', NOW() - INTERVAL '3 days'),
  (5, 'Khadidja Saidi', '0791567890', '@khadidja_s', 'Rue Khemisti Mohamed', 'Annaba', 19500.00, 'pending', NULL, 'Disponible après 16h', NOW() - INTERVAL '5 hours'),
  (6, 'Rania Touati', '0555678901', '@rania_style', 'Quartier Les Pins, Lot 8', 'Sétif', 48000.00, 'confirmed', 'ZV-STF-9934', 'Emballage cadeau souhaité', NOW() - INTERVAL '12 hours'),
  (7, 'Sarah Meziane', '0672789012', NULL, 'Cité 100 Logements, Akid Lotfi', 'Oran', 40500.00, 'delivered', 'ZV-ORN-7741', 'Livraison rapide merci', NOW() - INTERVAL '5 days'),
  (8, 'Imene Haddad', '0780890123', '@imene.hdd', 'Coopérative El Feth, Dely Ibrahim', 'Alger', 18200.00, 'cancelled', NULL, 'Annulée par la cliente (erreur de taille)', NOW() - INTERVAL '2 days'),
  (9, 'Nour El Houda Belkacem', '0540901234', '@nour_bh', 'Cité Sidi Rached, Bt 5', 'Blida', 56500.00, 'shipped', 'ZV-BLD-3329', 'Confirmer la réception le matin', NOW() - INTERVAL '1 day'),
  (10, 'Selma Cherif', '0659012345', '@selma_ch', 'Avenue du 1er Novembre', 'Batna', 32000.00, 'pending', NULL, NULL, NOW() - INTERVAL '8 hours'),
  (11, 'Lina Amrani', '0777123490', '@lina_amr', 'Hai Essalam, Tranche 3', 'Tlemcen', 37000.00, 'confirmed', 'ZV-TLM-5520', 'Livraison le week-end de préférence', NOW() - INTERVAL '16 hours'),
  (12, 'Ines Benaissa', '0561239874', NULL, 'Rue Didouche Mourad, Centre Ville', 'Alger', 25300.00, 'delivered', 'ZV-ALG-0081', 'Colis remis en mains propres', NOW() - INTERVAL '6 days'),
  (13, 'Chaima Meddah', '0663344556', '@chaima.modest', 'Cité 20 Août 1955', 'Béjaïa', 8500.00, 'pending', NULL, 'Premier achat sur la boutique', NOW() - INTERVAL '30 minutes'),
  (14, 'Houda Zerrouki', '0799887766', '@houda_zrk', 'Boulevard Pasteur', 'Mostaganem', 42700.00, 'shipped', 'ZV-MST-6638', 'Vérifier adresse exacte avant passage', NOW() - INTERVAL '2 days'),
  (15, 'Manel Larbi', '0554112233', '@manel.fashion', 'Cité Universitaire, Bab Ezzouar', 'Alger', 16800.00, 'cancelled', NULL, 'Cliente injoignable après 3 tentatives', NOW() - INTERVAL '4 days');

-- Reset orders sequence to match highest id
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- Seed Order Items
INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price) VALUES
  -- Order 1 (33,000 DZD)
  (1, (SELECT id FROM products WHERE name = 'The Oasis Emerald'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'The Oasis Emerald') AND color = 'Emerald Green' AND size = 'M' LIMIT 1), 1, 24500.00),
  (1, (SELECT id FROM products WHERE name = 'The Rosewater Silk'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'The Rosewater Silk') AND color = 'Rosewater' LIMIT 1), 1, 8500.00),

  -- Order 2 (49,000 DZD)
  (2, (SELECT id FROM products WHERE name = 'The Oasis Emerald'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'The Oasis Emerald') AND color = 'Onyx Black' AND size = 'L' LIMIT 1), 2, 24500.00),

  -- Order 3 (24,500 DZD)
  (3, (SELECT id FROM products WHERE name = 'Midnight Silk Abaya'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Midnight Silk Abaya') AND color = 'Midnight Black' AND size = 'S' LIMIT 1), 1, 24500.00),

  -- Order 4 (26,700 DZD)
  (4, (SELECT id FROM products WHERE name = 'Sahara Structure'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Sahara Structure') AND color = 'Sand' AND size = 'M' LIMIT 1), 1, 18200.00),
  (4, (SELECT id FROM products WHERE name = 'Silk Chiffon Hijab'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Silk Chiffon Hijab') AND color = 'Ivory' LIMIT 1), 1, 8500.00),

  -- Order 5 (19,500 DZD)
  (5, (SELECT id FROM products WHERE name = 'Mist Wrap Dress'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Mist Wrap Dress') AND color = 'Sage Green' AND size = 'M' LIMIT 1), 1, 19500.00),

  -- Order 6 (48,000 DZD)
  (6, (SELECT id FROM products WHERE name = 'Sahara Night Silk Abaya'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Sahara Night Silk Abaya') AND color = 'Charcoal' AND size = 'L' LIMIT 1), 1, 48000.00),

  -- Order 7 (40,500 DZD)
  (7, (SELECT id FROM products WHERE name = 'Caramel Structural Bag'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Caramel Structural Bag') AND color = 'Caramel' LIMIT 1), 1, 32000.00),
  (7, (SELECT id FROM products WHERE name = 'The Rosewater Silk'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'The Rosewater Silk') AND color = 'Pearl White' LIMIT 1), 1, 8500.00),

  -- Order 8 (18,200 DZD)
  (8, (SELECT id FROM products WHERE name = 'Sahara Structure'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Sahara Structure') AND color = 'Beige' AND size = 'S' LIMIT 1), 1, 18200.00),

  -- Order 9 (56,500 DZD)
  (9, (SELECT id FROM products WHERE name = 'Midnight Velvet'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Midnight Velvet') AND color = 'Midnight Blue' AND size = 'M' LIMIT 1), 1, 28000.00),
  (9, (SELECT id FROM products WHERE name = 'The Oasis Emerald'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'The Oasis Emerald') AND color = 'Champagne' AND size = 'S' LIMIT 1), 1, 24500.00),
  (9, (SELECT id FROM products WHERE name = 'Silk Chiffon Hijab'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Silk Chiffon Hijab') AND color = 'Rosewater' LIMIT 1), 1, 8500.00),

  -- Order 10 (32,000 DZD)
  (10, (SELECT id FROM products WHERE name = 'Algiers Morning Linen'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Algiers Morning Linen') AND color = 'Natural Linen' AND size = 'M' LIMIT 1), 1, 32000.00),

  -- Order 11 (37,000 DZD)
  (11, (SELECT id FROM products WHERE name = 'Structured Top Handle'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Structured Top Handle') AND color = 'Burgundy' LIMIT 1), 1, 32000.00),
  (11, (SELECT id FROM products WHERE name = 'Silk Chiffon Hijab'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Silk Chiffon Hijab') AND color = 'Olive' LIMIT 1), 1, 8500.00),

  -- Order 12 (25,300 DZD)
  (12, (SELECT id FROM products WHERE name = 'Rose Dawn'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Rose Dawn') AND color = 'Dusty Rose' AND size = 'S' LIMIT 1), 1, 16800.00),
  (12, (SELECT id FROM products WHERE name = 'The Rosewater Silk'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'The Rosewater Silk') AND color = 'Pale Peach' LIMIT 1), 1, 8500.00),

  -- Order 13 (8,500 DZD)
  (13, (SELECT id FROM products WHERE name = 'The Rosewater Silk'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'The Rosewater Silk') AND color = 'Rosewater' LIMIT 1), 1, 8500.00),

  -- Order 14 (42,700 DZD)
  (14, (SELECT id FROM products WHERE name = 'Noir Signature Abaya'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Noir Signature Abaya') AND color = 'Jet Black' AND size = 'L' LIMIT 1), 1, 24000.00),
  (14, (SELECT id FROM products WHERE name = 'Sahara Structure'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Sahara Structure') AND color = 'Terracotta' AND size = 'XL' LIMIT 1), 1, 18200.00),

  -- Order 15 (16,800 DZD)
  (15, (SELECT id FROM products WHERE name = 'Rose Dawn'), (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE name = 'Rose Dawn') AND color = 'Ivory' AND size = 'M' LIMIT 1), 1, 16800.00);
