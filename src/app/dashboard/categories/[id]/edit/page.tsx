'use client'

/**
 * Edit Category Page
 * Update an existing transaction category
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { categoriesApi } from '@/lib/api'
import type { Category } from '@/types'
import { CategoryForm, type CategoryFormValues } from '@/components/categories/category-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.id as string

  const [category, setCategory] = useState<Category | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (categoryId) {
      loadData()
    }
  }, [categoryId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [categoryData, categoriesRes] = await Promise.all([
        categoriesApi.getById(categoryId),
        categoriesApi.getAll(),
      ])
      setCategory(categoryData)
      setCategories(categoriesRes.categories)
    } catch (err: any) {
      console.error('Failed to load category:', err)
      setError(err.response?.data?.detail || 'Failed to load category')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      setIsSubmitting(true)
      await categoriesApi.update(categoryId, {
        name: values.name,
        parent_category_id: values.parent_category_id || null,
        icon: values.icon || null,
        color: values.color || null,
      })
      toast.success('Category updated successfully')
      router.push('/dashboard/categories')
    } catch (error: any) {
      console.error('Failed to update category:', error)
      toast.error(error.response?.data?.detail || 'Failed to update category')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/categories')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Categories
        </Button>
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/categories')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Categories
        </Button>
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Category not found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {error || 'The category you are looking for does not exist.'}
            </p>
            <Button onClick={() => router.push('/dashboard/categories')}>
              View All Categories
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/categories')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
          <p className="text-muted-foreground">Update category details</p>
        </div>
      </div>

      <CategoryForm
        mode="edit"
        initialData={category}
        parentOptions={categories}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/dashboard/categories')}
        isSubmitting={isSubmitting}
        excludeId={category.id}
      />
    </div>
  )
}
