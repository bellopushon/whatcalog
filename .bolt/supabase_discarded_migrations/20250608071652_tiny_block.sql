/*
  # Crear tabla de productos

  1. Nueva Tabla
    - `products`
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to stores)
      - `category_id` (uuid, foreign key to categories, nullable)
      - `name` (text, not null)
      - `short_description` (text, nullable)
      - `long_description` (text, nullable)
      - `price` (numeric, not null, >= 0)
      - `main_image` (text, nullable)
      - `gallery` (jsonb, default [])
      - `is_active` (boolean, default true)
      - `is_featured` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS en `products`
    - Políticas para que usuarios solo gestionen productos de sus tiendas
    - Política pública para lectura de productos activos

  3. Validaciones
    - Trigger para validar límites de productos por plan
    - Constraint para precio >= 0
    - Índices para optimizar consultas
*/

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  short_description text,
  long_description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  main_image text,
  gallery jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Políticas de seguridad
CREATE POLICY "Public can read active products for catalog"
  ON products
  FOR SELECT
  TO anon
  USING (is_active = true);

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

-- Función para validar límites de productos por plan
CREATE OR REPLACE FUNCTION validate_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan text;
  product_count integer;
  max_products integer;
BEGIN
  -- Obtener el plan del usuario
  SELECT users.plan INTO user_plan
  FROM users
  JOIN stores ON stores.user_id = users.id
  WHERE stores.id = NEW.store_id;

  -- Contar productos existentes en la tienda
  SELECT COUNT(*) INTO product_count
  FROM products
  WHERE store_id = NEW.store_id;

  -- Determinar límite según el plan
  CASE user_plan
    WHEN 'gratuito' THEN max_products := 10;
    WHEN 'emprendedor' THEN max_products := 30;
    WHEN 'profesional' THEN max_products := 50;
    ELSE max_products := 10; -- Default para casos no previstos
  END CASE;

  -- Validar límite
  IF product_count >= max_products THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % productos para tu plan %', max_products, user_plan;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar límites antes de insertar
CREATE TRIGGER validate_product_limit_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_limit();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en productos
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();