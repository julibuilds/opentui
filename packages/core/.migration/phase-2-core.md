# Phase 2: Core Data Structures

**Goal**: Migrate critical core data structures to Zig 0.15.1  
**Estimated Time**: 5-6 sessions (2-3 days)

**WARNING**: This is the CRITICAL PATH. These files are foundational and changes can break everything.

---

## Migration Order (by dependency)

1. rope.zig (no dependencies on others)
2. utf8.zig (used by buffer.zig)
3. grapheme.zig (used by buffer.zig)
4. buffer.zig (depends on utf8, grapheme)
5. text-buffer.zig (depends on rope)
6. renderer.zig (depends on buffer, ansi)

---

## File 1: rope.zig (CRITICAL - Allocate full session)

**Priority**: ⚠️ HIGHEST  
**Complexity**: ⚠️ VERY HIGH  
**Risk**: ⚠️ CRITICAL  

### Changes Required

#### ArrayList Migrations (8+ occurrences)
- Line 294: `std.ArrayList` usage
- Line 321: `std.ArrayList` usage
- Line 527: `std.ArrayList` usage
- Line 750: `std.ArrayList` usage
- Line 760: `std.ArrayList` usage
- Line 928: `std.ArrayList` usage
- Line 1118: `std.ArrayList` usage
- Line 1167: `std.ArrayList` usage

#### HashMap Migrations (2 occurrences)
- Line 41: `MarkerCache` struct with `std.AutoHashMap`
  ```zig
  // Before
  markers: std.AutoHashMap(u32, std.ArrayList(MarkerPosition))
  
  // After
  markers: std.AutoHashMapUnmanaged(u32, std.ArrayListUnmanaged(MarkerPosition))
  ```

- Line 47: HashMap initialization in methods

#### fmt.format Migrations (4 occurrences - LOW PRIORITY, debug only)
- Line 784: Debug output
- Line 787: Debug output
- Line 790: Debug output
- Line 800: Debug output

### Migration Steps

1. **First: Update MarkerCache struct**
   - Change HashMap type to Unmanaged
   - Change ArrayList value type to Unmanaged
   - Update all cache methods to accept allocator

2. **Second: Find all ArrayList.init() calls**
   ```bash
   grep -n "ArrayList.*\.init" src/zig/rope.zig
   ```

3. **Third: Update each occurrence systematically**
   - Change initialization
   - Update all .append/.appendSlice/.insert calls
   - Update deinit calls
   - Check cleanup in defer blocks

4. **Fourth: Update HashMap operations**
   - put() → put(allocator, ...)
   - Check iteration/cleanup code

5. **Fifth: Update debug fmt.format (optional)**
   - Can be done later if time-constrained

### Testing
```bash
cd packages/core/src/zig
zig test tests/rope_test.zig
```

### Known Issues
- Marker tracking is complex - be careful with cleanup
- Many nested data structures (HashMap of ArrayLists)
- Performance critical - verify benchmarks after

### Status
- [ ] MarkerCache struct updated
- [ ] All ArrayList migrations complete
- [ ] All HashMap migrations complete
- [ ] Compiles without errors
- [ ] rope_test.zig passes
- [ ] No memory leaks detected

---

## File 2: utf8.zig

**Priority**: HIGH  
**Complexity**: MEDIUM  
**Risk**: HIGH (used everywhere)

### Changes Required

#### ArrayList Migrations (4 occurrences)
- Line 63: `std.ArrayList` type
- Line 67: Initialization
- Line 81: `std.ArrayList` type
- Line 85: Initialization
- Line 104: `std.ArrayList` type
- Line 108: Initialization
- Line 1310: `std.ArrayList` type
- Line 1314: Initialization

### Migration Steps

1. Find all ArrayList usages:
   ```bash
   grep -n "ArrayList" src/zig/utf8.zig
   ```

2. Update each function systematically
   - Common pattern: break position lists, grapheme lists
   - Update return types if functions return ArrayLists
   - Update all callers to pass allocator

3. Check for helper functions that create lists

### Testing
```bash
zig test tests/utf8_test.zig
```

### Status
- [ ] All ArrayList migrations complete
- [ ] Return types updated
- [ ] Compiles without errors
- [ ] utf8_test.zig passes

---

## File 3: grapheme.zig

**Priority**: MEDIUM  
**Complexity**: LOW  
**Risk**: MEDIUM

**NOTE**: This file already uses `ArrayListUnmanaged` in some places!

### Changes Required

#### HashMap Migration (1 occurrence)
- Lines 365, 370: `std.AutoHashMap(u32, void)` for ID tracking

### Migration Steps

1. Find AutoHashMap usage:
   ```bash
   grep -n "AutoHashMap" src/zig/grapheme.zig
   ```

2. Update to AutoHashMapUnmanaged
3. Add allocator parameters to put/remove operations

### Testing
```bash
zig test tests/grapheme_test.zig
```

### Status
- [ ] HashMap migration complete
- [ ] Compiles without errors
- [ ] grapheme_test.zig passes

---

## File 4: buffer.zig

**Priority**: HIGH  
**Complexity**: MEDIUM  
**Risk**: HIGH (rendering critical)

**Dependencies**: Requires utf8.zig and grapheme.zig to be done first

### Changes Required

#### ArrayList Migrations (2 occurrences)
- Line 138: `scissor_stack: std.ArrayList(ClipRect)`
- Line 161: Initialization
- Line 676: `std.ArrayList(utf8.GraphemeInfo)`

### Migration Steps

