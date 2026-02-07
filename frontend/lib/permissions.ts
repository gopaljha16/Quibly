// Permission bit flags (matching Discord's permission system)
export const PERMISSIONS = {
  // General Server Permissions
  VIEW_CHANNELS: 1 << 0,           // 1
  MANAGE_CHANNELS: 1 << 1,         // 2
  MANAGE_SERVER: 1 << 2,           // 4
  CREATE_INVITE: 1 << 3,           // 8
  CHANGE_NICKNAME: 1 << 4,         // 16
  MANAGE_NICKNAMES: 1 << 5,        // 32
  KICK_MEMBERS: 1 << 6,            // 64
  BAN_MEMBERS: 1 << 7,             // 128
  
  // Moderation Permissions
  TIMEOUT_MEMBERS: 1 << 8,         // 256
  VIEW_AUDIT_LOG: 1 << 9,          // 512
  MANAGE_ROLES: 1 << 10,           // 1024
  MANAGE_WEBHOOKS: 1 << 11,        // 2048
  
  // Message Permissions
  SEND_MESSAGES: 1 << 12,          // 4096
  EMBED_LINKS: 1 << 13,            // 8192
  ATTACH_FILES: 1 << 14,           // 16384
  ADD_REACTIONS: 1 << 15,          // 32768
  MENTION_EVERYONE: 1 << 16,       // 65536
  MANAGE_MESSAGES: 1 << 17,        // 131072
  READ_MESSAGE_HISTORY: 1 << 18,   // 262144
  
  // Voice Permissions
  CONNECT: 1 << 19,                // 524288
  SPEAK: 1 << 20,                  // 1048576
  MUTE_MEMBERS: 1 << 21,           // 2097152
  DEAFEN_MEMBERS: 1 << 22,         // 4194304
  MOVE_MEMBERS: 1 << 23,           // 8388608
  
  // Advanced Permissions
  ADMINISTRATOR: 1 << 24,          // 16777216 - Has all permissions
} as const

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  GENERAL: [
    'VIEW_CHANNELS',
    'CREATE_INVITE',
    'CHANGE_NICKNAME',
  ],
  MODERATION: [
    'KICK_MEMBERS',
    'BAN_MEMBERS',
    'TIMEOUT_MEMBERS',
    'MANAGE_NICKNAMES',
    'MANAGE_MESSAGES',
  ],
  MANAGEMENT: [
    'MANAGE_SERVER',
    'MANAGE_CHANNELS',
    'MANAGE_ROLES',
    'VIEW_AUDIT_LOG',
    'MANAGE_WEBHOOKS',
  ],
  MESSAGING: [
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'ATTACH_FILES',
    'ADD_REACTIONS',
    'MENTION_EVERYONE',
    'READ_MESSAGE_HISTORY',
  ],
  VOICE: [
    'CONNECT',
    'SPEAK',
    'MUTE_MEMBERS',
    'DEAFEN_MEMBERS',
    'MOVE_MEMBERS',
  ],
} as const

// Check if user has a specific permission
export function hasPermission(userPermissions: number, permission: number): boolean {
  // Administrator has all permissions
  if ((userPermissions & PERMISSIONS.ADMINISTRATOR) === PERMISSIONS.ADMINISTRATOR) {
    return true
  }
  return (userPermissions & permission) === permission
}

// Check if user has any of the given permissions
export function hasAnyPermission(userPermissions: number, permissions: number[]): boolean {
  if ((userPermissions & PERMISSIONS.ADMINISTRATOR) === PERMISSIONS.ADMINISTRATOR) {
    return true
  }
  return permissions.some(perm => (userPermissions & perm) === perm)
}

// Check if user has all of the given permissions
export function hasAllPermissions(userPermissions: number, permissions: number[]): boolean {
  if ((userPermissions & PERMISSIONS.ADMINISTRATOR) === PERMISSIONS.ADMINISTRATOR) {
    return true
  }
  return permissions.every(perm => (userPermissions & perm) === perm)
}

// Calculate user's total permissions from their roles
export function calculateUserPermissions(
  roles: Array<{ id: string; permissions: number; isDefault?: boolean }>,
  userRoleIds: string[],
  isOwner: boolean = false
): number {
  // Owner has all permissions
  if (isOwner) {
    return PERMISSIONS.ADMINISTRATOR
  }

  let totalPermissions = 0

  // Add permissions from all user's roles
  roles.forEach(role => {
    if (userRoleIds.includes(role.id)) {
      totalPermissions |= role.permissions
    }
  })

  return totalPermissions
}

// Get permission name from bit value
export function getPermissionName(permission: number): string {
  const entry = Object.entries(PERMISSIONS).find(([_, value]) => value === permission)
  return entry ? entry[0] : 'UNKNOWN'
}

// Get all permission names from a permission value
export function getPermissionNames(permissions: number): string[] {
  return Object.entries(PERMISSIONS)
    .filter(([_, value]) => (permissions & value) === value)
    .map(([name]) => name)
}

// Check if user can access server settings
export function canAccessServerSettings(
  userPermissions: number,
  isOwner: boolean
): boolean {
  if (isOwner) return true
  return hasPermission(userPermissions, PERMISSIONS.MANAGE_SERVER)
}

