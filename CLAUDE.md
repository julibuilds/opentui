# Zig 0.14.1 → 0.15.1 Migration Workflow

**Project**: OpenTUI Core Package  
**Location**: `packages/core/src/zig/`  
**Status**: In Progress (Phase 1)

---

## Quick Start for New Sessions

### Prerequisites

- Use `zvm` CLI tool to ensure Zig version is set to 0.15.1
- Update path

### 1. Check Current State (2 min)
```bash
cd packages/core
cat MIGRATION_STATUS.md | head -20  # See current phase and next action
cat MIGRATION_STATUS.md | grep "🟡"  # Find in-progress files
```

### 2. Understand the Task
- Read the "Next Session Action" section at bottom of `MIGRATION_STATUS.md`
- Open the relevant phase checklist in `.migration/phase-X.md`
- Reference `MIGRATION_PATTERNS.md` for code patterns

### 3. Start Working
- Mark file as 🟡 In Progress in `MIGRATION_STATUS.md`
- Follow the phase checklist step-by-step
- Test after each file completion

---

## Migration Overview

This is a **multi-session refactor** to upgrade Zig from 0.14.1 to 0.15.1. The work is organized into 6 phases with ~38 files requiring changes.

**Key Changes:**
- `std.ArrayList(T)` → `std.ArrayListUnmanaged(T)` (~163 occurrences)
- `std.AutoHashMap(K,V)` → `std.AutoHashMapUnmanaged(K,V)` (~5 occurrences)
- `std.fmt.format(writer, ...)` → `writer.print(...)` (~17 occurrences)

**Critical Files** (high risk, must be careful):
- `rope.zig` - Core data structure with complex marker tracking
- `renderer.zig` - Critical rendering logic
- `text-buffer.zig` - Core buffer management

---

## The 4 Essential Files

Your workflow depends on these tracking files:

### 1. MIGRATION_STATUS.md (Single Source of Truth)
- **Purpose**: Shows exactly what's done, in-progress, and remaining
- **Update**: After EVERY file completion (change ⬜ to ✅)
- **Location**: `packages/core/MIGRATION_STATUS.md`
- **Check First**: Always read this file at session start

### 2. MIGRATION_LOG.md (Session History)
- **Purpose**: Chronological record of all changes
- **Update**: At END of each session with summary
- **Template**: Copy the session template at line 18
- **Location**: `packages/core/MIGRATION_LOG.md`

### 3. MIGRATION_PATTERNS.md (Code Reference)
- **Purpose**: Before/after examples for all migration patterns
- **Use**: Reference while coding for correct syntax
- **Location**: `packages/core/MIGRATION_PATTERNS.md`
- **Contains**: 7 patterns, gotchas, real examples from codebase

### 4. .migration/phase-X.md (Step-by-Step Checklists)
- **Purpose**: Detailed instructions for each phase
- **Use**: Follow during active work
- **Location**: `packages/core/.migration/phase-{1-6}-*.md`
- **Update**: Check off items as you complete them

---

## Session Workflow (Follow This Every Time)

### A. Starting a Session (5 min)

1. **Read Status**
   ```bash
   cat packages/core/MIGRATION_STATUS.md | head -50
   ```
   - Check "Overall Progress" section
   - Find "Next Session Action" at bottom
   - Note any blockers/issues

2. **Review Phase Checklist**
   - Open `.migration/phase-X.md` for current phase
   - Understand the specific task
   - Note dependencies (e.g., rope.zig must be done before renderer.zig)

3. **Read Migration Patterns**
   - Refresh memory on code patterns from `MIGRATION_PATTERNS.md`
   - Keep this file open for reference

### B. During Work (Iterative)

For each file:

1. **Mark In Progress** (update MIGRATION_STATUS.md)
   - Change ⬜ to 🟡 for current file

2. **Read the File**
   ```bash
   cd packages/core/src/zig
   cat src/<filename>  # Understand current code
   ```

3. **Make Changes**
   - Follow the patterns from MIGRATION_PATTERNS.md
   - Use the phase checklist for file-specific guidance
   - **CRITICAL**: Add allocator parameter to all Unmanaged operations

4. **Compile Check**
   ```bash
   zig build
   ```
   - Fix compilation errors before proceeding

5. **Run Tests**
   ```bash
   zig build test
   ```
   - For test files: Must pass before marking complete
   - For source files: Full test suite should still pass

6. **Mark Complete** (update MIGRATION_STATUS.md)
   - Change 🟡 to ✅
   - Add notes about test results

