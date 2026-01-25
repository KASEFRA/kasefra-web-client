'use client'

/**
 * New Category Page
 * Create a new transaction category
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { categoriesApi } from '@/lib/api'
import type { Category } from '@/types'
import { CategoryForm, type CategoryFormValues } from '@/components/categories/category-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NewCategoryPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await categoriesApi.getAll()
      setCategories(response.categories)
    } catch (error) {
      console.error('Failed to load categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      setIsSubmitting(true)
      await categoriesApi.create({
        name: values.name,
        category_type: values.category_type,
        parent_category_id: values.parent_category_id || null,
        icon: values.icon || null,
        color: values.color || null,
      })
      toast.success('Category created successfully')
      router.push('/dashboard/categories')
    } catch (error: any) {
      console.error('Failed to create category:', error)
      toast.error(error.response?.data?.detail || 'Failed to create category')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/categories')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Category</h1>
          <p className="text-muted-foreground">Create a category to organize transactions</p>
        </div>
      </div>

      <CategoryForm
        mode="create"
        parentOptions={categories}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/dashboard/categories')}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
