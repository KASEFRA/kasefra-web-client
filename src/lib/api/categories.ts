/**
 * Categories API module
 */

import { apiClient } from './client'
import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoryListResponse,
} from '@/types'

export const categoriesApi = {
  /**
   * Get all categories for the current user
   */
  async getAll(): Promise<CategoryListResponse> {
    const response = await apiClient.get<CategoryListResponse>('/categories')
    return response.data
  },

  /**
   * Get categories with hierarchy (parent-child structure)
   */
  async getHierarchy(): Promise<{
    categories: Array<Category & { children?: Category[] }>
  }> {
    const response = await apiClient.get('/categories?hierarchy=true')
    return response.data
  },

  /**
   * Get single category by ID
   */
  async getById(categoryId: string): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${categoryId}`)
    return response.data
  },

  /**
   * Create new category
   */
  async create(categoryData: CategoryCreate): Promise<Category> {
    const response = await apiClient.post<Category>('/categories', categoryData)
    return response.data
  },

  /**
   * Update existing category
   */
  async update(categoryId: string, categoryData: CategoryUpdate): Promise<Category> {
    const response = await apiClient.put<Category>(`/categories/${categoryId}`, categoryData)
    return response.data
  },

  /**
   * Delete category
   */
  async delete(categoryId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/categories/${categoryId}`)
    return response.data
  },

  /**
   * Get system (predefined) categories
   */
  async getSystemCategories(): Promise<CategoryListResponse> {
    const response = await apiClient.get<CategoryListResponse>('/categories?is_system=true')
    return response.data
  },

  /**
   * Get user-created categories
   */
  async getUserCategories(): Promise<CategoryListResponse> {
    const response = await apiClient.get<CategoryListResponse>('/categories?is_system=false')
    return response.data
  },
}