7. **Commit Changes**
   ```bash
   git add packages/core/src/zig/<filename>
   git commit -m "zig: migrate <filename> to 0.15.1"
   ```

### C. Ending a Session (5-10 min)

1. **Update MIGRATION_LOG.md**
   - Copy session template
   - Fill in:
     - Files completed
     - ArrayList/HashMap/fmt.format counts
     - Test results
     - Any issues encountered
     - Next file to work on

2. **Update MIGRATION_STATUS.md**
   - Ensure all completed files marked ✅
   - Update "Next Session Action" section
   - Note any new blockers

3. **Final Commit**
   ```bash
   git add packages/core/MIGRATION_*.md
   git commit -m "zig: update migration tracking (session N)"
   ```

---

## Phase Guide (What to Expect)

### Phase 1: Preparation (Low Risk) - ~30 min
- **Files**: build.zig, build.zig.zon
- **Task**: Update version support, check dependencies
- **Test**: `zig build` should complete
- **Checklist**: `.migration/phase-1-prep.md`

### Phase 2: Core Data Structures (HIGH RISK) - ~4-6 hours
- **Files**: rope.zig, renderer.zig, buffer.zig, text-buffer.zig, utf8.zig, grapheme.zig
- **Task**: Migrate ArrayLists and HashMaps in critical code
- **Test**: Full test suite must pass after each file
- **Checklist**: `.migration/phase-2-core.md`
- **ORDER MATTERS**: rope.zig → text-buffer.zig → renderer.zig

### Phase 3: I/O & Formatting (Low Risk) - ~1 hour
- **Files**: ansi.zig, rope.zig debug
- **Task**: Replace fmt.format with writer.print
- **Test**: `zig build test`
- **Checklist**: `.migration/phase-3-io.md`

### Phase 4: Test Files (Medium Risk) - ~3-4 hours
- **Files**: 14 test files
- **Task**: Migrate test code ArrayList usage
- **Test**: Each test must pass before moving on
- **Checklist**: `.migration/phase-4-tests.md`
- **Strategy**: Work in batches of 3-4 files

### Phase 5: Benchmark Files (Low Risk) - ~2-3 hours
- **Files**: 10 benchmark files
- **Task**: Migrate benchmark ArrayList usage
- **Test**: `zig build bench` should run
- **Checklist**: `.migration/phase-5-bench.md`
- **Can work quickly**: These are less critical

### Phase 6: Validation (CRITICAL) - ~1 hour
- **Task**: Full system verification
- **Tests**: All tests, all benchmarks, integration tests
- **Checklist**: `.migration/phase-6-validation.md`
- **Sign-off**: Don't skip this!

---

## Common Patterns (Quick Reference)

### ArrayList Migration
```zig
// Before (0.14.1)
var list = std.ArrayList(T).init(allocator);
try list.append(item);
defer list.deinit();

// After (0.15.1)
var list: std.ArrayListUnmanaged(T) = .{};
try list.append(allocator, item);
defer list.deinit(allocator);
```

### HashMap Migration
```zig
// Before (0.14.1)
var map = std.AutoHashMap(K, V).init(allocator);
try map.put(key, val);

// After (0.15.1)
var map: std.AutoHashMapUnmanaged(K, V) = .{};
try map.put(allocator, key, val);
```

### Format Migration
```zig
// Before (0.14.1)
try std.fmt.format(writer, "text {d}", .{x});

// After (0.15.1)
try writer.print("text {d}", .{x});
```

**Full patterns with gotchas**: See `MIGRATION_PATTERNS.md`

---

## Critical Rules

### DO:
- ✅ Read MIGRATION_STATUS.md at start of EVERY session
- ✅ Mark files as 🟡 before starting work
- ✅ Run tests after EVERY file
- ✅ Commit after each file completion
- ✅ Update tracking files at end of session
- ✅ Follow dependency order in Phase 2 (rope → text-buffer → renderer)
- ✅ Reference MIGRATION_PATTERNS.md for correct syntax

