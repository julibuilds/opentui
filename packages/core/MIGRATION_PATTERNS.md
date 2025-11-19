# Zig 0.15.1 Migration Patterns

Quick reference guide for common migration patterns.

---

## Pattern 1: ArrayList → ArrayListUnmanaged

### Before (Zig 0.14.1)
```zig
const std = @import("std");

fn example(allocator: std.mem.Allocator) !void {
    // Initialization
    var list = std.ArrayList(i32).init(allocator);
    defer list.deinit();
    
    // Operations
    try list.append(42);
    try list.appendSlice(&[_]i32{1, 2, 3});
    const item = list.pop();
    const len = list.items.len;
    
    // Iteration
    for (list.items) |item| {
        std.debug.print("{d}\n", .{item});
    }
}
```

### After (Zig 0.15.1)
```zig
const std = @import("std");

fn example(allocator: std.mem.Allocator) !void {
    // Initialization
    var list: std.ArrayListUnmanaged(i32) = .{};
    defer list.deinit(allocator);
    
    // Operations - NOTE: allocator passed to each method
    try list.append(allocator, 42);
    try list.appendSlice(allocator, &[_]i32{1, 2, 3});
    const item = list.pop();  // No allocator needed
    const len = list.items.len;
    
    // Iteration - same as before
    for (list.items) |item| {
        std.debug.print("{d}\n", .{item});
    }
}
```

### Key Changes
1. Type: `std.ArrayList(T)` → `std.ArrayListUnmanaged(T)`
2. Init: `.init(allocator)` → `: Type = .{}`
3. Deinit: `.deinit()` → `.deinit(allocator)`
4. Append: `.append(item)` → `.append(allocator, item)`
5. AppendSlice: `.appendSlice(slice)` → `.appendSlice(allocator, slice)`
6. Insert: `.insert(index, item)` → `.insert(allocator, index, item)`
7. Resize: `.resize(size)` → `.resize(allocator, size)`
8. Pop/items: No change (no allocator needed)

---

## Pattern 2: ArrayList in Struct Fields

### Before (Zig 0.14.1)
```zig
const MyStruct = struct {
    data: std.ArrayList(u8),
    
    pub fn init(allocator: std.mem.Allocator) MyStruct {
        return .{
            .data = std.ArrayList(u8).init(allocator),
        };
    }
    
    pub fn deinit(self: *MyStruct) void {
        self.data.deinit();
    }
    
    pub fn add(self: *MyStruct, value: u8) !void {
        try self.data.append(value);
    }
};
```

### After (Zig 0.15.1)
```zig
const MyStruct = struct {
    data: std.ArrayListUnmanaged(u8),
    
    pub fn init() MyStruct {
        return .{
            .data = .{},
        };
    }
    
    pub fn deinit(self: *MyStruct, allocator: std.mem.Allocator) void {
        self.data.deinit(allocator);
    }
    
    pub fn add(self: *MyStruct, allocator: std.mem.Allocator, value: u8) !void {
        try self.data.append(allocator, value);
    }
};
```

### Key Changes
1. Field type: `ArrayList(T)` → `ArrayListUnmanaged(T)`
2. Init: Remove allocator parameter (unless needed elsewhere)
3. All methods: Add allocator parameter
4. Initialization: `.init(allocator)` → `.{}`

---

## Pattern 3: AutoHashMap → AutoHashMapUnmanaged

### Before (Zig 0.14.1)
```zig
fn example(allocator: std.mem.Allocator) !void {
    // Initialization
    var map = std.AutoHashMap(u32, []const u8).init(allocator);
    defer map.deinit();
    
    // Operations
    try map.put(1, "hello");
    const value = map.get(1);
    _ = map.remove(1);
}
```

### After (Zig 0.15.1)
```zig
fn example(allocator: std.mem.Allocator) !void {
    // Initialization
    var map: std.AutoHashMapUnmanaged(u32, []const u8) = .{};
    defer map.deinit(allocator);
    
    // Operations - NOTE: allocator passed to each method
    try map.put(allocator, 1, "hello");
    const value = map.get(1);  // No allocator needed for get
    _ = map.remove(1);  // No allocator needed for remove
}
```

