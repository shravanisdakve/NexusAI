# Quick Integration Guide for New Components

## EmptyState Component

### 1. Notes Page - No Notes
**File**: `pages/Notes.tsx`
**Location**: Line 630 (currently shows "No notes yet.")
**Current**:
```tsx
{notes.length === 0 && (
  <p className="text-center text-slate-400 p-4 text-sm">No notes yet.</p>
)}
```

**Replace with**:
```tsx
import EmptyState from '../components/EmptyState';
import { FileText } from 'lucide-react';

{notes.length === 0 && (
  <EmptyState
    icon={FileText}
    title="No notes yet"
    description="Start building your knowledge base by creating your first note or uploading study materials."
    action={{
      label: "Add Your First Note",
      onClick: onAddNoteClick
    }}
    tips={[
      "Upload PDFs, PPTX, or audio files for automatic text extraction",
      "AI will generate flashcards from your notes",
      "Organize everything by course for easy access"
    ]}
  />
)}
```

---

### 2. Notes Page - No Course Selected
**File**: `pages/Notes.tsx`
**Location**: Line 539-541
**Current**:
```tsx
<div className="flex-1 flex items-center justify-center bg-slate-800/50 rounded-xl ring-1 ring-slate-700">
  <p className="text-slate-400">Please select a course to view your notes.</p>
</div>
```

**Replace with**:
```tsx
import { BookOpen } from 'lucide-react';

<div className="flex-1 flex items-center justify-center bg-slate-800/50 rounded-xl ring-1 ring-slate-700">
  <EmptyState
    icon={BookOpen}
    title="Select a Course"
    description="Choose a course from the dropdown above to view and manage your notes and study materials."
    action={{
      label: "Create New Course",
      onClick: handleAddCourse
    }}
    tips={[
      "Each course has its own notes, flashcards, and study plans",
      "Organize your learning by semester or subject area"
    ]}
  />
</div>
```

---

### 3. Insights Page - No Gaps
**File**: `pages/Insights.tsx`
**Find**: "No significant gaps detected yet"
**Replace with**:
```tsx
import EmptyState from '../components/EmptyState';
import { TrendingUp } from 'lucide-react';

<EmptyState
  icon={TrendingUp}
  title="No Knowledge Gaps Detected"
  description="You're doing great! We haven't identified any problem areas yet. Keep practicing to help our AI identify areas for improvement."
  action={{
    label: "Take a Practice Quiz",
    onClick: () => navigate('/quizzes')
  }}
  tips={[
    "Complete more quizzes to get detailed insights",
    "AI analyzes your performance to find weak spots",
    "Regular practice helps track your progress over time"
  ]}
/>
```

---

### 4. Flashcards - No Flashcards
**File**: `pages/Notes.tsx`  
**Location**: Line 995
**Current**:
```tsx
<p className="text-slate-400">No flashcards generated yet. Use the buttons above to create some!</p>
```

**Replace with**:
```tsx
import { Layers } from 'lucide-react';

<EmptyState
  icon={Layers}
  title="No Flashcards Yet"
  description="Generate flashcards from your notes or upload a file to create your first study deck."
  action={{
    label: "Generate from Notes",
    onClick: onGenerateFromNotes,
    variant: "primary"
  }}
  tips={[
    "Flashcards use spaced repetition for better retention",
    "AI extracts key concepts automatically",
    "Review cards regularly to boost memory"
  ]}
  className="py-12"
/>
```

---

## Skeleton Loaders

### 1. Dashboard - Loading Cards
**File**: `pages/Dashboard.tsx`
**Add Loading State**:
```tsx
import { CardSkeleton } from '../components/Skeleton';

const [isLoading, setIsLoading] = useState(true);

// In component
{isLoading ? (
  <CardSkeleton count={6} />
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Actual cards */}
  </div>
)}
```

---

### 2. Notes - Loading Notes List
**File**: `pages/Notes.tsx`
**Add to notes list section**:
```tsx
import { ListSkeleton } from '../components/Skeleton';

const [isLoadingNotes, setIsLoadingNotes] = useState(false);

// In the notes list section
<div className="flex-1 overflow-y-auto">
  {isLoadingNotes ? (
    <div className="p-4">
      <ListSkeleton count={5} />
    </div>
  ) : notes.length === 0 ? (
    <EmptyState ... />
  ) : (
    notes.map(note => ...)
  )}
</div>
```

---

### 3. Study Lobby - Loading Rooms
**File**: `pages/StudyLobby.tsx`
**Wrap room cards**:
```tsx
import { CardSkeleton } from '../components/Skeleton';

{isLoadingRooms ? (
  <CardSkeleton count={4} />
) : (
  rooms.map(room => <RoomCard key={room.id} room={room} />)
)}
```

