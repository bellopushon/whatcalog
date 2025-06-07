import { supabase, handleSupabaseError, requireAuth } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export interface Category {
  id: string;
  storeId: string;
  name: string;
  createdAt: string;
}

export interface CreateCategoryData {
  storeId: string;
  name: string;
}

class CategoryService {
  async getStoreCategories(storeId: string): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('name', { ascending: true });

      if (error) {
        handleSupabaseError(error, 'obtener categorías');
      }

      return data.map(this.mapCategoryData);
    } catch (error) {
      console.error('GetStoreCategories error:', error);
      throw error;
    }
  }

  async getCategoryById(categoryId: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Category not found
        }
        handleSupabaseError(error, 'obtener categoría');
      }

      return this.mapCategoryData(data);
    } catch (error) {
      console.error('GetCategoryById error:', error);
      throw error;
    }
  }

  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    try {
      const user = await requireAuth();

      // Verificar que el usuario es propietario de la tienda
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('user_id')
        .eq('id', categoryData.storeId)
        .single();

      if (storeError || storeData.user_id !== user.id) {
        throw new Error('No tienes permisos para crear categorías en esta tienda');
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          store_id: categoryData.storeId,
          name: categoryData.name,
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'crear categoría');
      }

      return this.mapCategoryData(data);
    } catch (error) {
      console.error('CreateCategory error:', error);
      throw error;
    }
  }

  async updateCategory(categoryId: string, updates: { name: string }): Promise<Category> {
    try {
      const user = await requireAuth();

      // Verificar que el usuario es propietario de la tienda
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('store_id, stores!inner(user_id)')
        .eq('id', categoryId)
        .single();

      if (categoryError || (categoryData as any).stores.user_id !== user.id) {
        throw new Error('No tienes permisos para actualizar esta categoría');
      }

      const { data, error } = await supabase
        .from('categories')
        .update({ name: updates.name })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'actualizar categoría');
      }

      return this.mapCategoryData(data);
    } catch (error) {
      console.error('UpdateCategory error:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const user = await requireAuth();

      // Verificar que el usuario es propietario de la tienda
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('store_id, stores!inner(user_id)')
        .eq('id', categoryId)
        .single();

      if (categoryError || (categoryData as any).stores.user_id !== user.id) {
        throw new Error('No tienes permisos para eliminar esta categoría');
      }

      // Primero, actualizar productos que usan esta categoría
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      if (updateError) {
        handleSupabaseError(updateError, 'actualizar productos de la categoría');
      }

      // Luego, eliminar la categoría
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        handleSupabaseError(error, 'eliminar categoría');
      }
    } catch (error) {
      console.error('DeleteCategory error:', error);
      throw error;
    }
  }

  async getCategoryProductCount(categoryId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (error) {
        handleSupabaseError(error, 'contar productos de categoría');
      }

      return count || 0;
    } catch (error) {
      console.error('GetCategoryProductCount error:', error);
      throw error;
    }
  }

  // Función para mapear datos de la base de datos al formato de la aplicación
  private mapCategoryData(categoryData: CategoryRow): Category {
    return {
      id: categoryData.id,
      storeId: categoryData.store_id,
      name: categoryData.name,
      createdAt: categoryData.created_at,
    };
  }
}

export const categoryService = new CategoryService();