### Key Changes
1. Type: `AutoHashMap(K, V)` → `AutoHashMapUnmanaged(K, V)`
2. Init: `.init(allocator)` → `: Type = .{}`
3. Deinit: `.deinit()` → `.deinit(allocator)`
4. Put: `.put(k, v)` → `.put(allocator, k, v)`
5. Get/Remove: No change

---

## Pattern 4: std.fmt.format → writer.print

### Before (Zig 0.14.1)
```zig
const std = @import("std");

fn writeAnsi(writer: anytype, x: u32, y: u32) !void {
    try std.fmt.format(writer, "\x1b[{d};{d}H", .{ y, x });
}

fn writeData(writer: anytype, data: []const u8) !void {
    std.fmt.format(writer, "Data: {s}", .{data}) catch return error.WriteFailed;
}
```

### After (Zig 0.15.1)
```zig
const std = @import("std");

fn writeAnsi(writer: anytype, x: u32, y: u32) !void {
    try writer.print("\x1b[{d};{d}H", .{ y, x });
}

fn writeData(writer: anytype, data: []const u8) !void {
    writer.print("Data: {s}", .{data}) catch return error.WriteFailed;
}
```

### Key Changes
1. Call: `std.fmt.format(writer, fmt, args)` → `writer.print(fmt, args)`
2. Error handling: Same as before

---

## Pattern 5: BufferedWriter Changes

### Before (Zig 0.14.1)
```zig
const std = @import("std");

fn example() !void {
    const stdout = std.io.getStdOut().writer();
    var buffered = std.io.bufferedWriter(stdout);
    const writer = buffered.writer();
    
    try writer.writeAll("Hello\n");
    try buffered.flush();
}
```

### After (Zig 0.15.1)
```zig
const std = @import("std");

fn example() !void {
    const stdout = std.io.getStdOut().writer();
    var buffered = std.io.bufferedWriter(stdout);
    const writer = buffered.writer();
    
    try writer.writeAll("Hello\n");
    try buffered.flush();  // IMPORTANT: Must flush explicitly!
}
```

### Key Changes
1. API is mostly the same
2. **CRITICAL**: Must explicitly flush before program ends or data may be lost
3. Consider flushing more frequently in interactive applications

---

## Pattern 6: Return Type Changes

### Before (Zig 0.14.1)
```zig
fn getSegments(allocator: std.mem.Allocator) !std.ArrayList(Segment) {
    var result = std.ArrayList(Segment).init(allocator);
    try result.append(.{ .text = "hello" });
    return result;
}

// Caller
var segments = try getSegments(allocator);
defer segments.deinit();
```

### After (Zig 0.15.1)
```zig
fn getSegments(allocator: std.mem.Allocator) !std.ArrayListUnmanaged(Segment) {
    var result: std.ArrayListUnmanaged(Segment) = .{};
    try result.append(allocator, .{ .text = "hello" });
    return result;
}

// Caller
var segments = try getSegments(allocator);
defer segments.deinit(allocator);  // Don't forget allocator!
```

### Key Changes
1. Return type: `ArrayList(T)` → `ArrayListUnmanaged(T)`
2. Caller must remember to pass allocator to deinit()

---

## Pattern 7: ArrayList as HashMap Value

### Before (Zig 0.14.1)
```zig
var map = std.AutoHashMap(u32, std.ArrayList(u8)).init(allocator);
defer {
    var it = map.valueIterator();
    while (it.next()) |list| {
        list.deinit();
    }
    map.deinit();
}

var list = std.ArrayList(u8).init(allocator);
try list.append(42);
try map.put(1, list);
```

### After (Zig 0.15.1)
```zig
var map: std.AutoHashMapUnmanaged(u32, std.ArrayListUnmanaged(u8)) = .{};
defer {
    var it = map.valueIterator();
    while (it.next()) |list| {
        list.deinit(allocator);
    }
    map.deinit(allocator);
}

var list: std.ArrayListUnmanaged(u8) = .{};
try list.append(allocator, 42);
try map.put(allocator, 1, list);
```

### Key Changes
1. Both HashMap and ArrayList need Unmanaged versions
2. All operations need allocator parameter
3. Cleanup requires allocator for both map and values

---

## Common Gotchas

### Gotcha 1: Forgetting Allocator in Method Calls
```zig
// WRONG
var list: std.ArrayListUnmanaged(u8) = .{};
try list.append(42);  // Compile error!

// CORRECT
var list: std.ArrayListUnmanaged(u8) = .{};
try list.append(allocator, 42);
```

