/**
 * Categories API module
 */

import { apiClient } from './client'
import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoryListResponse,
  CategoryStatsResponse,
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
    const response = await apiClient.get<CategoryListResponse>('/categories')
    const categories = response.data.categories
    const categoryMap = new Map<string, Category & { children?: Category[] }>()

    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    const roots: Array<Category & { children?: Category[] }> = []
    categoryMap.forEach((category) => {
      if (category.parent_category_id) {
        const parent = categoryMap.get(category.parent_category_id)
        if (parent) {
          parent.children?.push(category)
        } else {
          roots.push(category)
        }
      } else {
        roots.push(category)
      }
    })

    return { categories: roots }
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
    const response = await apiClient.get<CategoryListResponse>('/categories')
    const categories = response.data.categories.filter((category) => category.is_default)
    return { categories, total_count: categories.length }
  },

  /**
   * Get user-created categories
   */
  async getUserCategories(): Promise<CategoryListResponse> {
    const response = await apiClient.get<CategoryListResponse>('/categories')
    const categories = response.data.categories.filter((category) => !category.is_default)
    return { categories, total_count: categories.length }
  },

  /**
   * Get category statistics
   */
  async getStats(): Promise<CategoryStatsResponse> {
    const response = await apiClient.get<CategoryStatsResponse>('/categories/stats')
    return response.data
  },

  /**
   * Seed default UAE-focused categories
   */
  async seedDefaults(): Promise<CategoryListResponse> {
    const response = await apiClient.post<CategoryListResponse>('/categories/seed-defaults')
    return response.data
  },
}
