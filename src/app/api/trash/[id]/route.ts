import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params
    const trashItem = await prisma.trashItem.findUnique({
      where: { id: params.id }
    })

    if (!trashItem) {
      return NextResponse.json({ error: 'Trash item not found' }, { status: 404 })
    }

    // Parse file paths and physically delete them
    const filePaths = (typeof trashItem.filePaths === 'string' ? JSON.parse(trashItem.filePaths) : trashItem.filePaths) as string[]
    for (const filePath of filePaths) {
      try {
        await unlink(filePath)
      } catch (err) {
        console.error(`Failed to delete physical file ${filePath}:`, err)
        // Continue even if one file fails (might have already been deleted manually)
      }
    }

    // Delete the trash record
    await prisma.trashItem.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error permanently deleting trash item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