1. Update Buffer struct:
   ```zig
   // Before
   scissor_stack: std.ArrayList(ClipRect),
   
   // After
   scissor_stack: std.ArrayListUnmanaged(ClipRect),
   ```

2. Update init/deinit methods
3. Update all push/pop operations on scissor_stack
4. Update grapheme list creation

### Testing
```bash
zig test tests/buffer_test.zig
```

### Status
- [ ] scissor_stack migrated
- [ ] Grapheme list migrated
- [ ] Compiles without errors
- [ ] buffer_test.zig passes

---

## File 5: text-buffer.zig (CRITICAL)

**Priority**: ⚠️ HIGHEST  
**Complexity**: HIGH  
**Risk**: ⚠️ CRITICAL

**Dependencies**: Requires rope.zig to be done first

### Changes Required

#### ArrayList Migrations (2 occurrences)
- Line 408: Return type `std.ArrayList(Segment)`
- Line 413: ArrayList initialization
- Line 647: `std.ArrayList(Event)`

#### HashMap Migrations (2 occurrences)
- Lines 69, 102: `std.AutoHashMap(usize, void)` for dirty lines tracking
- Line 667: Another HashMap usage

### Migration Steps

1. Update return types for functions returning ArrayList
2. Update all callers of those functions
3. Update HashMap for dirty tracking:
   ```zig
   // Before
   dirty_lines: std.AutoHashMap(usize, void)
   
   // After
   dirty_lines: std.AutoHashMapUnmanaged(usize, void)
   ```

4. Update event list
5. Check all put/get operations on maps

### Testing
```bash
zig test tests/text-buffer_test.zig
zig test tests/text-buffer-view_test.zig
zig test tests/text-buffer-drawing_test.zig
zig test tests/text-buffer-iterators_test.zig
zig test tests/text-buffer-segment_test.zig
```

### Status
- [ ] Return types updated
- [ ] ArrayList migrations complete
- [ ] HashMap migrations complete
- [ ] Compiles without errors
- [ ] All text-buffer tests pass

---

## File 6: renderer.zig (CRITICAL)

**Priority**: ⚠️ HIGHEST  
**Complexity**: HIGH  
**Risk**: ⚠️ CRITICAL (main rendering path)

**Dependencies**: Requires buffer.zig to be done first

### Changes Required

#### ArrayList Migrations (7 occurrences)
- Lines 72-78: `statSamples` struct with 7 ArrayList fields:
  ```zig
  drawTime: std.ArrayList(f64)
  drawCalls: std.ArrayList(u32)
  totalCells: std.ArrayList(u32)
  dirtyLines: std.ArrayList(u32)
  visibleLines: std.ArrayList(u32)
  styledRuns: std.ArrayList(u32)
  memUsage: std.ArrayList(f64)
  ```

- Lines 158-164: Initialization in create()
- Lines 344, 352: Helper functions

#### BufferedWriter Changes (4 occurrences)
- Lines 83, 149, 151, 154: BufferedWriter initialization
- May need to update flush() calls

### Migration Steps

1. **Update StatSamples struct**:
   ```zig
   const StatSamples = struct {
       drawTime: std.ArrayListUnmanaged(f64),
       drawCalls: std.ArrayListUnmanaged(u32),
       totalCells: std.ArrayListUnmanaged(u32),
       dirtyLines: std.ArrayListUnmanaged(u32),
       visibleLines: std.ArrayListUnmanaged(u32),
       styledRuns: std.ArrayListUnmanaged(u32),
       memUsage: std.ArrayListUnmanaged(f64),
       
       pub fn deinit(self: *StatSamples, allocator: std.mem.Allocator) void {
           self.drawTime.deinit(allocator);
           self.drawCalls.deinit(allocator);
           self.totalCells.deinit(allocator);
           self.dirtyLines.deinit(allocator);
           self.visibleLines.deinit(allocator);
           self.styledRuns.deinit(allocator);
           self.memUsage.deinit(allocator);
       }
   };
   ```

2. Update create() method to initialize with `.{}`

3. Update all stat recording methods to pass allocator

4. Check BufferedWriter usage - verify flush() is called appropriately

### Testing
```bash
zig build
# Test the renderer through integration tests
```

### Status
- [ ] StatSamples struct updated
- [ ] All ArrayList operations updated
- [ ] BufferedWriter verified
- [ ] Compiles without errors
- [ ] Integration tests pass

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] All 6 core files migrated
- [ ] All files compile without errors
- [ ] All unit tests pass
- [ ] No memory leaks detected
- [ ] Manual smoke test of basic functionality

### Critical Success Criteria
1. rope_test.zig passes ✓
2. text-buffer_test.zig passes ✓
3. buffer_test.zig passes ✓
4. Full build succeeds ✓
5. No memory leaks ✓

---

## Risk Mitigation

### If a file breaks badly:
1. Check MIGRATION_PATTERNS.md for correct patterns
2. Revert file with git: `git checkout -- <file>`
3. Try again more carefully
4. Consider asking for help/review

### If tests fail:
1. Check error messages carefully
2. Look for missing allocator parameters
3. Check deinit() calls have allocator
4. Verify cleanup in defer blocks

### If memory leaks:
1. Check all deinit() calls have allocator parameter
2. Check defer blocks for proper cleanup
3. Look for HashMap values that need individual cleanup
4. Use `zig build test -Doptimize=Debug` for better leak detection

---

## Next Phase

**After Phase 2 completion, proceed to**: [phase-3-io.md](.migration/phase-3-io.md)

---

## Notes & Issues

*Document any problems encountered here*
