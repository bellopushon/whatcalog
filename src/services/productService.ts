import { supabase, handleSupabaseError, requireAuth } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export interface Product {
  id: string;
  storeId: string;
  categoryId?: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  mainImage?: string;
  gallery: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  storeId: string;
  categoryId?: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  mainImage?: string;
  gallery?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

class ProductService {
  async getStoreProducts(storeId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, 'obtener productos');
      }

      return data.map(this.mapProductData);
    } catch (error) {
      console.error('GetStoreProducts error:', error);
      throw error;
    }
  }

  async getActiveProducts(storeId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, 'obtener productos activos');
      }

      return data.map(this.mapProductData);
    } catch (error) {
      console.error('GetActiveProducts error:', error);
      throw error;
    }
  }

  async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Product not found
        }
        handleSupabaseError(error, 'obtener producto');
      }

      return this.mapProductData(data);
    } catch (error) {
      console.error('GetProductById error:', error);
      throw error;
    }
  }

  async createProduct(productData: CreateProductData): Promise<Product> {
    try {
      const user = await requireAuth();

      // Verificar que el usuario es propietario de la tienda
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('user_id')
        .eq('id', productData.storeId)
        .single();

      if (storeError || storeData.user_id !== user.id) {
        throw new Error('No tienes permisos para crear productos en esta tienda');
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          store_id: productData.storeId,
          category_id: productData.categoryId,
          name: productData.name,
          short_description: productData.shortDescription,
          long_description: productData.longDescription,
          price: productData.price,
          main_image: productData.mainImage,
          gallery: productData.gallery || [],
          is_active: productData.isActive ?? true,
          is_featured: productData.isFeatured ?? false,
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'crear producto');
      }

      return this.mapProductData(data);
    } catch (error) {
      console.error('CreateProduct error:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    try {
      const user = await requireAuth();

      // Verificar que el usuario es propietario de la tienda
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('store_id, stores!inner(user_id)')
        .eq('id', productId)
        .single();

      if (productError || (productData as any).stores.user_id !== user.id) {
        throw new Error('No tienes permisos para actualizar este producto');
      }

      // Mapear los datos de la aplicación al formato de la base de datos
      const dbUpdates: Partial<ProductUpdate> = {};
      
      if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.shortDescription !== undefined) dbUpdates.short_description = updates.shortDescription;
      if (updates.longDescription !== undefined) dbUpdates.long_description = updates.longDescription;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.mainImage !== undefined) dbUpdates.main_image = updates.mainImage;
      if (updates.gallery !== undefined) dbUpdates.gallery = updates.gallery;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;

      const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'actualizar producto');
      }

      return this.mapProductData(data);
    } catch (error) {
      console.error('UpdateProduct error:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      const user = await requireAuth();

      // Verificar que el usuario es propietario de la tienda
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('store_id, stores!inner(user_id)')
        .eq('id', productId)
        .single();

      if (productError || (productData as any).stores.user_id !== user.id) {
        throw new Error('No tienes permisos para eliminar este producto');
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        handleSupabaseError(error, 'eliminar producto');
      }
    } catch (error) {
      console.error('DeleteProduct error:', error);
      throw error;
    }
  }

  async getProductsByCategory(storeId: string, categoryId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, 'obtener productos por categoría');
      }

      return data.map(this.mapProductData);
    } catch (error) {
      console.error('GetProductsByCategory error:', error);
      throw error;
    }
  }

  async searchProducts(storeId: string, searchTerm: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .ilike('name', `%${searchTerm}%`)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, 'buscar productos');
      }

      return data.map(this.mapProductData);
    } catch (error) {
      console.error('SearchProducts error:', error);
      throw error;
    }
  }

  // Función para mapear datos de la base de datos al formato de la aplicación
  private mapProductData(productData: ProductRow): Product {
    return {
      id: productData.id,
      storeId: productData.store_id,
      categoryId: productData.category_id || undefined,
      name: productData.name,
      shortDescription: productData.short_description || undefined,
      longDescription: productData.long_description || undefined,
      price: Number(productData.price),
      mainImage: productData.main_image || undefined,
      gallery: Array.isArray(productData.gallery) ? productData.gallery as string[] : [],
      isActive: productData.is_active,
      isFeatured: productData.is_featured,
      createdAt: productData.created_at,
      updatedAt: productData.updated_at,
    };
  }
}

export const productService = new ProductService();