# Phase 4: Test Files

**Goal**: Migrate all test files to use ArrayListUnmanaged  
**Estimated Time**: 2-3 sessions (1 day)

**Risk**: MEDIUM - Tests are important but can be fixed incrementally

---

## Test File Inventory (14 files)

Files are listed in suggested migration order (simpler first):

1. ✅ edit-buffer_test.zig - Already uses Unmanaged
2. ✅ text-buffer-segment_test.zig - Already uses Unmanaged
3. utils_test.zig - Simple utilities
4. terminal_test.zig - Terminal I/O tests
5. syntax-style_test.zig - Style registry tests
6. event-bus_test.zig - Event system tests
7. grapheme_test.zig - Grapheme handling tests
8. utf8_test.zig - UTF-8 operations tests
9. buffer_test.zig - Buffer tests
10. rope_test.zig - Rope data structure tests
11. text-buffer-iterators_test.zig - Iterator tests
12. text-buffer_test.zig - Text buffer tests
13. text-buffer-view_test.zig - View tests
14. text-buffer-drawing_test.zig - Drawing tests

---

## Migration Strategy

### Batch Approach
Group tests into 3 batches based on complexity:

**Batch 1: Simple Tests** (Session 1)
- utils_test.zig
- terminal_test.zig
- syntax-style_test.zig
- event-bus_test.zig

**Batch 2: Text Processing Tests** (Session 2)
- grapheme_test.zig
- utf8_test.zig
- buffer_test.zig

**Batch 3: Complex Tests** (Session 3)
- rope_test.zig
- text-buffer-iterators_test.zig
- text-buffer_test.zig
- text-buffer-view_test.zig
- text-buffer-drawing_test.zig

---

## Batch 1: Simple Tests

### File: utils_test.zig
**ArrayList occurrences**: Multiple  
**Complexity**: LOW

#### Steps
1. Find all ArrayList.init():
   ```bash
   grep -n "ArrayList.*\.init" tests/utils_test.zig
   ```

2. Replace each:
   - Type: `ArrayList(T)` → `ArrayListUnmanaged(T)`
   - Init: `.init(allocator)` → `: Type = .{}`
   - Deinit: `.deinit()` → `.deinit(allocator)`
   - Operations: Add allocator parameter

3. Test:
   ```bash
   zig test tests/utils_test.zig
   ```

#### Status
- [ ] Migrated
- [ ] Tests pass

---

### File: terminal_test.zig
**ArrayList occurrences**: Multiple  
**Complexity**: LOW

#### Steps
Same as utils_test.zig

#### Status
- [ ] Migrated
- [ ] Tests pass

---

### File: syntax-style_test.zig
**ArrayList occurrences**: Multiple  
**Complexity**: LOW

**NOTE**: syntax-style.zig already uses Unmanaged, so tests might too

#### Status
- [ ] Migrated (or verified already Unmanaged)
- [ ] Tests pass

---

### File: event-bus_test.zig
**ArrayList occurrences**: Multiple  
**Complexity**: LOW

#### Status
- [ ] Migrated
- [ ] Tests pass

---

### Batch 1 Verification
After completing all Batch 1 files:
```bash
cd packages/core/src/zig
zig test tests/utils_test.zig
zig test tests/terminal_test.zig
zig test tests/syntax-style_test.zig
zig test tests/event-bus_test.zig
```

All should pass ✓

---

## Batch 2: Text Processing Tests

### File: grapheme_test.zig
**ArrayList occurrences**: Multiple  
**Complexity**: MEDIUM

#### Steps
1. Find ArrayList usages
2. Migrate systematically
3. Test:
   ```bash
   zig test tests/grapheme_test.zig
   ```

#### Status
- [ ] Migrated
- [ ] Tests pass

---

### File: utf8_test.zig
**ArrayList occurrences**: Multiple  
**Complexity**: MEDIUM

**NOTE**: This will test the utf8.zig changes from Phase 2

#### Steps
1. Find ArrayList usages
2. Migrate test setup code
3. Update any test assertions if needed
4. Test:
   ```bash
   zig test tests/utf8_test.zig
   ```

#### Status
- [ ] Migrated
- [ ] Tests pass

---

### File: buffer_test.zig
**ArrayList occurrences**: Multiple  
**Complexity**: MEDIUM

**NOTE**: Tests the buffer.zig changes from Phase 2

#### Steps
1. Find ArrayList usages
2. Migrate test setup code
3. Test:
   ```bash
   zig test tests/buffer_test.zig
   ```

#### Status
- [ ] Migrated
- [ ] Tests pass

