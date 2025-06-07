/*
  # Esquema completo de Tutaviendo - WhatsApp Catalog Management

  1. Tablas principales
    - `users` - Usuarios del sistema con planes de suscripción
    - `stores` - Tiendas de cada usuario
    - `categories` - Categorías de productos por tienda
    - `products` - Productos de cada tienda
    - `analytics_events` - Eventos de analíticas (visitas, pedidos, etc.)
    - `user_preferences` - Preferencias y configuraciones de usuario

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas de acceso basadas en auth.uid()
    - Restricciones por plan de usuario

  3. Funciones
    - Triggers para validar límites por plan
    - Funciones para limpiar datos antiguos
*/

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para planes de usuario
CREATE TYPE user_plan AS ENUM ('gratuito', 'emprendedor', 'profesional');

-- Enum para estado de suscripción
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired');

-- Enum para tipos de eventos de analíticas
CREATE TYPE analytics_event_type AS ENUM ('visit', 'order', 'product_view');

-- Enum para modo de tema
CREATE TYPE theme_mode AS ENUM ('light', 'dark', 'system');

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  bio text,
  avatar text,
  company text,
  location text,
  plan user_plan DEFAULT 'gratuito',
  subscription_id text,
  subscription_status subscription_status,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  subscription_canceled_at timestamptz,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de tiendas
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo text,
  whatsapp text,
  currency text DEFAULT 'USD',
  
  -- Configuración de fuentes
  heading_font text DEFAULT 'Inter',
  body_font text DEFAULT 'Inter',
  
  -- Configuración de tema
  color_palette text DEFAULT 'predeterminado',
  theme_mode theme_mode DEFAULT 'light',
  border_radius integer DEFAULT 8,
  products_per_page integer DEFAULT 12,
  
  -- Redes sociales
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  twitter_url text,
  show_social_in_catalog boolean DEFAULT true,
  
  -- Métodos de pago
  accept_cash boolean DEFAULT true,
  accept_bank_transfer boolean DEFAULT false,
  bank_details text,
  
  -- Métodos de envío
  allow_pickup boolean DEFAULT true,
  allow_delivery boolean DEFAULT false,
  delivery_cost decimal(10,2) DEFAULT 0,
  delivery_zone text,
  
  -- Plantilla de mensaje WhatsApp
  message_greeting text DEFAULT '¡Hola {storeName}!',
  message_introduction text DEFAULT 'Soy {customerName}.\nMe gustaría hacer el siguiente pedido:',
  message_closing text DEFAULT '¡Muchas gracias!',
  include_phone_in_message boolean DEFAULT true,
  include_comments_in_message boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(store_id, name)
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  short_description text,
  long_description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  main_image text,
  gallery jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de eventos de analíticas
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  event_type analytics_event_type NOT NULL,
  session_id text,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  order_value decimal(10,2),
  customer_name text,
  order_items jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Tabla de preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  dark_mode_enabled boolean DEFAULT false,
  email_notifications boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  preferred_language text DEFAULT 'es',
  timezone text DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_id ON analytics_events(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para users
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Políticas de seguridad para stores
CREATE POLICY "Users can read own stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create stores"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stores"
  ON stores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read stores for catalog"
  ON stores
  FOR SELECT
  TO anon
  USING (true);

-- Políticas de seguridad para categories
CREATE POLICY "Users can manage categories of own stores"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = categories.store_id 
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read categories for catalog"
  ON categories
  FOR SELECT
  TO anon
  USING (true);

-- Políticas de seguridad para products
CREATE POLICY "Users can manage products of own stores"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = products.store_id 
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read active products for catalog"
  ON products
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Políticas de seguridad para analytics_events
CREATE POLICY "Users can read analytics of own stores"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = analytics_events.store_id 
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create analytics events"
  ON analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Políticas de seguridad para user_preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Función para obtener límites por plan
CREATE OR REPLACE FUNCTION get_plan_limits(plan_type user_plan)
RETURNS jsonb AS $$
BEGIN
  CASE plan_type
    WHEN 'gratuito' THEN
      RETURN jsonb_build_object(
        'max_stores', 1,
        'max_products_per_store', 10,
        'max_categories_per_store', 3
      );
    WHEN 'emprendedor' THEN
      RETURN jsonb_build_object(
        'max_stores', 2,
        'max_products_per_store', 30,
        'max_categories_per_store', -1
      );
    WHEN 'profesional' THEN
      RETURN jsonb_build_object(
        'max_stores', 5,
        'max_products_per_store', 50,
        'max_categories_per_store', -1
      );
    ELSE
      RETURN jsonb_build_object(
        'max_stores', 1,
        'max_products_per_store', 10,
        'max_categories_per_store', 3
      );
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Función para validar límites de tiendas
CREATE OR REPLACE FUNCTION validate_store_limit()
RETURNS trigger AS $$
DECLARE
  user_plan_type user_plan;
  current_store_count integer;
  max_stores integer;
BEGIN
  -- Obtener el plan del usuario
  SELECT plan INTO user_plan_type
  FROM users
  WHERE id = NEW.user_id;
  
  -- Contar tiendas actuales del usuario
  SELECT COUNT(*) INTO current_store_count
  FROM stores
  WHERE user_id = NEW.user_id;
  
  -- Obtener límite máximo
  SELECT (get_plan_limits(user_plan_type)->>'max_stores')::integer INTO max_stores;
  
  -- Validar límite
  IF current_store_count >= max_stores THEN
    RAISE EXCEPTION 'Has alcanzado el límite de tiendas para tu plan %', user_plan_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar límites de productos
CREATE OR REPLACE FUNCTION validate_product_limit()
RETURNS trigger AS $$
DECLARE
  user_plan_type user_plan;
  current_product_count integer;
  max_products integer;
BEGIN
  -- Obtener el plan del usuario propietario de la tienda
  SELECT u.plan INTO user_plan_type
  FROM users u
  JOIN stores s ON s.user_id = u.id
  WHERE s.id = NEW.store_id;
  
  -- Contar productos actuales de la tienda
  SELECT COUNT(*) INTO current_product_count
  FROM products
  WHERE store_id = NEW.store_id;
  
  -- Obtener límite máximo
  SELECT (get_plan_limits(user_plan_type)->>'max_products_per_store')::integer INTO max_products;
  
  -- Validar límite (-1 significa ilimitado)
  IF max_products > 0 AND current_product_count >= max_products THEN
    RAISE EXCEPTION 'Has alcanzado el límite de productos para tu plan %', user_plan_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar límites de categorías
CREATE OR REPLACE FUNCTION validate_category_limit()
RETURNS trigger AS $$
DECLARE
  user_plan_type user_plan;
  current_category_count integer;
  max_categories integer;
BEGIN
  -- Obtener el plan del usuario propietario de la tienda
  SELECT u.plan INTO user_plan_type
  FROM users u
  JOIN stores s ON s.user_id = u.id
  WHERE s.id = NEW.store_id;
  
  -- Contar categorías actuales de la tienda
  SELECT COUNT(*) INTO current_category_count
  FROM categories
  WHERE store_id = NEW.store_id;
  
  -- Obtener límite máximo
  SELECT (get_plan_limits(user_plan_type)->>'max_categories_per_store')::integer INTO max_categories;
  
  -- Validar límite (-1 significa ilimitado)
  IF max_categories > 0 AND current_category_count >= max_categories THEN
    RAISE EXCEPTION 'Has alcanzado el límite de categorías para tu plan %', user_plan_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para validar límites
CREATE TRIGGER validate_store_limit_trigger
  BEFORE INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION validate_store_limit();

CREATE TRIGGER validate_product_limit_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_limit();

CREATE TRIGGER validate_category_limit_trigger
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION validate_category_limit();

-- Función para limpiar eventos de analíticas antiguos
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para obtener estadísticas de usuario
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_stores', (
      SELECT COUNT(*) FROM stores WHERE user_id = user_uuid
    ),
    'total_products', (
      SELECT COUNT(*) 
      FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE s.user_id = user_uuid
    ),
    'total_categories', (
      SELECT COUNT(*) 
      FROM categories c
      JOIN stores s ON s.id = c.store_id
      WHERE s.user_id = user_uuid
    ),
    'total_visits_last_30_days', (
      SELECT COUNT(*) 
      FROM analytics_events ae
      JOIN stores s ON s.id = ae.store_id
      WHERE s.user_id = user_uuid
      AND ae.event_type = 'visit'
      AND ae.created_at >= NOW() - INTERVAL '30 days'
    ),
    'total_orders_last_30_days', (
      SELECT COUNT(*) 
      FROM analytics_events ae
      JOIN stores s ON s.id = ae.store_id
      WHERE s.user_id = user_uuid
      AND ae.event_type = 'order'
      AND ae.created_at >= NOW() - INTERVAL '30 days'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;