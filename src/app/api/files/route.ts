import { NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'
import os from 'os'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 })
  }

  try {
    // Basic security check: ensure it's a file path we expect
    // Resolve the intended base directory
    const homeDir = os.homedir()
    const onedrivePath = process.env.ONEDRIVE_PATH || path.join(homeDir, 'OneDrive', 'Shared_POs')
    
    // Normalize and resolve both paths to absolute paths
    const resolvedBase = path.resolve(onedrivePath)
    const resolvedTarget = path.resolve(filePath)
    
    // Prevent directory traversal attacks
    if (!resolvedTarget.startsWith(resolvedBase)) {
      console.error(`Security Warning: Blocked path traversal attempt to ${resolvedTarget}`)
      return NextResponse.json({ error: 'Access denied: Path is outside of allowed directory' }, { status: 403 })
    }

    // For now, we will check if the file exists
    const fileStat = await stat(resolvedTarget)
    
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 })
    }

    const fileBuffer = await readFile(resolvedTarget)
    const filename = path.basename(resolvedTarget)

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
