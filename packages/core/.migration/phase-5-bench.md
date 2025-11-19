# Phase 5: Benchmark Files

**Goal**: Migrate all benchmark files to use ArrayListUnmanaged  
**Estimated Time**: 1-2 sessions (0.5-1 day)

**Risk**: LOW - Benchmarks are non-critical and can be done in bulk

---

## Benchmark File Inventory (10 files)

All located in `bench/` directory:

1. bench-rope-append.zig
2. bench-rope-insert.zig
3. bench-rope-iterate.zig
4. bench-rope-rewrite.zig
5. bench-rope-split.zig
6. bench-text-buffer-apply-edits.zig
7. bench-text-buffer-segment.zig
8. bench-text-buffer-view.zig
9. bench-utf8-boundary.zig
10. bench-utf8-graphemes.zig

---

## Migration Strategy

### Batch Approach
Since benchmarks are non-critical, we can migrate them in 2 batches:

**Batch 1: Rope Benchmarks** (5 files)
**Batch 2: Text Buffer & UTF-8 Benchmarks** (5 files)

---

## General Pattern for Benchmarks

Benchmarks typically have this structure:
```zig
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    var results = std.ArrayList(f64).init(allocator);
    defer results.deinit();
    
    // ... benchmark code ...
}
```

After migration:
```zig
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    var results: std.ArrayListUnmanaged(f64) = .{};
    defer results.deinit(allocator);
    
    // ... benchmark code with allocator parameters ...
}
```

---

## Batch 1: Rope Benchmarks

### File: bench-rope-append.zig
**Complexity**: LOW  
**ArrayList occurrences**: Multiple

#### Steps
1. Find ArrayList usages:
   ```bash
   grep -n "ArrayList" bench/bench-rope-append.zig
   ```

2. Apply standard migration pattern
3. Run benchmark to verify:
   ```bash
   zig build bench
   # Or run specific benchmark:
   zig run bench/bench-rope-append.zig
   ```

#### Status
- [ ] Migrated
- [ ] Compiles
- [ ] Runs successfully

---

### File: bench-rope-insert.zig
**Complexity**: LOW  
**ArrayList occurrences**: Multiple

#### Status
- [ ] Migrated
- [ ] Compiles
- [ ] Runs successfully

---

### File: bench-rope-iterate.zig
**Complexity**: LOW  
**ArrayList occurrences**: Multiple

#### Status
- [ ] Migrated
- [ ] Compiles
- [ ] Runs successfully

---

### File: bench-rope-rewrite.zig
**Complexity**: LOW  
**ArrayList occurrences**: Multiple

#### Status
- [ ] Migrated
- [ ] Compiles
- [ ] Runs successfully

---

### File: bench-rope-split.zig
**Complexity**: LOW  
**ArrayList occurrences**: Multiple

#### Status
- [ ] Migrated
- [ ] Compiles
- [ ] Runs successfully

---

### Batch 1 Verification
```bash
cd packages/core/src/zig
zig run bench/bench-rope-append.zig
zig run bench/bench-rope-insert.zig
zig run bench/bench-rope-iterate.zig
zig run bench/bench-rope-rewrite.zig
zig run bench/bench-rope-split.zig
```

All should run without errors ✓

---

## Batch 2: Text Buffer & UTF-8 Benchmarks

### File: bench-text-buffer-apply-edits.zig
**Complexity**: LOW  
**ArrayList occurrences**: Multiple

#### Steps
Same as Batch 1 files

#### Status
- [ ] Migrated
- [ ] Compiles
- [ ] Runs successfully

---

### File: bench-text-buffer-segment.zig
**Complexity**: LOW  
**ArrayList occurrences**: Multiple

#### Status
- [ ] Migrated
- [ ] Compiles
- [ ] Runs successfully

---

### File: bench-text-buffer-view.zig
**Complexity**: LOW  
**ArrayList occurrences**: Multiple

#### Status
- [ ] Migrated
- [ ] Compiles
- [ ] Runs successfully

---

### File: bench-utf8-boundary.zig
**Complexity**: LOW  
**ArrayList occurrences**: Multiple

#### Status
- [ ] Migrated
- [ ] Compiles
- [ ] Runs successfully

---

### File: bench-utf8-graphemes.zig
**Complexity**: LOW  
**ArrayList occurrences**: Multiple

#### Status
- [ ] Migrated
- [ ] Compiles
- [ ] Runs successfully

---

### Batch 2 Verification
```bash
zig run bench/bench-text-buffer-apply-edits.zig
zig run bench/bench-text-buffer-segment.zig
zig run bench/bench-text-buffer-view.zig
zig run bench/bench-utf8-boundary.zig
zig run bench/bench-utf8-graphemes.zig
```

All should run without errors ✓

---

## Phase 5 Completion Checklist

Before moving to Phase 6, verify:

- [ ] All 10 benchmark files migrated
- [ ] All benchmarks compile
- [ ] All benchmarks run without errors
- [ ] Build bench target works

### Full Benchmark Suite
```bash
cd packages/core/src/zig
zig build bench
```

Should complete without errors ✓

---

## Performance Baseline (OPTIONAL)

If you want to check for performance regressions:

### Before Migration (0.14.1)
```bash
# Save baseline results
zig run bench/bench-rope-append.zig > results-014-rope-append.txt
zig run bench/bench-text-buffer-view.zig > results-014-text-buffer-view.txt
# etc.
```

### After Migration (0.15.1)
```bash
# Compare results
zig run bench/bench-rope-append.zig > results-015-rope-append.txt
diff results-014-rope-append.txt results-015-rope-append.txt
```

**Expected**: Performance should be similar or better. Unmanaged collections are often faster.

---

## Quick Migration Script (OPTIONAL)

If comfortable with sed, you can batch replace common patterns:

```bash
# BACKUP FIRST!
cp -r bench bench.backup

# Find all ArrayList.init patterns (for review)
grep -r "ArrayList.*\.init" bench/

# NOTE: Don't use automated replacement - too risky
# Better to do manually with pattern awareness
```

---

## Troubleshooting

### If a benchmark fails to compile:
1. Check for missing allocator parameters
2. Check deinit() calls
3. Verify initialization syntax
4. Look for nested ArrayList in data structures

### Common Issues:
```zig
// WRONG - forgot allocator in append
results.append(timing);

// CORRECT
results.append(allocator, timing);

// WRONG - forgot allocator in deinit
defer results.deinit();

// CORRECT
defer results.deinit(allocator);
```

### If benchmark crashes:
- Check for memory leaks
- Verify all cleanup is happening
- Check error handling paths

---

## Next Phase

**After Phase 5 completion, proceed to**: [phase-6-validation.md](.migration/phase-6-validation.md)

---

## Progress Tracking

Update MIGRATION_STATUS.md after each batch:

**Batch 1 Complete**: 5/10 benchmarks ✓  
**Batch 2 Complete**: 10/10 benchmarks ✓

---

## Notes & Issues

*Document any benchmark issues here*

**Example**:
- Issue: bench-rope-append.zig memory leak
  - Cause: Missing cleanup of temporary list
  - Fix: Added defer cleanup
  - Date: 2025-11-19

---

## Performance Notes

*Record any significant performance changes here*

**Example**:
- bench-rope-append: 5% faster on 0.15.1
- bench-text-buffer-view: No significant change
- Overall: Unmanaged versions show slight improvement
