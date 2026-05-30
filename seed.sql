-- CREATE ALL TABLES FIRST

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
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id),
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
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id),
  restaurant_id TEXT REFERENCES restaurants(id),
  delivery_boy_id UUID REFERENCES profiles(id),
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','on_the_way','delivered','cancelled')),
  payment_method TEXT CHECK (payment_method IN ('cash','bkash','card')),
  delivery_address TEXT,
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id),
  label TEXT CHECK (label IN ('Home','Work','Other')),
  address TEXT NOT NULL,
  area TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favourites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id),
  restaurant_id TEXT REFERENCES restaurants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, restaurant_id)
);

CREATE TABLE IF NOT EXISTS vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount DECIMAL(10,2),
  description TEXT,
  min_order DECIMAL(10,2),
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','manager','editor')),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  delivery_boy_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','picked_up','on_the_way','delivered')),
  assigned_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
);