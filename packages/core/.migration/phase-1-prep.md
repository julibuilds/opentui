# Phase 1: Preparation & Build System

**Goal**: Update build system to support Zig 0.15.1 and verify dependencies

**Estimated Time**: 0.5 days

---

## Task 1: Update build.zig

**File**: `src/zig/build.zig`  
**Lines**: ~16-19

### Current Code
```zig
const SUPPORTED_ZIG_VERSIONS = [_]SupportedZigVersion{
    .{ .major = 0, .minor = 14, .patch = 0 },
    .{ .major = 0, .minor = 14, .patch = 1 },
    // .{ .major = 0, .minor = 15, .patch = 0 },
};
```

### Target Code
```zig
const SUPPORTED_ZIG_VERSIONS = [_]SupportedZigVersion{
    .{ .major = 0, .minor = 14, .patch = 0 },
    .{ .major = 0, .minor = 14, .patch = 1 },
    .{ .major = 0, .minor = 15, .patch = 0 },
    .{ .major = 0, .minor = 15, .patch = 1 },
};
```

### Steps
1. Open `src/zig/build.zig`
2. Uncomment line 18 for 0.15.0
3. Add new line for 0.15.1
4. Save file

### Verification
```bash
cd packages/core/src/zig
zig --version  # Should show 0.15.1 or compatible
zig build      # Should compile without version warnings
```

### Status
- [ ] Code updated
- [ ] Compiled successfully
- [ ] No warnings

---

## Task 2: Check uucode Dependency

**File**: `src/zig/build.zig.zon`  
**Lines**: ~5-10

### Current Dependency
```zig
.dependencies = .{
    .uucode = .{
        .url = "https://github.com/jacobsandlund/uucode/archive/refs/tags/v0.1.0-zig-0.14.tar.gz",
        .hash = "uucode-0.1.0-ZZjBPpAFQABNCvd9cVPBg4I7233Ays-NWfWphPNqGbyE",
    },
}
```

### Steps
1. Check if uucode has a Zig 0.15 release:
   ```bash
   # Visit: https://github.com/jacobsandlund/uucode/releases
   # Or check via command line:
   curl -s https://api.github.com/repos/jacobsandlund/uucode/releases | grep tag_name
   ```

2. **If 0.15 version exists**:
   - Update .url to new version
   - Update .hash (zig will tell you the correct hash on first build)

3. **If no 0.15 version**:
   - Try building with existing version first
   - It may still work (many packages are compatible)
   - If it fails, may need to:
     - Wait for maintainer to update
     - Fork and update ourselves
     - Find alternative package

### Verification
```bash
cd packages/core/src/zig
zig build      # Should fetch and compile dependency
```

### Status
- [ ] Dependency version checked
- [ ] Updated if needed (or noted as compatible)
- [ ] Builds successfully

---

## Task 3: Verify Build System APIs

**File**: `src/zig/build.zig`

### Known Build API Changes in 0.15

Check these patterns in build.zig:

1. **Module Creation** (Lines ~26, 106, 126, 143, 184)
   - Current: `module.addImport()`, `b.path()`, `b.addModule()`
   - Status: These APIs are stable in 0.15

2. **Dependency Loading** (Line ~19)
   - Current: `b.lazyDependency()`
   - Status: Stable in 0.15

3. **Artifact Creation** (Lines ~106, 126, 143, 184)
   - Current: `root_source_file = b.path()`
   - Status: Stable in 0.15 (deprecated `createModule` pattern not used)

### Steps
1. Review build.zig for deprecated patterns
2. Run build and check for deprecation warnings
3. Update if any warnings appear

### Verification
```bash
cd packages/core/src/zig
zig build 2>&1 | grep -i "deprecat"  # Check for deprecation warnings
```

### Status
- [ ] Build.zig reviewed
- [ ] No deprecation warnings
- [ ] Build successful

---

## Task 4: Test Basic Compilation

### Steps
1. Clean build artifacts:
   ```bash
   cd packages/core/src/zig
   rm -rf zig-cache zig-out .zig-cache
   ```

2. Build from scratch:
   ```bash
   zig build
   ```

3. Check for any errors or warnings

4. Verify outputs:
   ```bash
   ls -la zig-out/lib/
   # Should see libopentui_core.a or similar
   ```

### Status
- [ ] Clean build successful
- [ ] No errors
- [ ] Library artifacts generated

---

## Phase 1 Completion Checklist

Before moving to Phase 2, verify:

- [x] build.zig supports Zig 0.15.0 and 0.15.1
- [x] Dependencies are compatible or updated
- [x] No deprecation warnings
- [x] Clean build succeeds
- [x] Library artifacts generated correctly

### Success Criteria
All builds must succeed with zero errors. Warnings are acceptable if documented.

---

## Next Phase

**After Phase 1 completion, proceed to**: [phase-2-core.md](.migration/phase-2-core.md)

**First file to migrate**: `src/zig/rope.zig` (most complex, foundational data structure)

---

## Notes & Blockers

*Add any issues encountered here*

**Example**:
- Issue: uucode doesn't have 0.15 release
  - Resolution: Existing version still compiles on 0.15.1
  - Date: 2025-11-19
