# Nexus Theme Update Guide
## Cyan-to-Purple Gradient Theme

### Color Palette

#### Old Colors (Gold/Coral Theme)
- `#0b0500` - Dark background
- `#1a1510` - Surface
- `#f3c178` - Primary gold
- `#f35e41` - Accent coral
- `#949BA4` - Muted text
- `#DBDEE1` - Light text

#### New Colors (Cyan/Purple Theme)
- `#030305` - Obsidian black (darkest)
- `#0a0b0f` - Dark background
- `#12131a` - Dark surface
- `#1a1b24` - Dark elevated
- `#06b6d4` - Cyan 500 (primary)
- `#22d3ee` - Cyan 400 (hover)
- `#67e8f9` - Cyan 300 (light)
- `#9333ea` - Purple 600 (accent)
- `#a855f7` - Purple 500 (hover)
- `#c084fc` - Purple 400 (light)
- `#f8fafc` - Text primary
- `#94a3b8` - Text secondary
- `#64748b` - Text muted

### Global Find & Replace

Run these replacements across ALL frontend files:

```
OLD                 NEW
#0b0500         →   #030305
#050200         →   #0a0b0f
#1a1510         →   #12131a
#0d0805         →   #12131a
#2e3035         →   #1a1b24
#313338         →   #1a1b24
#35373C         →   #1a1b24
#404249         →   #1a1b24

#f3c178         →   #06b6d4
#e0a850         →   #22d3ee
#f35e41         →   #9333ea
#e0442a         →   #a855f7

#DBDEE1         →   #f8fafc
#B5BAC1         →   #94a3b8
#949BA4         →   #64748b

from-[#f3c178]  →   from-cyan-500
to-[#f35e41]    →   to-purple-600
bg-gradient-to-br from-[#f3c178] to-[#f35e41]  →  bg-gradient-to-br from-cyan-500 to-purple-600
```

### Specific Component Updates

#### 1. EnhancedChannelsShell.tsx
- Server sidebar background: `#050200` → `#0a0b0f`
- Channel sidebar background: `#0d0805` → `#12131a`
- Selected server/channel: gradient from cyan to purple
- Hover states: use cyan-400
- Border colors: `rgba(6, 182, 212, 0.1)`

#### 2. Channels Page (page.tsx)
- Message hover: `#2e3035/60` → `#1a1b24/60`
- Avatar gradient: `from-cyan-500 to-purple-600`
- Link colors: `#06b6d4`
- Input background: `#12131a`
- Input focus ring: `ring-cyan-500`

#### 3. Voice Channel Panel
- Background: `#030305`
- Surface: `#12131a`
- Elevated: `#1a1b24`
- Accent buttons: gradient cyan to purple

#### 4. Modals & Dialogs
- Background: `#12131a`
- Border: `rgba(6, 182, 212, 0.1)`
- Primary button: gradient cyan to purple
- Secondary button: `#1a1b24`

### Gradient Usage

Replace all gradient instances:

```tsx
// OLD
className="bg-gradient-to-r from-[#f3c178] to-[#f35e41]"

// NEW
className="bg-gradient-to-r from-cyan-500 to-purple-600"
```

### Button Styles

```tsx
// Primary Button
className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white"

// Secondary Button
className="bg-[#1a1b24] hover:bg-[#22d3ee]/20 text-[#94a3b8] hover:text-[#f8fafc] border border-cyan-500/20"

// Danger Button
className="bg-red-600 hover:bg-red-700 text-white"
```

### Text Colors

```tsx
// Primary text
className="text-[#f8fafc]"

// Secondary text
className="text-[#94a3b8]"

// Muted text
className="text-[#64748b]"

// Link text
className="text-cyan-400 hover:text-cyan-300"
```

### Border & Divider Colors

```tsx
// Border
className="border-cyan-500/10"

// Divider
className="bg-cyan-500/10"
```

### Implementation Steps

1. ✅ Update `globals.css` with new CSS variables
2. Update `EnhancedChannelsShell.tsx` - all color references
3. Update `page.tsx` (channels) - all color references
4. Update `VoiceChannelPanel.tsx` - all color references
5. Update all modal components
6. Update button components
7. Update input components
8. Test all pages for visual consistency

### Testing Checklist

- [ ] Server sidebar colors
- [ ] Channel list colors
- [ ] Message list colors
- [ ] Input field colors
- [ ] Button hover states
- [ ] Modal backgrounds
- [ ] Voice channel UI
- [ ] Scrollbar colors
- [ ] Selection colors
- [ ] Link colors
- [ ] Avatar gradients
- [ ] Glow effects

### Notes

- Use Tailwind classes where possible (e.g., `from-cyan-500`)
- Use hex codes for custom shades (e.g., `#1a1b24`)
- Maintain consistent opacity values
- Test in both light and dark environments
- Ensure sufficient contrast for accessibility