### DON'T:
- ❌ Skip test runs (they catch memory leaks)
- ❌ Work on multiple files without testing between
- ❌ Forget to add allocator parameter to Unmanaged operations
- ❌ Ignore compilation warnings
- ❌ Skip updating MIGRATION_STATUS.md (you'll lose track)
- ❌ Work on Phase 2 files out of order (dependencies matter!)

---

## Troubleshooting

### Build Fails After Migration
1. Check all `.append()` calls have allocator
2. Check all `.deinit()` calls have allocator
3. Check struct initialization uses `.{}` not `.init()`
4. Search for compilation errors mentioning "expected X arguments, found Y"

### Tests Fail After Migration
1. Check for memory leaks in test output
2. Verify defer statements include allocator
3. Check HashMap value types if using ArrayList as value
4. Run specific test: `zig test src/zig/tests/<file>_test.zig`

### Memory Leaks Detected
1. Check all lists/maps have `defer X.deinit(allocator)`
2. For HashMap values that are lists, iterate and deinit each
3. Pattern:
   ```zig
   defer {
       var it = map.valueIterator();
       while (it.next()) |list| list.deinit(allocator);
       map.deinit(allocator);
   }
   ```

### Lost Track of Progress
1. Read MIGRATION_STATUS.md completely
2. Check git log: `git log --oneline | grep "zig:"`
3. Review MIGRATION_LOG.md for last session notes

---

## Useful Commands

### Check Progress
```bash
cd packages/core
grep "✅" MIGRATION_STATUS.md | wc -l  # Count completed
grep "⬜" MIGRATION_STATUS.md | wc -l  # Count remaining
```

### Build & Test
```bash
cd packages/core/src/zig
zig build                 # Compile
zig build test            # Run all tests
zig build bench           # Run benchmarks
zig test src/<file>.zig   # Run specific test
```

### Search for Migration Targets
```bash
cd packages/core/src/zig
grep -n "ArrayList.*\.init(allocator)" src/**/*.zig
grep -n "AutoHashMap.*\.init(allocator)" src/**/*.zig
grep -n "std\.fmt\.format(" src/**/*.zig
```

### Git
```bash
git status
git diff packages/core/src/zig/<file>  # Review changes
git add packages/core/src/zig/<file>
git commit -m "zig: migrate <file> to 0.15.1"
```

---

## Key Files Locations

```
packages/core/
├── MIGRATION_STATUS.md       # Start here every session
├── MIGRATION_LOG.md          # Update at end of session
├── MIGRATION_PATTERNS.md     # Reference during coding
├── .migration/
│   ├── phase-1-prep.md
│   ├── phase-2-core.md      # Most complex, read carefully
│   ├── phase-3-io.md
│   ├── phase-4-tests.md
│   ├── phase-5-bench.md
│   └── phase-6-validation.md
└── src/zig/
    ├── build.zig            # Phase 1
    ├── src/
    │   ├── rope.zig         # Phase 2 (start here)
    │   ├── renderer.zig     # Phase 2 (do after rope)
    │   ├── buffer.zig       # Phase 2
    │   ├── text-buffer.zig  # Phase 2
    │   ├── utf8.zig         # Phase 2
    │   ├── grapheme.zig     # Phase 2
    │   └── ansi.zig         # Phase 3
    ├── tests/               # Phase 4
    └── benchmarks/          # Phase 5
```

---

## Session Time Estimates

- **Quick session** (1 file): 30-60 min
- **Standard session** (2-3 files): 1-2 hours
- **Deep session** (Phase 2 critical file): 2-3 hours
- **Full validation** (Phase 6): 1 hour

**Total project**: ~15-20 hours across multiple sessions

---

## Success Criteria (Phase 6)

Migration is complete when:
- [ ] All files marked ✅ in MIGRATION_STATUS.md
- [ ] `zig build test` passes 100%
- [ ] `zig build bench` runs without errors
- [ ] No memory leaks detected
- [ ] Performance comparable to 0.14.1 baseline
- [ ] Integration tests pass

---

## If You Get Stuck

1. Read the specific pattern in MIGRATION_PATTERNS.md
2. Check for similar code in already-migrated files
3. Review the phase checklist for file-specific guidance
4. Check MIGRATION_LOG.md for similar issues from past sessions
5. Read Zig 0.15.1 release notes (linked in MIGRATION_PATTERNS.md)

---

## Final Notes

- **This will take multiple sessions** - that's expected and planned for
- **Test early, test often** - catches issues before they compound
- **Update tracking religiously** - future you (or future Claude) will thank you
- **Phase 2 is critical** - go slow, test thoroughly
- **Memory leaks are subtle** - watch for them in test output
- **When in doubt, check MIGRATION_PATTERNS.md** - it has real examples

**Next Session**: Start with `cat packages/core/MIGRATION_STATUS.md | head -50`

Good luck! 🚀
