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

## References

- [Zig 0.15.1 Release Notes](https://ziglang.org/download/0.15.1/release-notes.html)
- [Zig 0.15 Language Documentation](https://ziglang.org/documentation/0.15.1/)
- [Ghostty Migration Issue](https://github.com/ghostty-org/ghostty/issues/8361)
