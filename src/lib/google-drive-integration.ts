// Google Drive Integration for Intellego Platform
// Provides automatic backup, file storage, and synchronization capabilities

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: number
  createdTime: Date
  modifiedTime: Date
  webViewLink?: string
  downloadLink?: string
  parents?: string[]
}

export interface DriveUploadOptions {
  fileName: string
  content: string | Buffer
  mimeType: string
  parentFolderId?: string
  description?: string
}

export interface BackupData {
  timestamp: Date
  userId: string
  dataType: 'weekly_reports' | 'calendar_events' | 'ai_conversations' | 'learning_profiles' | 'full_backup'
  data: any
  fileId?: string
}

export interface SyncStatus {
  lastSync: Date
  filesUploaded: number
  filesFailed: number
  totalSize: number
  status: 'success' | 'partial' | 'failed' | 'in_progress'
  errors: string[]
}

export class GoogleDriveIntegration {
  private static isInitialized = false
  private static accessToken: string | null = null
  private static refreshToken: string | null = null
  private static backupFolderId: string | null = null
  
  // Configuration
  private static readonly CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID
  private static readonly CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET  
  private static readonly REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
  private static readonly SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
  ]

  /**
   * Initializes Google Drive integration
   */
  static async initialize(): Promise<boolean> {
    try {
      if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
        console.log('⚠️  Google Drive credentials not configured')
        console.log('💡 Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET in .env to enable Drive integration')
        return false
      }

      // Try to load existing tokens
      this.loadStoredTokens()
      
      if (this.accessToken) {
        // Verify token is still valid
        const isValid = await this.verifyToken()
        if (isValid) {
          this.isInitialized = true
          console.log('✅ Google Drive integration initialized successfully')
          return true
        }
      }

      console.log('🔑 Google Drive requires authentication')
      console.log('📖 See CLAUDE.md for setup instructions')
      return false
      
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive:', error)
      return false
    }
  }

  /**
   * Generates OAuth authorization URL
   */
  static getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID!,
      redirect_uri: this.REDIRECT_URI,
      scope: this.SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    })
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  /**
   * Exchanges authorization code for access token
   */
  static async exchangeCodeForTokens(authCode: string): Promise<boolean> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.CLIENT_ID!,
          client_secret: this.CLIENT_SECRET!,
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: this.REDIRECT_URI,
        }),
      })

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`)
      }

      const tokens = await response.json()
      
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token || this.refreshToken
      
      // Store tokens securely
      this.storeTokens()
      
      this.isInitialized = true
      console.log('✅ Google Drive authentication successful')
      
      // Create backup folder
      await this.ensureBackupFolder()
      
      return true
    } catch (error) {
      console.error('❌ Failed to exchange authorization code:', error)
      return false
    }
  }

  /**
   * Refreshes access token using refresh token
   */
  static async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.CLIENT_ID!,
          client_secret: this.CLIENT_SECRET!,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`)
      }

      const tokens = await response.json()
      this.accessToken = tokens.access_token
      
      // Update stored token
      this.storeTokens()
      
      console.log('🔄 Access token refreshed successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to refresh access token:', error)
      return false
    }
  }

  /**
   * Verifies if current token is valid
   */
  static async verifyToken(): Promise<boolean> {
    if (!this.accessToken) return false

    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      })

      if (response.status === 401) {
        // Token expired, try to refresh
        return await this.refreshAccessToken()
      }

      return response.ok
    } catch (error) {
      console.error('Token verification error:', error)
      return false
    }
  }

  /**
   * Creates or gets the main backup folder
   */
  static async ensureBackupFolder(): Promise<string | null> {
    if (this.backupFolderId) {
      return this.backupFolderId
    }

    try {
      // Search for existing Intellego Platform folder
      const searchResponse = await this.makeAuthorizedRequest(
        `https://www.googleapis.com/drive/v3/files?q=name='Intellego Platform Backup' and mimeType='application/vnd.google-apps.folder'`
      )

      const existingFolders = await searchResponse.json()
      
      if (existingFolders.files && existingFolders.files.length > 0) {
        this.backupFolderId = existingFolders.files[0].id
        console.log(`📁 Using existing backup folder: ${this.backupFolderId}`)
        return this.backupFolderId
      }

      // Create new backup folder
      const createResponse = await this.makeAuthorizedRequest(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Intellego Platform Backup',
            mimeType: 'application/vnd.google-apps.folder',
            description: 'Automated backup folder for Intellego Platform student data'
          }),
        }
      )

      const folder = await createResponse.json()
      this.backupFolderId = folder.id
      
      console.log(`📁 Created new backup folder: ${this.backupFolderId}`)
      return this.backupFolderId
    } catch (error) {
      console.error('❌ Failed to ensure backup folder:', error)
      return null
    }
  }

  /**
   * Uploads file to Google Drive
   */
  static async uploadFile(options: DriveUploadOptions): Promise<DriveFile | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return null
    }

    try {
      const boundary = '-------314159265358979323846'
      const delimiter = "\r\n--" + boundary + "\r\n"
      const close_delim = "\r\n--" + boundary + "--"

      // Prepare metadata
      const metadata = {
        name: options.fileName,
        parents: options.parentFolderId ? [options.parentFolderId] : undefined,
        description: options.description
      }

      // Prepare request body
      let requestBody = delimiter + 
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) + 
        delimiter +
        `Content-Type: ${options.mimeType}\r\n\r\n`

      // Add content
      if (typeof options.content === 'string') {
        requestBody += options.content
      } else {
        requestBody += options.content.toString()
      }
      
      requestBody += close_delim

      const response = await this.makeAuthorizedRequest(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/related; boundary="${boundary}"`,
          },
          body: requestBody,
        }
      )

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const file = await response.json()
      
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size ? parseInt(file.size) : undefined,
        createdTime: new Date(file.createdTime),
        modifiedTime: new Date(file.modifiedTime),
        webViewLink: file.webViewLink,
        parents: file.parents
      }
    } catch (error) {
      console.error('❌ Failed to upload file:', error)
      return null
    }
  }

  /**
   * Downloads file from Google Drive
   */
  static async downloadFile(fileId: string): Promise<string | null> {
    if (!this.isInitialized) return null

    try {
      const response = await this.makeAuthorizedRequest(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
      )

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      console.error('❌ Failed to download file:', error)
      return null
    }
  }

  /**
   * Lists files in a folder
   */
  static async listFiles(folderId?: string, mimeType?: string): Promise<DriveFile[]> {
    if (!this.isInitialized) return []

    try {
      let query = "trashed=false"
      if (folderId) {
        query += ` and '${folderId}' in parents`
      }
      if (mimeType) {
        query += ` and mimeType='${mimeType}'`
      }

      const response = await this.makeAuthorizedRequest(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents)`
      )

      const data = await response.json()
      
      return (data.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size ? parseInt(file.size) : undefined,
        createdTime: new Date(file.createdTime),
        modifiedTime: new Date(file.modifiedTime),
        webViewLink: file.webViewLink,
        parents: file.parents
      }))
    } catch (error) {
      console.error('❌ Failed to list files:', error)
      return []
    }
  }

  /**
   * Creates backup of user data
   */
  static async createUserBackup(userId: string, dataType: BackupData['dataType'], data: any): Promise<BackupData | null> {
    if (!this.isInitialized) {
      console.log('Google Drive not initialized, skipping backup')
      return null
    }

    try {
      const backupFolderId = await this.ensureBackupFolder()
      if (!backupFolderId) return null

      const timestamp = new Date()
      const fileName = `${userId}_${dataType}_${timestamp.getTime()}.json`
      
      const backupContent = JSON.stringify({
        timestamp,
        userId,
        dataType,
        data,
        version: '1.0'
      }, null, 2)

      const uploadedFile = await this.uploadFile({
        fileName,
        content: backupContent,
        mimeType: 'application/json',
        parentFolderId: backupFolderId,
        description: `Backup of ${dataType} data for user ${userId}`
      })

      if (!uploadedFile) return null

      const backup: BackupData = {
        timestamp,
        userId,
        dataType,
        data,
        fileId: uploadedFile.id
      }

      console.log(`💾 Created backup: ${fileName} (${uploadedFile.id})`)
      return backup
    } catch (error) {
      console.error('❌ Failed to create user backup:', error)
      return null
    }
  }

  /**
   * Restores user data from backup
   */
  static async restoreUserBackup(fileId: string): Promise<BackupData | null> {
    try {
      const backupContent = await this.downloadFile(fileId)
      if (!backupContent) return null

      const backupData = JSON.parse(backupContent)
      
      console.log(`🔄 Restored backup for user ${backupData.userId}, type: ${backupData.dataType}`)
      return backupData
    } catch (error) {
      console.error('❌ Failed to restore backup:', error)
      return null
    }
  }

  /**
   * Performs automatic backup of all student data
   */
  static async performAutomaticBackup(): Promise<SyncStatus> {
    const syncStatus: SyncStatus = {
      lastSync: new Date(),
      filesUploaded: 0,
      filesFailed: 0,
      totalSize: 0,
      status: 'in_progress',
      errors: []
    }

    if (!this.isInitialized) {
      syncStatus.status = 'failed'
      syncStatus.errors.push('Google Drive not initialized')
      return syncStatus
    }

    try {
      console.log('🔄 Starting automatic backup...')
      
      // Import required modules for data access
      const { getAllUsers, getAllWeeklyReports } = require('./temp-storage')
      const { tempCalendarData } = require('./calendar-data')
      
      // Backup users data
      const users = getAllUsers()
      for (const user of users) {
        const backup = await this.createUserBackup(user.id, 'full_backup', {
          user,
          reports: getAllWeeklyReports().filter(r => r.userId === user.id),
          calendar: tempCalendarData.find(c => c.userId === user.id)
        })
        
        if (backup) {
          syncStatus.filesUploaded++
        } else {
          syncStatus.filesFailed++
          syncStatus.errors.push(`Failed to backup user ${user.id}`)
        }
      }

      syncStatus.status = syncStatus.filesFailed === 0 ? 'success' : 'partial'
      console.log(`✅ Automatic backup completed: ${syncStatus.filesUploaded} files uploaded, ${syncStatus.filesFailed} failed`)
      
    } catch (error) {
      console.error('❌ Automatic backup failed:', error)
      syncStatus.status = 'failed'
      syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return syncStatus
  }

  /**
   * Gets list of available backups for a user
   */
  static async getUserBackups(userId: string): Promise<DriveFile[]> {
    if (!this.isInitialized) return []

    const backupFolderId = await this.ensureBackupFolder()
    if (!backupFolderId) return []

    const allFiles = await this.listFiles(backupFolderId, 'application/json')
    return allFiles.filter(file => file.name.startsWith(userId))
  }

  /**
   * Deletes old backups (older than 30 days)
   */
  static async cleanupOldBackups(): Promise<number> {
    if (!this.isInitialized) return 0

    try {
      const backupFolderId = await this.ensureBackupFolder()
      if (!backupFolderId) return 0

      const files = await this.listFiles(backupFolderId)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 30)

      let deletedCount = 0

      for (const file of files) {
        if (file.createdTime < cutoffDate) {
          const deleteResponse = await this.makeAuthorizedRequest(
            `https://www.googleapis.com/drive/v3/files/${file.id}`,
            { method: 'DELETE' }
          )

          if (deleteResponse.ok) {
            deletedCount++
            console.log(`🗑️ Deleted old backup: ${file.name}`)
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Cleanup completed: ${deletedCount} old backups deleted`)
      }

      return deletedCount
    } catch (error) {
      console.error('❌ Failed to cleanup old backups:', error)
      return 0
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Makes authorized request to Google API
   */
  private static async makeAuthorizedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // If unauthorized, try to refresh token once
    if (response.status === 401 && !options.headers?.['X-Retry']) {
      const refreshed = await this.refreshAccessToken()
      if (refreshed) {
        return this.makeAuthorizedRequest(url, {
          ...options,
          headers: { ...options.headers, 'X-Retry': 'true' }
        })
      }
    }

    return response
  }

  /**
   * Stores tokens securely in memory
   */
  private static storeTokens(): void {
    // In a production environment, these should be stored in a secure database
    // For now, we store them in global memory
    if (!globalThis.googleDriveTokens) {
      globalThis.googleDriveTokens = {}
    }
    
    globalThis.googleDriveTokens = {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      storedAt: new Date()
    }
  }

  /**
   * Loads stored tokens from memory
   */
  private static loadStoredTokens(): void {
    if (globalThis.googleDriveTokens) {
      this.accessToken = globalThis.googleDriveTokens.accessToken
      this.refreshToken = globalThis.googleDriveTokens.refreshToken
    }
  }

  /**
   * Gets integration status
   */
  static getStatus(): { 
    initialized: boolean, 
    hasTokens: boolean, 
    backupFolderId: string | null,
    authUrl?: string 
  } {
    return {
      initialized: this.isInitialized,
      hasTokens: !!(this.accessToken && this.refreshToken),
      backupFolderId: this.backupFolderId,
      authUrl: this.CLIENT_ID ? this.getAuthorizationUrl() : undefined
    }
  }

  /**
   * Manually triggers a full backup
   */
  static async triggerManualBackup(): Promise<SyncStatus> {
    console.log('🔄 Manual backup triggered by user')
    return await this.performAutomaticBackup()
  }
}

// Auto-initialize on module load if credentials are available
setTimeout(async () => {
  await GoogleDriveIntegration.initialize()
}, 1000)