### Gotcha 2: Forgetting Allocator in Deinit
```zig
// WRONG
var list: std.ArrayListUnmanaged(u8) = .{};
defer list.deinit();  // Compile error!

// CORRECT
var list: std.ArrayListUnmanaged(u8) = .{};
defer list.deinit(allocator);
```

### Gotcha 3: Method Signature Changes
```zig
// Some methods DON'T need allocator:
list.pop();           // ✓ No allocator
list.items.len;       // ✓ No allocator
list.clearRetainingCapacity();  // ✓ No allocator

// These DO need allocator:
list.append(allocator, item);        // ✓ Needs allocator
list.appendSlice(allocator, slice);  // ✓ Needs allocator
list.resize(allocator, size);        // ✓ Needs allocator
```

---

## Search & Replace Patterns (Use with Caution!)

These are **not safe** for automated find-replace but can help find occurrences:

### Find ArrayList Initializations
```bash
grep -n "ArrayList.*\.init(allocator)" src/**/*.zig
grep -n "AutoHashMap.*\.init(allocator)" src/**/*.zig
```

### Find fmt.format Calls
```bash
grep -n "std\.fmt\.format(" src/**/*.zig
```

### Find BufferedWriter
```bash
grep -n "BufferedWriter" src/**/*.zig
```

---

## Testing Strategy

After each file migration:

1. **Compile Check**
   ```bash
   zig build
   ```

2. **Run Tests**
   ```bash
   zig build test
   ```

3. **Run Specific Test**
   ```bash
   zig test src/zig/tests/<filename>_test.zig
   ```

4. **Check for Memory Leaks**
   ```bash
   zig build test -Doptimize=Debug
   # Look for "leaked memory" messages
   ```

---

## Real Examples from Codebase

### Example 1: renderer.zig statSamples
```zig
// Before (0.14.1)
const StatSamples = struct {
    drawTime: std.ArrayList(f64),
    // ... more fields
    
    pub fn create(allocator: std.mem.Allocator) !StatSamples {
        return .{
            .drawTime = std.ArrayList(f64).init(allocator),
            // ...
        };
    }
};

// After (0.15.1)
const StatSamples = struct {
    drawTime: std.ArrayListUnmanaged(f64),
    // ... more fields
    
    pub fn create() StatSamples {
        return .{
            .drawTime = .{},
            // ...
        };
    }
    
    pub fn deinit(self: *StatSamples, allocator: std.mem.Allocator) void {
        self.drawTime.deinit(allocator);
        // ...
    }
};
```

### Example 2: ansi.zig format calls
```zig
// Before (0.14.1)
pub fn moveTo(writer: anytype, x: u32, y: u32) AnsiError!void {
    std.fmt.format(writer, "\x1b[{d};{d}H", .{ y + 1, x + 1 }) catch return AnsiError.WriteFailed;
}

// After (0.15.1)
pub fn moveTo(writer: anytype, x: u32, y: u32) AnsiError!void {
    writer.print("\x1b[{d};{d}H", .{ y + 1, x + 1 }) catch return AnsiError.WriteFailed;
}
```

---

---

## Pattern 8: Result Structs with Allocator Field

**New pattern discovered in Session 3**

When migrating structs that contain ArrayListUnmanaged and are used as result types, add an allocator field to enable proper cleanup.

### Before (Zig 0.14.1)
```zig
pub const LineBreakResult = struct {
    breaks: std.ArrayList(LineBreak),

    pub fn init(allocator: std.mem.Allocator) LineBreakResult {
        return .{
            .breaks = std.ArrayList(LineBreak).init(allocator),
        };
    }

    pub fn deinit(self: *LineBreakResult) void {
        self.breaks.deinit();
    }
};

// Usage
var result = LineBreakResult.init(allocator);
defer result.deinit();
try result.breaks.append(item);
```

### After (Zig 0.15.1)
```zig
pub const LineBreakResult = struct {
    breaks: std.ArrayListUnmanaged(LineBreak),
    allocator: std.mem.Allocator,  // ADD THIS FIELD

    pub fn init(allocator: std.mem.Allocator) LineBreakResult {
        return .{
            .breaks = .{},
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *LineBreakResult) void {
        self.breaks.deinit(self.allocator);  // Use stored allocator
    }

    pub fn reset(self: *LineBreakResult) void {
        self.breaks.clearRetainingCapacity();  // No allocator needed
    }
};

// Usage
var result = LineBreakResult.init(allocator);
defer result.deinit();
try result.breaks.append(result.allocator, item);  // Use stored allocator
```

