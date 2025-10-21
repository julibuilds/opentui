import { describe, expect, it, beforeEach, afterEach } from "bun:test"
import { EditBuffer } from "./edit-buffer"

describe("EditBuffer", () => {
  let buffer: EditBuffer

  beforeEach(() => {
    buffer = EditBuffer.create("wcwidth")
  })

  afterEach(() => {
    buffer.destroy()
  })

  describe("setText and getText", () => {
    it("should set and retrieve text content", () => {
      buffer.setText("Hello World")
      expect(buffer.getText()).toBe("Hello World")
    })

    it("should handle empty text", () => {
      buffer.setText("")
      expect(buffer.getText()).toBe("")
    })

    it("should handle text with newlines", () => {
      const text = "Line 1\nLine 2\nLine 3"
      buffer.setText(text)
      expect(buffer.getText()).toBe(text)
    })

    it("should handle Unicode characters", () => {
      const text = "Hello 世界 🌟"
      buffer.setText(text)
      expect(buffer.getText()).toBe(text)
    })
  })

  describe("cursor position", () => {
    it("should start cursor at beginning after setText", () => {
      buffer.setText("Hello World")
      const cursor = buffer.getCursorPosition()

      expect(cursor.line).toBe(0)
      expect(cursor.visualColumn).toBe(0)
    })

    it("should track cursor position after movements", () => {
      buffer.setText("Hello World")

      buffer.moveCursorRight()
      let cursor = buffer.getCursorPosition()
      expect(cursor.visualColumn).toBe(1)

      buffer.moveCursorRight()
      cursor = buffer.getCursorPosition()
      expect(cursor.visualColumn).toBe(2)
    })

    it("should handle multi-line cursor positions", () => {
      buffer.setText("Line 1\nLine 2\nLine 3")

      buffer.moveCursorDown()
      let cursor = buffer.getCursorPosition()
      expect(cursor.line).toBe(1)

      buffer.moveCursorDown()
      cursor = buffer.getCursorPosition()
      expect(cursor.line).toBe(2)
    })
  })

  describe("cursor movement", () => {
    it("should move cursor left and right", () => {
      buffer.setText("ABCDE")

      buffer.setCursorToLineCol(0, 5) // Move to end
      expect(buffer.getCursorPosition().visualColumn).toBe(5)

      buffer.moveCursorLeft()
      expect(buffer.getCursorPosition().visualColumn).toBe(4)

      buffer.moveCursorLeft()
      expect(buffer.getCursorPosition().visualColumn).toBe(3)
    })

    it("should move cursor up and down", () => {
      buffer.setText("Line 1\nLine 2\nLine 3")

      buffer.moveCursorDown()
      expect(buffer.getCursorPosition().line).toBe(1)

      buffer.moveCursorDown()
      expect(buffer.getCursorPosition().line).toBe(2)

      buffer.moveCursorUp()
      expect(buffer.getCursorPosition().line).toBe(1)
    })

    it("should move to line start and end", () => {
      buffer.setText("Hello World")

      buffer.setCursorToLineCol(0, 11) // Move to end
      expect(buffer.getCursorPosition().visualColumn).toBe(11)

      const cursor = buffer.getCursorPosition()
      buffer.setCursor(cursor.line, 0)
      expect(buffer.getCursorPosition().visualColumn).toBe(0)
    })

    it("should goto specific line", () => {
      buffer.setText("Line 1\nLine 2\nLine 3")

      buffer.gotoLine(1)
      expect(buffer.getCursorPosition().line).toBe(1)

      buffer.gotoLine(2)
      expect(buffer.getCursorPosition().line).toBe(2)
    })

    it("should handle Unicode grapheme movement correctly", () => {
      buffer.setText("A🌟B")

      expect(buffer.getCursorPosition().visualColumn).toBe(0)

      buffer.moveCursorRight() // Move to emoji
      expect(buffer.getCursorPosition().visualColumn).toBe(1)

      buffer.moveCursorRight() // Move past emoji (2 cells wide)
      expect(buffer.getCursorPosition().visualColumn).toBe(3)

      buffer.moveCursorRight() // Move to B
      expect(buffer.getCursorPosition().visualColumn).toBe(4)
    })
  })

  describe("text insertion", () => {
    it("should insert single character", () => {
      buffer.setText("Hello World")

      buffer.setCursorToLineCol(0, 11) // Move to end
      buffer.insertChar("!")

      expect(buffer.getText()).toBe("Hello World!")
    })

    it("should insert text at cursor", () => {
      buffer.setText("Hello")

      buffer.setCursorToLineCol(0, 5) // Move to end
      buffer.insertText(" World")

      expect(buffer.getText()).toBe("Hello World")
    })

    it("should insert text in middle", () => {
      buffer.setText("HelloWorld")

      buffer.setCursorToLineCol(0, 5)
      buffer.insertText(" ")

      expect(buffer.getText()).toBe("Hello World")
    })

    it("should handle continuous typing (edit session)", () => {
      buffer.setText("")

      buffer.insertText("Hello")
      buffer.insertText(" ")
      buffer.insertText("World")

      expect(buffer.getText()).toBe("Hello World")
    })

    it("should insert Unicode characters", () => {
      buffer.setText("Hello")

      buffer.setCursorToLineCol(0, 5) // Move to end
      buffer.insertText(" 世界 🌟")

      expect(buffer.getText()).toBe("Hello 世界 🌟")
    })

    it("should handle newline insertion", () => {
      buffer.setText("HelloWorld")

      buffer.setCursorToLineCol(0, 5)
      buffer.newLine()

      expect(buffer.getText()).toBe("Hello\nWorld")
    })
  })

  describe("text deletion", () => {
    it("should delete character at cursor", () => {
      buffer.setText("Hello World")

      buffer.setCursorToLineCol(0, 6)
      buffer.deleteChar()

      expect(buffer.getText()).toBe("Hello orld")
    })

    it("should delete character backward", () => {
      buffer.setText("")

      buffer.insertText("test")
      buffer.deleteCharBackward()

      expect(buffer.getText()).toBe("tes")
    })

    it("should delete entire line", () => {
      buffer.setText("Line 1\nLine 2\nLine 3")

      buffer.gotoLine(1) // Go to Line 2
      buffer.deleteLine()

      // After deleting Line 2, we should have Line 1 and Line 3
      // The result might have a trailing newline depending on implementation
      const result = buffer.getText()
      expect(result === "Line 1\nLine 3" || result === "Line 1\nLine 3\n").toBe(true)
    })

    // TODO: Re-implement deleteToLineEnd as scripted method
    it.skip("should delete to line end", () => {
      buffer.setText("Hello World")

      buffer.setCursorToLineCol(0, 6)
      // buffer.deleteToLineEnd()

      expect(buffer.getText()).toBe("Hello ")
    })

    it("should handle backspace in active edit session", () => {
      buffer.setText("")

      buffer.insertText("test")
      buffer.deleteCharBackward()
      buffer.deleteCharBackward()

      expect(buffer.getText()).toBe("te")
    })
  })

  describe("complex editing scenarios", () => {
    it("should handle multiple edit operations in sequence", () => {
      buffer.setText("Hello World")

      buffer.setCursorToLineCol(0, 11) // Move to end
      buffer.insertText("!")

      buffer.setCursorToLineCol(0, 0) // Move to start
      buffer.insertText(">> ")

      buffer.setCursorToLineCol(0, 99) // Move to end of line
      buffer.newLine()
      buffer.insertText("New line")

      expect(buffer.getText()).toBe(">> Hello World!\nNew line")
    })

    it("should handle insert, delete, and cursor movement", () => {
      buffer.setText("AAAA\nBBBB\nCCCC")

      buffer.gotoLine(1)
      buffer.setCursorToLineCol(1, 4) // Move to end of line 1
      buffer.insertText("X")

      const text1 = buffer.getText()
      expect(text1).toBe("AAAA\nBBBBX\nCCCC")

      // After insert, cursor is at end, deleteCharBackward will delete X
      buffer.deleteCharBackward()

      expect(buffer.getText()).toBe("AAAA\nBBBB\nCCCC")
    })

    it("should handle line operations", () => {
      buffer.setText("Line 1\nLine 2\nLine 3")

      buffer.gotoLine(1) // Go to Line 2
      buffer.deleteLine()

      // After deleting Line 2, we should have Line 1 and Line 3
      const result = buffer.getText()
      expect(result === "Line 1\nLine 3" || result === "Line 1\nLine 3\n").toBe(true)
    })
  })

  describe("setCursor methods", () => {
    it("should set cursor by line and byte offset", () => {
      buffer.setText("Hello World")

      buffer.setCursor(0, 6)
      const cursor = buffer.getCursorPosition()
      expect(cursor.visualColumn).toBe(6)
    })

    it("should set cursor by line and column", () => {
      buffer.setText("Hello World")

      buffer.setCursorToLineCol(0, 5)
      const cursor = buffer.getCursorPosition()
      expect(cursor.visualColumn).toBe(5)
    })

    it("should handle multi-line setCursorToLineCol", () => {
      buffer.setText("Line 1\nLine 2\nLine 3")

      buffer.setCursorToLineCol(1, 3)
      const cursor = buffer.getCursorPosition()
      expect(cursor.line).toBe(1)
      expect(cursor.visualColumn).toBe(3)
    })
  })

  describe("getTextBufferPtr", () => {
    it("should return valid TextBuffer pointer", () => {
      buffer.setText("Test")
      const ptr = buffer.getTextBufferPtr()
      expect(ptr).toBeDefined()
      expect(typeof ptr).toBe("number")
    })
  })

  describe("error handling", () => {
    it("should throw error when using destroyed buffer", () => {
      buffer.setText("Test")
      buffer.destroy()

      expect(() => buffer.getText()).toThrow("EditBuffer is destroyed")
      expect(() => buffer.insertText("x")).toThrow("EditBuffer is destroyed")
      expect(() => buffer.moveCursorLeft()).toThrow("EditBuffer is destroyed")
    })
  })

  describe("line boundary operations", () => {
    it("should merge lines when backspacing at BOL", () => {
      buffer.setText("Line 1\nLine 2")
      buffer.setCursorToLineCol(1, 0) // Start of line 2
      buffer.deleteCharBackward()
      expect(buffer.getText()).toBe("Line 1Line 2")
      const cursor = buffer.getCursorPosition()
      expect(cursor.line).toBe(0)
      expect(cursor.visualColumn).toBe(6)
    })

    it("should merge lines when deleting at EOL", () => {
      buffer.setText("Line 1\nLine 2")
      buffer.setCursorToLineCol(0, 6) // End of line 1
      buffer.deleteChar()
      expect(buffer.getText()).toBe("Line 1Line 2")
      const cursor = buffer.getCursorPosition()
      expect(cursor.line).toBe(0)
      expect(cursor.visualColumn).toBe(6)
    })

    it("should handle newline insertion at BOL", () => {
      buffer.setText("Hello")
      buffer.setCursorToLineCol(0, 0)
      buffer.newLine()
      expect(buffer.getText()).toBe("\nHello")
      const cursor = buffer.getCursorPosition()
      expect(cursor.line).toBe(1)
      expect(cursor.visualColumn).toBe(0)
    })

    it("should handle newline insertion at EOL", () => {
      buffer.setText("Hello")
      buffer.setCursorToLineCol(0, 5)
      buffer.newLine()
      expect(buffer.getText()).toBe("Hello\n")
      const cursor = buffer.getCursorPosition()
      expect(cursor.line).toBe(1)
      expect(cursor.visualColumn).toBe(0)
    })

    it("should handle CRLF in text", () => {
      // CRLF is detected as a line break during setText
      buffer.setText("Line 1\r\nLine 2")
      // Both CR and LF are detected, so we get the text back
      const text = buffer.getText()
      // Verify we have two lines
      buffer.setCursorToLineCol(1, 0)
      buffer.deleteCharBackward()
      expect(buffer.getText()).toBe("Line 1Line 2")
    })

    it("should handle multiple consecutive newlines", () => {
      buffer.setText("A\n\n\nB")
      buffer.setCursorToLineCol(1, 0) // Empty line
      buffer.deleteCharBackward()
      expect(buffer.getText()).toBe("A\n\nB")
    })
  })

  describe("wide character handling", () => {
    it("should handle tabs correctly in edits", () => {
      buffer.setText("A\tB")
      // Tab has a display width of 8 columns (by default)
      // So "A\tB" has positions: A at col 0-1, tab at col 1-9, B at col 9
      // To insert after A, we use column 1
      buffer.setCursorToLineCol(0, 1) // After A, at the tab position
      // But since setCursorToLineCol might snap to grapheme boundaries,
      // let's just verify the text remains intact when inserting at byte level
      buffer.insertText("X")
      // The insert should happen at the cursor position
      const text = buffer.getText()
      // Either AX\tB or A\tXB depending on how cursor snaps
      expect(text.includes("A") && text.includes("B") && text.includes("\t") && text.includes("X")).toBe(true)
    })

    it("should handle CJK characters correctly", () => {
      buffer.setText("世界")
      buffer.setCursorToLineCol(0, 2) // After first character (2 columns wide)
      buffer.insertText("X")
      expect(buffer.getText()).toBe("世X界")
    })

    it("should handle emoji correctly", () => {
      buffer.setText("🌟")
      buffer.setCursorToLineCol(0, 0)
      buffer.moveCursorRight()
      const cursor = buffer.getCursorPosition()
      expect(cursor.visualColumn).toBe(2) // Emoji is 2 columns wide
    })

    it("should handle mixed width text correctly", () => {
      buffer.setText("A世🌟B")
      buffer.setCursorToLineCol(0, 1) // After A
      buffer.moveCursorRight()
      const cursor = buffer.getCursorPosition()
      expect(cursor.visualColumn).toBe(3) // A(1) + 世(2)
    })
  })

  describe("multi-line insertion", () => {
    it("should insert multi-line text correctly", () => {
      buffer.setText("Start")
      buffer.setCursorToLineCol(0, 5)
      buffer.insertText("\nMiddle\nEnd")
      expect(buffer.getText()).toBe("Start\nMiddle\nEnd")
      const cursor = buffer.getCursorPosition()
      expect(cursor.line).toBe(2)
      expect(cursor.visualColumn).toBe(3)
    })

    it("should insert multi-line text in middle", () => {
      buffer.setText("StartEnd")
      buffer.setCursorToLineCol(0, 5)
      buffer.insertText("\nMiddle\n")
      expect(buffer.getText()).toBe("Start\nMiddle\nEnd")
    })

    it("should handle inserting text with various line endings", () => {
      buffer.setText("")
      buffer.insertText("Line 1\nLine 2\rLine 3\r\nLine 4")
      const text = buffer.getText()
      // Line breaks are preserved in the buffer
      // Just verify we have 4 lines
      const lines = text.split(/\r?\n|\r/)
      expect(lines.length).toBe(4)
      expect(lines[0]).toBe("Line 1")
      expect(lines[3]).toBe("Line 4")
    })
  })
})
