'use client'

/**
 * Category Form Component
 * Reusable form for creating and editing categories
 */

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { Category } from '@/types'
import { CategoryType } from '@/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  category_type: z.nativeEnum(CategoryType),
  parent_category_id: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

interface CategoryFormProps {
  mode: 'create' | 'edit'
  initialData?: Category
  parentOptions: Category[]
  onSubmit: (values: CategoryFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  title?: string
  description?: string
  excludeId?: string
}

export function CategoryForm({
  mode,
  initialData,
  parentOptions,
  onSubmit,
  onCancel,
  isSubmitting = false,
  title,
  description,
  excludeId,
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      category_type: initialData?.category_type || CategoryType.EXPENSE,
      parent_category_id: initialData?.parent_category_id || null,
      icon: initialData?.icon || '',
      color: initialData?.color || '',
    },
  })

  const selectedType = form.watch('category_type')

  const filteredParents = useMemo(() => {
    return parentOptions.filter(
      (category) =>
        category.parent_category_id === null &&
        category.category_type === selectedType &&
        category.id !== excludeId
    )
  }, [parentOptions, selectedType, excludeId])

  const handleSubmit = async (values: CategoryFormValues) => {
    await onSubmit(values)
  }

  const defaultTitle = mode === 'create' ? 'New Category' : 'Edit Category'
  const defaultDescription =
    mode === 'create'
      ? 'Create a category to organize your transactions'
      : 'Update category details'

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || defaultTitle}</CardTitle>
        <CardDescription>{description || defaultDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Groceries" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting || mode === 'edit'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CategoryType.EXPENSE}>Expense</SelectItem>
                      <SelectItem value={CategoryType.INCOME}>Income</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {mode === 'edit'
                      ? 'Category type cannot be changed after creation'
                      : 'Choose whether this category is income or expense'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                    value={field.value || 'none'}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No parent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No parent</SelectItem>
                      {filteredParents.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon ? `${category.icon} ` : ''}
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Optional: assign a parent category</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="🍔" {...field} value={field.value || ''} disabled={isSubmitting} />
                    </FormControl>
                    <FormDescription>Emoji or short icon label</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="#FF6B6B"
                        {...field}
                        value={field.value || ''}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Hex color (e.g., #FF6B6B)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {mode === 'create' ? 'Creating...' : 'Saving...'}
                  </>
                ) : mode === 'create' ? (
                  'Create Category'
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
