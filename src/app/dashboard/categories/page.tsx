'use client'

/**
 * Categories Page
 * Manage transaction categories with hierarchy support
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { categoriesApi } from '@/lib/api'
import type { Category } from '@/types'
import { Plus, Edit, Trash2, Folder, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'system' | 'custom'>('all')

  useEffect(() => {
    loadCategories()
  }, [filter])

  const loadCategories = async () => {
    try {
      setLoading(true)
      let response
      if (filter === 'system') {
        response = await categoriesApi.getSystemCategories()
      } else if (filter === 'custom') {
        response = await categoriesApi.getUserCategories()
      } else {
        response = await categoriesApi.getAll()
      }
      setCategories(response.categories)
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      await categoriesApi.delete(categoryId)
      await loadCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category. It may be in use.')
    }
  }

  const getParentCategories = () => {
    return categories.filter((cat) => !cat.parent_category_id)
  }

  const getChildCategories = (parentId: string) => {
    return categories.filter((cat) => cat.parent_category_id === parentId)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="mt-1 text-muted-foreground">
            Organize your transactions with categories
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/categories/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          All Categories
        </button>
        <button
          onClick={() => setFilter('system')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'system'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          System Categories
        </button>
        <button
          onClick={() => setFilter('custom')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'custom'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          My Categories
        </button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No categories yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first category to organize transactions
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push('/dashboard/categories/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Parent Categories */}
          {getParentCategories().map((parentCategory) => (
            <div
              key={parentCategory.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              {/* Parent Category */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: parentCategory.color || '#e5e7eb' }}
                  >
                    {parentCategory.icon ? (
                      <span className="text-xl">{parentCategory.icon}</span>
                    ) : (
                      <Folder className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {parentCategory.name}
                      </h3>
                      {parentCategory.is_default && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                          System
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/categories/${parentCategory.id}/edit`)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  {!parentCategory.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(parentCategory.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Child Categories */}
              {getChildCategories(parentCategory.id).length > 0 && (
                <div className="ml-12 mt-3 space-y-2">
                  {getChildCategories(parentCategory.id).map((childCategory) => (
                    <div
                      key={childCategory.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: childCategory.color || '#e5e7eb' }}
                        >
                          {childCategory.icon ? (
                            <span>{childCategory.icon}</span>
                          ) : (
                            <Tag className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {childCategory.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/categories/${childCategory.id}/edit`)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {!childCategory.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(childCategory.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