---

## Enhanced Buttons

### 1. Update Button Variants Throughout App

**Danger Actions** (Delete, Remove, etc.):
```tsx
// Old
<Button className="bg-red-600">Delete</Button>

// New
<Button variant="danger">Delete</Button>
```

**Secondary Actions** (Cancel, Close, etc.):
```tsx
// Old
<Button className="bg-slate-700">Cancel</Button>

// New
<Button variant="secondary">Cancel</Button>
```

**Subtle Actions** (Icon buttons, menu items):
```tsx
// Old
<button className="...complex classes...">

// New
<Button variant="ghost" size="sm">
```

**Outline Style** (Edit, More Options):
```tsx
<Button variant="outline">Edit Profile</Button>
```

**Success Actions** (Complete, Confirm):
```tsx
<Button variant="success">Mark Complete</Button>
```

---

### 2. Loading States
**Replace all `isLoading` logic**:
```tsx
// Old
<Button disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>

// New
<Button isLoading={isSubmitting}>
  Save
</Button>
```

---

### 3. Size Variants
**Small buttons** (icon buttons, compact UI):
```tsx
<Button size="sm" variant="ghost">
  <Edit size={14} />
</Button>
```

**Large buttons** (primary CTAs):
```tsx
<Button size="lg" variant="primary">
  Get Started
</Button>
```

---

## Form Inputs - No Changes Needed!

The enhanced Input, Textarea, and Select components are **drop-in replacements**. All existing code will automatically benefit from:
- Better contrast
- Improved focus states
- Hover effects
- Disabled states

**No migration needed** - just enjoy the improvements!

---

## Design Tokens Usage

### In Custom Components
```tsx
// Instead of hardcoded values
<div className="p-6 rounded-xl">

// Use tokens for consistency
<div style={{ 
  padding: 'var(--spacing-lg)', 
  borderRadius: 'var(--radius-xl)' 
}}>

// Or in CSS file
.my-card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}
```

### Common Patterns
```css
/* Card pattern */
.card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
}

/* Card hover */
.card:hover {
  border-color: var(--border-secondary);
  box-shadow: var(--shadow-md);
}

/* Spacing utilities */
.section {
  margin-bottom: var(--spacing-2xl);
}

.tight-spacing {
  gap: var(--spacing-sm);
}
```

---

## Priority Integration Order

### Week 1 - High Impact
1. ✅ Notes page empty states (most visible)
2. ✅ Dashboard loading skeletons
3. ✅ Update all danger buttons to `variant="danger"`
4. ✅ Convert loading states to use `isLoading` prop

### Week 2 - Polish
5. ✅ Insights page empty states
6. ✅ Study lobby loading states
7. ✅ Convert all secondary/ghost buttons
8. ✅ Apply design tokens to custom components

### Week 3 - Refinement
9. ✅ Audit all empty states across app
10. ✅ Standardize all loading patterns
11. ✅ Create reusable Card component using tokens
12. ✅ Document component usage in team wiki

---

## Testing Checklist

### After Integration
- [ ] Test empty states with no data
- [ ] Test loading states (slow network simulation)
- [ ] Test all button variants
- [ ] Test keyboard navigation (Tab key)
- [ ] Test focus indicators are visible
- [ ] Test disabled states
- [ ] Test on mobile viewport
- [ ] Test screen reader compatibility

### Accessibility Check
- [ ] All interactive elements have visible focus
- [ ] Color contrast meets WCAG AA
- [ ] Semantic HTML used correctly
- [ ] ARIA labels on icon-only buttons
- [ ] Keyboard navigation works everywhere

---

## Common Issues & Solutions

### Issue: EmptyState icon not showing
**Solution**: Import the icon from lucide-react
```tsx
import { FileText } from 'lucide-react';
<EmptyState icon={FileText} ... />
```

### Issue: Skeleton not showing
**Solution**: Wrap in container with defined height
```tsx
<div className="min-h-[400px]">
  <CardSkeleton count={3} />
</div>
```

### Issue: Button variant not working
**Solution**: Ensure you're passing string, not variable
```tsx
// Wrong
<Button variant={danger}>

// Correct
<Button variant="danger">
```

### Issue: Design tokens not applying
**Solution**: Check that index.css imports design-tokens.css
```css
/* At top of index.css */
@import './styles/design-tokens.css';
```

---

## Need Help?

1. Check the full improvement plan: `.agent/UIUX_IMPROVEMENT_PLAN.md`
2. Check what's been completed: `.agent/IMPROVEMENTS_COMPLETED.md`
3. Review component source code for usage examples
4. Test in isolation before integrating

---

**Last Updated**: 2026-02-04
**Maintained By**: Shravani Dakve
