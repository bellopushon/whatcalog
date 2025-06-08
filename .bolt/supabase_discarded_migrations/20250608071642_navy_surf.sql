/*
  # Crear tabla de categorías

  1. Nueva Tabla
    - `categories`
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to stores)
      - `name` (text, not null)
      - `created_at` (timestamp)

  2. Seguridad
    - Enable RLS en `categories`
    - Políticas para que usuarios solo gestionen categorías de sus tiendas
    - Política pública para lectura (catálogos públicos)

  3. Validaciones
    - Trigger para validar límites de categorías por plan
    - Índices para optimizar consultas
*/

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Constraint para evitar categorías duplicadas en la misma tienda
  UNIQUE(store_id, name)
);

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- Políticas de seguridad
CREATE POLICY "Public can read categories for catalog"
  ON categories
  FOR SELECT
  TO anon
  USING (true);

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

-- Función para validar límites de categorías por plan
CREATE OR REPLACE FUNCTION validate_category_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan text;
  category_count integer;
  max_categories integer;
BEGIN
  -- Obtener el plan del usuario
  SELECT users.plan INTO user_plan
  FROM users
  JOIN stores ON stores.user_id = users.id
  WHERE stores.id = NEW.store_id;

  -- Contar categorías existentes en la tienda
  SELECT COUNT(*) INTO category_count
  FROM categories
  WHERE store_id = NEW.store_id;

  -- Determinar límite según el plan
  CASE user_plan
    WHEN 'gratuito' THEN max_categories := 3;
    WHEN 'emprendedor' THEN max_categories := 999999; -- Ilimitadas
    WHEN 'profesional' THEN max_categories := 999999; -- Ilimitadas
    ELSE max_categories := 3; -- Default para casos no previstos
  END CASE;

  -- Validar límite
  IF category_count >= max_categories THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % categorías para tu plan %', max_categories, user_plan;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar límites antes de insertar
CREATE TRIGGER validate_category_limit_trigger
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION validate_category_limit();