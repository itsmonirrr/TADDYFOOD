-- TEDDYFOOD SUPABASE SQL SCHEMA
-- Copy and run these commands in the Supabase SQL Editor

-- 1. PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'owner', 'delivery', 'admin', 'manager', 'editor')),
  address TEXT,
  area TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  avatar_url TEXT,
  vehicle_type TEXT,
  national_id TEXT,
  delivery_area TEXT,
  restaurant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profiles" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profiles" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admins full access to profiles" 
  ON profiles FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  cuisine_type TEXT,
  address TEXT,
  area TEXT,
  phone TEXT,
  email TEXT,
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  delivery_time INTEGER DEFAULT 30,
  min_order DECIMAL(10,2) DEFAULT 100,
  delivery_fee DECIMAL(10,2) DEFAULT 30,
  is_open BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active restaurants" 
  ON restaurants FOR SELECT USING (true);

CREATE POLICY "Allow owners to manage their own restaurant" 
  ON restaurants FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Allow admins/managers to manage all restaurants" 
  ON restaurants FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 3. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to menu items" 
  ON menu_items FOR SELECT USING (true);

CREATE POLICY "Allow owners to manage their menu items" 
  ON menu_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins/managers/editors to manage menu items" 
  ON menu_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'editor')
    )
  );

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, -- e.g., 'TF-1001'
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_area TEXT,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_address TEXT,
  rider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rider_name TEXT,
  items JSONB NOT NULL, -- Array of items: [{ itemId, name, price, quantity, image }]
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('cod', 'bkash', 'card')),
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow customers to view their own orders" 
  ON orders FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Allow customers to insert their own orders" 
  ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);

CREATE POLICY "Allow owners to view/manage their restaurant orders" 
  ON orders FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Allow riders to view available and assigned orders" 
  ON orders FOR ALL USING (
    (rider_id = auth.uid()) OR (rider_id IS NULL AND status = 'confirmed')
  );

CREATE POLICY "Allow admins/managers/editors to manage all orders" 
  ON orders FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'editor')
    )
  );

-- 5. SAVED ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  label TEXT NOT NULL CHECK (label IN ('Home', 'Work', 'Other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own saved addresses" 
  ON saved_addresses FOR ALL USING (auth.uid() = customer_id);

-- 6. FAVOURITES TABLE
CREATE TABLE IF NOT EXISTS favourites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (customer_id, restaurant_id)
);

ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own favourites" 
  ON favourites FOR ALL USING (auth.uid() = customer_id);

-- 7. VOUCHERS TABLE
CREATE TABLE IF NOT EXISTS vouchers (
  code TEXT PRIMARY KEY,
  discount DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select access to vouchers" 
  ON vouchers FOR SELECT USING (true);

CREATE POLICY "Allow admins/managers to manage vouchers" 
  ON vouchers FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 8. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select access to app settings" 
  ON app_settings FOR SELECT USING (true);

CREATE POLICY "Allow admins/managers/editors to manage app settings" 
  ON app_settings FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'editor')
    )
  );

-- 9. ADMIN ACCOUNTS TABLE (Independent credentials for Admin Portal staff)
CREATE TABLE IF NOT EXISTS admin_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- Plaintext/hash for administrative dashboard
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'editor')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_accounts DISABLE ROW LEVEL SECURITY;

-- Enable Replication for Realtime order tracking
alter publication supabase_realtime add table orders;

-- 10. ADMIN PASSWORD RESET OTP TABLE
CREATE TABLE IF NOT EXISTS admin_otp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Disable Row Level Security (RLS) on admin_otp
ALTER TABLE admin_otp DISABLE ROW LEVEL SECURITY;