### Key Benefits
1. Encapsulates allocator management within the struct
2. Simplifies cleanup - caller doesn't need to track allocator separately
3. Makes the API more ergonomic for result types
4. Prevents allocator mismatch errors

### When to Use This Pattern
- Result structs that are created and destroyed in the same scope
- Temporary data structures used for processing
- Structs that don't need allocator as a method parameter elsewhere

---

## Pattern 9: Function Return Types with Allocator

**New pattern discovered in Session 3**

When a function returns an ArrayListUnmanaged, include the allocator in the return type for proper cleanup.

### Before (Zig 0.14.1)
```zig
pub fn textToSegments(
    allocator: std.mem.Allocator,
    text: []const u8,
) !struct { segments: std.ArrayList(Segment), total_width: u32 } {
    var segments = std.ArrayList(Segment).init(allocator);
    try segments.append(segment);
    return .{ .segments = segments, .total_width = width };
}

// Caller
var result = try textToSegments(allocator, text);
defer result.segments.deinit();
```

### After (Zig 0.15.1)
```zig
pub fn textToSegments(
    allocator: std.mem.Allocator,
    text: []const u8,
) !struct { 
    segments: std.ArrayListUnmanaged(Segment), 
    allocator: std.mem.Allocator,  // ADD THIS
    total_width: u32 
} {
    var segments: std.ArrayListUnmanaged(Segment) = .{};
    try segments.append(allocator, segment);
    return .{ 
        .segments = segments, 
        .allocator = allocator,  // RETURN THIS
        .total_width = width 
    };
}

// Caller
var result = try textToSegments(allocator, text);
defer result.segments.deinit(result.allocator);  // Use returned allocator
```

### Key Benefits
1. Self-documenting - return type shows cleanup requirements
2. Prevents allocator mismatch between creation and destruction
3. Caller can't forget which allocator to use for deinit
4. Works well with arena allocators

### Alternative: Return Owned Slice
If you don't need the ArrayList after returning, convert to owned slice:

```zig
pub fn textToSegments(
    allocator: std.mem.Allocator,
    text: []const u8,
) ![]Segment {
    var segments: std.ArrayListUnmanaged(Segment) = .{};
    errdefer segments.deinit(allocator);
    
    try segments.append(allocator, segment);
    return segments.toOwnedSlice(allocator);
}

// Caller
const segments = try textToSegments(allocator, text);
defer allocator.free(segments);
```

---

## Pattern 10: Function Signatures with ArrayListUnmanaged Parameters

**New pattern discovered in Session 3**

When passing ArrayListUnmanaged as a mutable parameter, always pass the allocator as well.

### Before (Zig 0.14.1)
```zig
pub fn findGraphemes(
    text: []const u8,
    result: *std.ArrayList(GraphemeInfo),
) !void {
    try result.append(info);
}

// Caller
var result = std.ArrayList(GraphemeInfo).init(allocator);
defer result.deinit();
try findGraphemes(text, &result);
```

### After (Zig 0.15.1)
```zig
pub fn findGraphemes(
    text: []const u8,
    result: *std.ArrayListUnmanaged(GraphemeInfo),
    allocator: std.mem.Allocator,  // ADD THIS PARAMETER
) !void {
    try result.append(allocator, info);
}

// Caller
var result: std.ArrayListUnmanaged(GraphemeInfo) = .{};
defer result.deinit(allocator);
try findGraphemes(text, &result, allocator);
```

### Key Changes
1. Add allocator parameter to function signature
2. Pass allocator to all list operations inside function
3. Update all call sites to pass allocator

### Ordering Convention
Place allocator parameter:
- **Before** the result parameter if it's used for other allocations too
- **After** the result parameter if it's only for the result

```zig
// Pattern A: Allocator used for multiple things
pub fn process(
    allocator: std.mem.Allocator,  // First - used widely
    result: *std.ArrayListUnmanaged(T),
    other_param: u32,
) !void

// Pattern B: Allocator only for result
pub fn process(
    result: *std.ArrayListUnmanaged(T),
    allocator: std.mem.Allocator,  // Last - only for result
    other_param: u32,
) !void
```