---

### Batch 2 Verification
```bash
zig test tests/grapheme_test.zig
zig test tests/utf8_test.zig
zig test tests/buffer_test.zig
```

All should pass ✓

---

## Batch 3: Complex Tests

### File: rope_test.zig
**ArrayList occurrences**: Multiple  
**Complexity**: HIGH

**NOTE**: Critical tests for rope.zig from Phase 2

#### Steps
1. Find ArrayList usages - likely many
2. Migrate systematically
3. Pay attention to marker tests
4. Test:
   ```bash
   zig test tests/rope_test.zig
   ```

#### Known Issues
- Rope tests are extensive
- Many test helper functions may need updates
- Marker tests are complex

#### Status
- [ ] Migrated
- [ ] Tests pass

---

### File: text-buffer-iterators_test.zig
**ArrayList occurrences**: Multiple  
**Complexity**: MEDIUM

#### Steps
1. Find ArrayList usages
2. Migrate test code
3. Test:
   ```bash
   zig test tests/text-buffer-iterators_test.zig
   ```

#### Status
- [ ] Migrated
- [ ] Tests pass

---

### File: text-buffer_test.zig
**ArrayList occurrences**: Multiple  
**fmt.format**: 3 occurrences  
**Complexity**: HIGH

#### Steps
1. Find ArrayList usages
2. Update fmt.format calls if not done in Phase 3
3. Migrate test setup code
4. Test:
   ```bash
   zig test tests/text-buffer_test.zig
   ```

#### Status
- [ ] Migrated
- [ ] fmt.format updated
- [ ] Tests pass

---

### File: text-buffer-view_test.zig
**ArrayList occurrences**: Multiple  
**fmt.format**: 4 occurrences  
**Complexity**: HIGH

#### Steps
1. Find ArrayList usages
2. Update fmt.format calls if not done in Phase 3
3. Migrate test code
4. Test:
   ```bash
   zig test tests/text-buffer-view_test.zig
   ```

#### Status
- [ ] Migrated
- [ ] fmt.format updated
- [ ] Tests pass

---

### File: text-buffer-drawing_test.zig
**ArrayList occurrences**: Multiple  
**Complexity**: MEDIUM-HIGH

#### Steps
1. Find ArrayList usages
2. Migrate test code
3. Test:
   ```bash
   zig test tests/text-buffer-drawing_test.zig
   ```

#### Status
- [ ] Migrated
- [ ] Tests pass

---

### Batch 3 Verification
```bash
zig test tests/rope_test.zig
zig test tests/text-buffer-iterators_test.zig
zig test tests/text-buffer_test.zig
zig test tests/text-buffer-view_test.zig
zig test tests/text-buffer-drawing_test.zig
```

All should pass ✓

---

## Phase 4 Completion Checklist

Before moving to Phase 5, verify:

- [ ] All 14 test files reviewed
- [ ] 2 already-Unmanaged files verified
- [ ] 12 files migrated successfully
- [ ] All individual tests pass
- [ ] Full test suite passes

### Full Test Suite
Run everything together:
```bash
cd packages/core/src/zig
zig build test
```

Should see: **All tests passed** ✓

---

## Troubleshooting

### If a test fails:
1. Read error message carefully
2. Check if source file (non-test) needs fixing
3. Check test setup code for missing allocator
4. Verify defer cleanup blocks
5. Check test helper functions

### Common Test Issues:
```zig
// WRONG - test setup
var list = std.ArrayList(T).init(testing.allocator);

// CORRECT
var list: std.ArrayListUnmanaged(T) = .{};
defer list.deinit(testing.allocator);
```

### Memory Leak Detection:
Tests automatically check for leaks with `testing.allocator`
```bash
# If you see "leaked memory" errors:
# 1. Check all deinit() calls have allocator
# 2. Check defer blocks
# 3. Check error paths clean up properly
```

---

## Next Phase

**After Phase 4 completion, proceed to**: [phase-5-bench.md](.migration/phase-5-bench.md)

---

## Progress Tracking

Update MIGRATION_STATUS.md after each batch:

**Batch 1 Complete**: 4/14 test files ✓  
**Batch 2 Complete**: 7/14 test files ✓  
**Batch 3 Complete**: 12/14 test files ✓ (plus 2 already done)

---

## Notes & Issues

*Document any test failures or issues here*

**Example**:
- Issue: rope_test.zig failing on marker cleanup
  - Cause: Forgot to deinit ArrayList in HashMap values
  - Fix: Added cleanup loop
  - Date: 2025-11-19
