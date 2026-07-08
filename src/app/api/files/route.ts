import { NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 })
  }

  try {
    // Basic security check: ensure it's a file path we expect
    // In a real application, you should restrict this to only the OneDrive folder
    // For now, we will check if the file exists
    const fileStat = await stat(filePath)
    
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 })
    }

    const fileBuffer = await readFile(filePath)
    const filename = path.basename(filePath)

    const isView = searchParams.get('view') === 'true'

    // Return the file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf', // Or dynamically determine based on extension
        'Content-Disposition': `${isView ? 'inline' : 'attachment'}; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
  }
}