---

## Pattern 11: Nested Collections (HashMap of ArrayLists)

**New pattern discovered in Session 3 - Most Complex Case**

When you have nested collections, BOTH must be Unmanaged.

### Before (Zig 0.14.1)
```zig
pub const MarkerCache = struct {
    positions: std.AutoHashMap(u32, std.ArrayList(MarkerPosition)),
    allocator: Allocator,

    pub fn init(allocator: Allocator) MarkerCache {
        return .{
            .positions = std.AutoHashMap(u32, std.ArrayList(MarkerPosition)).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *MarkerCache) void {
        var iter = self.positions.valueIterator();
        while (iter.next()) |list| {
            list.deinit();
        }
        self.positions.deinit();
    }
};

// Usage
var cache = MarkerCache.init(allocator);
defer cache.deinit();

const gop = try cache.positions.getOrPut(tag);
if (!gop.found_existing) {
    gop.value_ptr.* = std.ArrayList(MarkerPosition).init(cache.allocator);
}
try gop.value_ptr.append(pos);
```

### After (Zig 0.15.1)
```zig
pub const MarkerCache = struct {
    // BOTH HashMap AND ArrayList must be Unmanaged
    positions: std.AutoHashMapUnmanaged(u32, std.ArrayListUnmanaged(MarkerPosition)),
    allocator: Allocator,

    pub fn init(allocator: Allocator) MarkerCache {
        return .{
            .positions = .{},  // Initialize as empty
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *MarkerCache) void {
        var iter = self.positions.valueIterator();
        while (iter.next()) |list| {
            list.deinit(self.allocator);  // Pass allocator to list
        }
        self.positions.deinit(self.allocator);  // Pass allocator to map
    }
};

// Usage
var cache = MarkerCache.init(allocator);
defer cache.deinit();

const gop = try cache.positions.getOrPut(cache.allocator, tag);  // Allocator to map
if (!gop.found_existing) {
    gop.value_ptr.* = .{};  // Initialize list as empty
}
try gop.value_ptr.append(cache.allocator, pos);  // Allocator to list
```

### Critical Points
1. **Type declaration**: Both outer and inner collections need Unmanaged
2. **Initialization**: Both use `.{}` empty initialization
3. **Operations**: Allocator passed to both map and list operations
4. **Cleanup**: Must deinit both collections with allocator
5. **Nested cleanup**: When iterating values, deinit each value before map

### Common Variations
```zig
// HashMap with ArrayList values
AutoHashMapUnmanaged(K, ArrayListUnmanaged(V))

// HashMap with HashMap values
AutoHashMapUnmanaged(K1, AutoHashMapUnmanaged(K2, V))

// ArrayList of ArrayLists
ArrayListUnmanaged(ArrayListUnmanaged(T))
```

---

## Troubleshooting Guide

### Error: "expected X arguments, found Y" on append/put

**Cause**: Forgot to add allocator parameter

```zig
// Wrong
try list.append(item);

// Fixed
try list.append(allocator, item);
```

### Error: "expected X arguments, found Y" on deinit

**Cause**: Forgot to add allocator parameter to deinit

```zig
// Wrong
list.deinit();

// Fixed  
list.deinit(allocator);
```

### Error: Multiple append calls still failing after replacement

**Cause**: Different code formatting prevented replace_all from catching all cases

**Solution**: Use grep to find ALL occurrences, then fix manually
```bash
grep -n "\.append(" src/file.zig
grep -n "\.put(" src/file.zig
```

### Memory Leak: Lists not being freed

**Cause**: Nested structures - must deinit inner lists before outer container

```zig
// Wrong - leaks inner lists
defer map.deinit(allocator);

// Correct - clean up inner lists first
defer {
    var it = map.valueIterator();
    while (it.next()) |list| {
        list.deinit(allocator);
    }
    map.deinit(allocator);
}
```

---

## References

