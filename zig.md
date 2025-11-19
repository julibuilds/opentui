Zig 0.14.1 → 0.15.1 Upgrade Plan for packages/core

## Phase 1: Preparation & Build System (Low Risk)
1. Update `build.zig` to add Zig 0.15.0 and 0.15.1 to SUPPORTED_ZIG_VERSIONS
2. Check and update `uucode` dependency to Zig 0.15 compatible version
3. Verify build system compiles on 0.15.1

## Phase 2: Core Data Structures (High Risk - ~163 ArrayList migrations)
**Priority Order by Impact:**

1. **rope.zig** (8+ ArrayLists, critical data structure)
   - Migrate `std.ArrayList` → `std.ArrayListUnmanaged`
   - Update marker cache and HashMap value types
   - Pattern: Add allocator parameter to all list operations

2. **renderer.zig** (7 ArrayLists, critical rendering)
   - Migrate statSamples struct ArrayLists
   - Update BufferedWriter initialization (4 occurrences)
   - Fix fmt.format calls (if any)

3. **buffer.zig** (2 ArrayLists)
   - Migrate scissor_stack and grapheme lists

4. **text-buffer.zig** (2 ArrayLists + 2 HashMaps)
   - Migrate ArrayList returns and event lists
   - Migrate AutoHashMap → AutoHashMapUnmanaged for dirty tracking

5. **utf8.zig** (4 ArrayLists)
   - Migrate break/position/grapheme lists

6. **grapheme.zig** (1 HashMap)
   - Migrate AutoHashMap → AutoHashMapUnmanaged

## Phase 3: I/O & Formatting (Low-Medium Risk - 17 occurrences)
1. **ansi.zig** - Replace `std.fmt.format(writer, ...)` with `writer.print(...)`  (6 occurrences)
2. **rope.zig** - Update debug fmt.format calls (4 occurrences)

## Phase 4: Test Files (Medium Risk - 45+ ArrayLists)
- Batch migrate all 14 test files
- Run test suite after each file: `zig build test`

## Phase 5: Benchmark Files (Low Risk - 70+ ArrayLists)
- Batch migrate all 10 benchmark files
- Run benchmarks: `zig build bench`

## Phase 6: Validation
1. Run full test suite on Zig 0.15.1
2. Run benchmarks to check for performance regressions
3. Test integration with TypeScript/JS FFI layer
4. Cross-platform testing (Linux, macOS, Windows)

## Key Migration Patterns

**ArrayList → ArrayListUnmanaged:**
```zig
// Before
var list = std.ArrayList(T).init(allocator);
try list.append(item);

// After
var list: std.ArrayListUnmanaged(T) = .{};
try list.append(allocator, item);
```

**fmt.format → writer.print:**
```zig
// Before
std.fmt.format(writer, "format {d}", .{val}) catch {...};

// After
writer.print("format {d}", .{val}) catch {...};
```

## Scope
- **~25-30 files** requiring changes
- **~190 code locations** to update
- **Highest risk**: rope.zig, renderer.zig, text-buffer.zig
- **Estimated effort**: 6-8 days of focused work

## Workflow

1. **MIGRATION_STATUS.md** - Central Progress Tracker
- Overview of all 6 phases with completion checkboxes
- Detailed status tables for every file (38 total)
- Statistics: ~163 ArrayList migrations, 5 HashMap migrations, 17 fmt.format updates
- Clear "Next Session Action" pointer
- Status legend with emojis for easy scanning

### 2. **MIGRATION_LOG.md** - Session-by-Session Chronicle
- Chronological record of all changes
- Template for each session (copy-paste ready)
- Quick reference commands for build, test, git
- Statistics tracking across sessions

### 3. **MIGRATION_PATTERNS.md** - Code Reference Guide
- 7 detailed migration patterns with before/after examples
- Real examples from your codebase
- Common gotchas and solutions
- Search patterns for finding occurrences
- Testing strategy for each change

### 4. **.migration/** Directory with Phase Checklists

**phase-1-prep.md** (Build system):
- Update SUPPORTED_ZIG_VERSIONS
- Check uucode dependency
- Verify build APIs
- Clean build test

**phase-2-core.md** (Critical path - 6 files):
- Detailed file-by-file migration plans
- Exact line numbers for changes
- Dependency order (rope → text-buffer → renderer)
- Risk warnings for critical files
- Memory leak detection steps

**phase-3-io.md** (Formatting - 2 files):
- Simple fmt.format → writer.print updates
- Low risk, straightforward replacements

**phase-4-tests.md** (14 test files):
- Organized into 3 batches by complexity
- Batch testing approach
- Test-specific troubleshooting

**phase-5-bench.md** (10 benchmark files):
- 2 batches: rope benchmarks + text/UTF-8 benchmarks
- Optional performance baseline tracking
- Low priority, can be done quickly

**phase-6-validation.md** (Final checks):
- 10-point validation checklist
- Cross-platform verification
- Performance regression checks
- Sign-off criteria
- Rollback plan if needed

## How It Works Across Sessions

### Starting Any Session:
1. Read `MIGRATION_STATUS.md` → See current state
2. Check "Next Session Action" → Know exactly what to do
3. Open relevant `.migration/phase-X.md` → Get detailed steps
4. Refer to `MIGRATION_PATTERNS.md` → See code examples

### During Session:
- Follow phase checklist step-by-step
- Reference patterns guide as needed
- Mark items complete in phase file

### Ending Session:
1. Update `MIGRATION_STATUS.md` with progress (change ⬜ to ✅)
2. Add entry to `MIGRATION_LOG.md` with what was done
3. Update "Next Session Action" for next time
4. Note any blockers/issues

## Key Features

✅ **Session-independent**: Any Claude Code instance can pick up where the last left off  
✅ **No ambiguity**: Always clear what to do next  
✅ **Risk-aware**: Critical files marked with warnings  
✅ **Dependency-aware**: Files ordered by dependencies  
✅ **Testable**: Clear verification steps after each change  
✅ **Recoverable**: Git commands and rollback plans included  

## Next Steps

The system is ready! The next session should start with:
```
File: packages/core/src/zig/build.zig
Task: Add Zig 0.15.0 and 0.15.1 to SUPPORTED_ZIG_VERSIONS
See: .migration/phase-1-prep.md
```

Everything is documented, tracked, and ready for incremental progress across as many sessions as needed!
