# Phase 3: I/O & Formatting

**Goal**: Update fmt.format calls to writer.print  
**Estimated Time**: 1 session (0.5 days)

**Risk**: LOW - These are straightforward replacements

---

## File 1: ansi.zig

**Priority**: MEDIUM  
**Complexity**: LOW  
**Risk**: LOW (formatting only)

### Changes Required

#### fmt.format → writer.print (6 occurrences)
- Line 24: ANSI sequence generation
- Line 28: ANSI sequence generation
- Line 32: ANSI sequence generation
- Line 54: ANSI sequence generation
- Line 58: ANSI sequence generation
- Line 134: ANSI sequence generation

### Migration Pattern

**Before**:
```zig
pub fn moveTo(writer: anytype, x: u32, y: u32) AnsiError!void {
    std.fmt.format(writer, "\x1b[{d};{d}H", .{ y + 1, x + 1 }) catch return AnsiError.WriteFailed;
}
```

**After**:
```zig
pub fn moveTo(writer: anytype, x: u32, y: u32) AnsiError!void {
    writer.print("\x1b[{d};{d}H", .{ y + 1, x + 1 }) catch return AnsiError.WriteFailed;
}
```

### Migration Steps

1. Find all fmt.format calls:
   ```bash
   grep -n "std.fmt.format" src/zig/ansi.zig
   ```

2. For each occurrence:
   - Remove `std.fmt.format(`
   - Add `writer.print(`
   - Keep the format string and arguments unchanged
   - Keep error handling unchanged

3. Verify all functions:
   - moveTo()
   - setForeground()
   - setBackground()
   - setCursorStyle()
   - etc.

### Testing
```bash
zig build
# ansi.zig doesn't have dedicated tests, but is used by renderer
# Verify through renderer tests
```

### Quick Verification Script
```bash
# Should return empty (no more std.fmt.format calls)
grep "std.fmt.format" src/zig/ansi.zig
```

### Status
- [ ] All 6 fmt.format calls updated
- [ ] Compiles without errors
- [ ] Renderer still works (smoke test)

---

## File 2: rope.zig (Debug Output - OPTIONAL)

**Priority**: LOW  
**Complexity**: LOW  
**Risk**: VERY LOW (debug only)

### Changes Required

#### fmt.format → writer.print (4 occurrences)
- Line 784: Debug output
- Line 787: Debug output
- Line 790: Debug output
- Line 800: Debug output

**NOTE**: These are in debug/diagnostic code only. Can be skipped if time-constrained.

### Migration Steps

Same as ansi.zig:
1. Find occurrences
2. Replace `std.fmt.format(writer, ...)` with `writer.print(...)`
3. Verify compilation

### Testing
```bash
zig test tests/rope_test.zig
```

### Status
- [ ] Debug fmt.format calls updated (or marked as skipped)
- [ ] Compiles without errors
- [ ] Tests pass

---

## File 3: Test Files (OPTIONAL)

**Priority**: LOW  
**Complexity**: LOW  
**Risk**: VERY LOW

### Files with fmt.format in Tests

#### text-buffer_test.zig (3 occurrences)
- Lines 363, 366, 268: Test string generation

#### text-buffer-view_test.zig (4 occurrences)
- Lines 1561, 1563, 2468, 2470: Test string generation

### Migration Steps

These are in test files only, so can be done in bulk:

```bash
# Find all in tests
grep -n "std.fmt.format" tests/*.zig
```

For each file:
1. Replace `std.fmt.format(writer, ...)` with `writer.print(...)`
2. Run the specific test

### Status
- [ ] text-buffer_test.zig updated
- [ ] text-buffer-view_test.zig updated
- [ ] All tests pass

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] ansi.zig fmt.format calls migrated
- [ ] rope.zig debug calls migrated (or skipped)
- [ ] Test file calls migrated (or skipped)
- [ ] All files compile
- [ ] No new errors introduced

### Success Criteria
1. ansi.zig has zero `std.fmt.format` calls
2. Build succeeds
3. Rendering still works correctly

---

## Search Commands

Find remaining fmt.format calls across entire codebase:
```bash
cd packages/core/src/zig
grep -r "std\.fmt\.format" --include="*.zig" .
```

---

## Next Phase

**After Phase 3 completion, proceed to**: [phase-4-tests.md](.migration/phase-4-tests.md)

---

## Notes & Issues

*Document any problems encountered here*