// Check which server settings tabs user can access
export function getAccessibleSettingsTabs(
  userPermissions: number,
  isOwner: boolean
): {
  overview: boolean
  moderation: boolean
  autoMod: boolean
  auditLogs: boolean
  welcomeScreen: boolean
  memberScreening: boolean
  interests: boolean
  members: boolean
  roles: boolean
  channels: boolean
  integrations: boolean
} {
  // Owner has access to everything
  if (isOwner) {
    return {
      overview: true,
      moderation: true,
      autoMod: true,
      auditLogs: true,
      welcomeScreen: true,
      memberScreening: true,
      interests: true,
      members: true,
      roles: true,
      channels: true,
      integrations: true,
    }
  }

  const hasManageServer = hasPermission(userPermissions, PERMISSIONS.MANAGE_SERVER)
  const hasManageRoles = hasPermission(userPermissions, PERMISSIONS.MANAGE_ROLES)
  const hasManageChannels = hasPermission(userPermissions, PERMISSIONS.MANAGE_CHANNELS)
  const hasViewAuditLog = hasPermission(userPermissions, PERMISSIONS.VIEW_AUDIT_LOG)
  const hasModeration = hasAnyPermission(userPermissions, [
    PERMISSIONS.KICK_MEMBERS,
    PERMISSIONS.BAN_MEMBERS,
    PERMISSIONS.TIMEOUT_MEMBERS,
  ])

  return {
    overview: hasManageServer,
    moderation: hasModeration || hasManageServer,
    autoMod: hasManageServer, // Only server managers can configure auto-mod
    auditLogs: hasViewAuditLog || hasManageServer,
    welcomeScreen: hasManageServer,
    memberScreening: hasManageServer,
    interests: hasManageServer,
    members: hasModeration || hasManageServer,
    roles: hasManageRoles || hasManageServer,
    channels: hasManageChannels || hasManageServer,
    integrations: hasManageServer,
  }
}

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  VIEW_CHANNELS: {
    name: 'View Channels',
    description: 'Allows members to view channels',
  },
  MANAGE_CHANNELS: {
    name: 'Manage Channels',
    description: 'Allows members to create, edit, and delete channels',
  },
  MANAGE_SERVER: {
    name: 'Manage Server',
    description: 'Allows members to change server settings',
  },
  CREATE_INVITE: {
    name: 'Create Invite',
    description: 'Allows members to invite new people to the server',
  },
  CHANGE_NICKNAME: {
    name: 'Change Nickname',
    description: 'Allows members to change their own nickname',
  },
  MANAGE_NICKNAMES: {
    name: 'Manage Nicknames',
    description: 'Allows members to change nicknames of other members',
  },
  KICK_MEMBERS: {
    name: 'Kick Members',
    description: 'Allows members to remove other members from the server',
  },
  BAN_MEMBERS: {
    name: 'Ban Members',
    description: 'Allows members to permanently ban other members',
  },
  TIMEOUT_MEMBERS: {
    name: 'Timeout Members',
    description: 'Allows members to temporarily timeout other members',
  },
  VIEW_AUDIT_LOG: {
    name: 'View Audit Log',
    description: 'Allows members to view the server audit log',
  },
  MANAGE_ROLES: {
    name: 'Manage Roles',
    description: 'Allows members to create, edit, and delete roles',
  },
  MANAGE_WEBHOOKS: {
    name: 'Manage Webhooks',
    description: 'Allows members to create, edit, and delete webhooks',
  },
  SEND_MESSAGES: {
    name: 'Send Messages',
    description: 'Allows members to send messages in text channels',
  },
  EMBED_LINKS: {
    name: 'Embed Links',
    description: 'Allows links sent by members to show embedded content',
  },
  ATTACH_FILES: {
    name: 'Attach Files',
    description: 'Allows members to upload files and media',
  },
  ADD_REACTIONS: {
    name: 'Add Reactions',
    description: 'Allows members to add reactions to messages',
  },
  MENTION_EVERYONE: {
    name: 'Mention @everyone',
    description: 'Allows members to use @everyone and @here mentions',
  },
  MANAGE_MESSAGES: {
    name: 'Manage Messages',
    description: 'Allows members to delete messages from other members',
  },
  READ_MESSAGE_HISTORY: {
    name: 'Read Message History',
    description: 'Allows members to read previous messages',
  },
  CONNECT: {
    name: 'Connect',
    description: 'Allows members to join voice channels',
  },
  SPEAK: {
    name: 'Speak',
    description: 'Allows members to speak in voice channels',
  },
  MUTE_MEMBERS: {
    name: 'Mute Members',
    description: 'Allows members to mute other members in voice channels',
  },
  DEAFEN_MEMBERS: {
    name: 'Deafen Members',
    description: 'Allows members to deafen other members in voice channels',
  },
  MOVE_MEMBERS: {
    name: 'Move Members',
    description: 'Allows members to move other members between voice channels',
  },
  ADMINISTRATOR: {
    name: 'Administrator',
    description: 'Grants all permissions and bypasses channel-specific permissions',
  },
}