- [Zig 0.15.1 Release Notes](https://ziglang.org/download/0.15.1/release-notes.html)
- [Zig 0.15 Language Documentation](https://ziglang.org/documentation/0.15.1/)
- [Ghostty Migration Issue](https://github.com/ghostty-org/ghostty/issues/8361)

---

## Pattern 12: BufferedWriter → File.Writer with Buffer (0.15.1 Writer Redesign)

**Context**: Zig 0.15.1 completely redesigned the I/O system. Writers now have built-in buffering instead of using wrapper types.

### Before (Zig 0.14.1)

```zig
const std = @import("std");

pub const MyStruct = struct {
    writer: std.io.BufferedWriter(4096, std.fs.File.Writer),
    
    pub fn init() !MyStruct {
        const stdout = std.io.getStdOut();
        return .{
            .writer = std.io.BufferedWriter(4096, std.fs.File.Writer){
                .unbuffered_writer = stdout.writer()
            },
        };
    }
    
    pub fn write(self: *MyStruct, data: []const u8) !void {
        try self.writer.writer().writeAll(data);
        try self.writer.flush();
    }
};
```

### After (Zig 0.15.1)

```zig
const std = @import("std");

pub const MyStruct = struct {
    buffer: [4096]u8,
    writer: std.fs.File.Writer,
    
    pub fn init() !MyStruct {
        var buffer: [4096]u8 = undefined;
        const stdout = std.fs.File.stdout();  // NOTE: No parentheses in 0.14, yes in 0.15.1
        
        return .{
            .buffer = buffer,
            .writer = stdout.writer(&buffer),
        };
    }
    
    pub fn write(self: *MyStruct) !void {
        // Access the Writer interface
        const writer = &self.writer.interface;
        try writer.writeAll(data);
        try writer.flush();
    }
};
```

### Key Changes

1. **Type change**: `std.io.BufferedWriter(N, T)` → `std.fs.File.Writer`
2. **Buffer field**: Add explicit `buffer: [N]u8` to struct
3. **Initialization**: `file.writer(&buffer)` instead of BufferedWriter struct literal
4. **Usage**: `&writer.interface` to get the actual Writer interface
5. **stdout**: `std.io.getStdOut()` → `std.fs.File.stdout()` (note: function vs value)

### Common Patterns

**Pattern A: Struct field**
```zig
// Before
struct {
    stdout: std.io.BufferedWriter(4096, std.fs.File.Writer),
}

// After  
struct {
    stdout_buffer: [4096]u8,
    stdout: std.fs.File.Writer,
}
```

**Pattern B: Getting the writer**
```zig
// Before
const w = buffered_writer.writer();

// After
const w = &file_writer.interface;
```

**Pattern C: Flushing**
```zig
// Before
try buffered_writer.flush();

// After
try file_writer.interface.flush();
```

### Related API Changes

These changes often appear together:

```zig
// stdout access
std.io.getStdOut()  → std.fs.File.stdout()  // 0.14 → 0.15.1

// sleep moved
std.time.sleep(ns)  → std.Thread.sleep(ns)  // 0.14 → 0.15.1
```

---

## Pattern 13: ArrayList Default Semantic Change (0.15.1 Breaking Change)

**CRITICAL**: In Zig 0.15.1, `std.ArrayList` now means `ArrayListUnmanaged` by default!

### Before (Zig 0.14.1)

```zig
const std = @import("std");

// Managed ArrayList (stores allocator internally)
var list = std.ArrayList(u32).init(allocator);
defer list.deinit();

try list.append(10);
try list.ensureTotalCapacity(100);
```

### After (Zig 0.15.1)

```zig
const std = @import("std");

// ArrayList is now Unmanaged by default!
var list: std.ArrayList(u32) = .{};
defer list.deinit(allocator);

try list.append(allocator, 10);
try list.ensureTotalCapacity(allocator, 100);
```

### Key Changes

1. **Initialization**: `.init(allocator)` → `: std.ArrayList(T) = .{}`
2. **All methods need allocator**: `.append(item)` → `.append(allocator, item)`
3. **Deinit needs allocator**: `.deinit()` → `.deinit(allocator)`
4. **No longer stores allocator**: Must pass to every operation

### Migration Checklist

For each `std.ArrayList` in your code:

- [ ] Change initialization from `.init(allocator)` to `: .{}`
- [ ] Add `allocator` parameter to `.append()` calls
- [ ] Add `allocator` parameter to `.appendSlice()` calls  
- [ ] Add `allocator` parameter to `.insert()` calls
- [ ] Add `allocator` parameter to `.ensureTotalCapacity()` calls
- [ ] Add `allocator` parameter to `.resize()` calls
- [ ] Add `allocator` parameter to `.deinit()` calls

### If You Need Managed ArrayList

If you truly need a managed ArrayList (rare), use:

```zig
var list = std.ArrayListManaged(u32).init(allocator);
defer list.deinit();
// Methods don't need allocator parameter
```

### Impact on Codebases

This change affects:
- ✅ All test files (typically use local ArrayLists)
- ✅ All benchmark files (same)
- ✅ Any struct fields using ArrayList  
- ✅ Any function returning ArrayList

**This is the most pervasive breaking change in 0.15.1!**

---

## Pattern 14: Function Parameters with Allocator Threading

When functions need to call ArrayList methods, they must accept and pass through the allocator.

### Before (Zig 0.14.1)

```zig
fn addStatSample(comptime T: type, samples: *std.ArrayList(T), value: T) void {
    samples.append(value) catch return;
    
    if (samples.items.len > MAX_SAMPLES) {
        _ = samples.orderedRemove(0);
    }
}

// Usage
addStatSample(f64, &self.samples, time_value);
```

### After (Zig 0.15.1)

```zig
fn addStatSample(comptime T: type, allocator: Allocator, samples: *std.ArrayList(T), value: T) void {
    samples.append(allocator, value) catch return;
    
    if (samples.items.len > MAX_SAMPLES) {
        _ = samples.orderedRemove(0);  // orderedRemove doesn't need allocator
    }
}

// Usage
addStatSample(f64, self.allocator, &self.samples, time_value);
```

### Key Points

1. **Add allocator parameter** to any function that modifies ArrayList/HashMap
2. **Pass allocator through** the call chain
3. **Order matters**: Convention is `allocator` comes first or second parameter
4. **Read-only operations** (like `.items`, `.len`) don't need allocator

### Common Operations

```zig
// Need allocator:
.append(allocator, item)
.appendSlice(allocator, slice)
.insert(allocator, index, item)
.resize(allocator, new_len)
.ensureTotalCapacity(allocator, capacity)
.deinit(allocator)

// Don't need allocator:
.items
.len
.orderedRemove(index)
.swapRemove(index)
.pop()
```

---

## Quick Reference: Zig 0.15.1 Breaking Changes

| Old API (0.14.1) | New API (0.15.1) | Category |
|------------------|------------------|----------|
| `std.ArrayList(T).init(a)` | `std.ArrayList(T) = .{}` | ArrayList default |
| `list.append(item)` | `list.append(a, item)` | ArrayList methods |
| `list.deinit()` | `list.deinit(a)` | ArrayList cleanup |
| `std.io.BufferedWriter(N, T)` | `std.fs.File.Writer` | I/O redesign |
| `writer.writer()` | `&writer.interface` | Writer access |
| `std.io.getStdOut()` | `std.fs.File.stdout()` | Stdlib move |
| `std.time.sleep(ns)` | `std.Thread.sleep(ns)` | Stdlib move |
| `std.fmt.format(w, fmt, args)` | `w.print(fmt, args)` | Format API |
| `writer.writeByteNTimes(b, n)` | Manual loop | Removed API |
| `callconv(.C)` | `callconv(.c)` | Calling convention |

---

## Troubleshooting: 0.15.1 Specific Errors

### Error: "struct has no member named 'init'"

**Cause**: `std.ArrayList` no longer has `.init()` method

**Fix**:
```zig
// Wrong
var list = std.ArrayList(T).init(allocator);

// Correct
var list: std.ArrayList(T) = .{};
```

### Error: "expected 2 arguments, found 1" on ArrayList methods

**Cause**: ArrayList is now Unmanaged, needs allocator parameter

**Fix**:
```zig
// Wrong
list.append(item);

// Correct
list.append(allocator, item);
```

### Error: "root source file struct 'Io' has no member named 'BufferedWriter'"

**Cause**: BufferedWriter type removed from std.io

**Fix**:
```zig
// Wrong
writer: std.io.BufferedWriter(4096, std.fs.File.Writer)

// Correct
buffer: [4096]u8,
writer: std.fs.File.Writer
// Then: writer = file.writer(&buffer)
```

### Error: "no field or member function named 'adaptToNewApi'"

**Cause**: Writer API completely redesigned

**Fix**:
```zig
// Wrong
var adapter = writer.adaptToNewApi(&.{});

// Correct - use writer directly
// Writer is now concrete, not generic
```

