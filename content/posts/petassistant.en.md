The idea was specific: a cat that stays on my desktop. When I need it, I click to check today's plans. Between clicks, it stays quiet.

I built **PetAssistant** with AI assistance. This early version uses SwiftUI and AppKit, reads Apple Calendar, stores to-do lists locally, and speaks through the system speech synthesizer. It is already usable on my Mac.

## Decide how the companion should behave

The initial task sounded like “make the cat talk.” Using it revealed more useful questions: when should it speak, when should it stop, and what should remain after speech finishes?

The interaction settled into a three-click cycle:

1. Show the schedule and read it once.
2. Show the to-do list and read it once.
3. Clear the caption and leave only the cat.

After narration finishes, the caption and cat remain. The next click changes the page. Launching the app is silent too.

These decisions mattered more to my daily use than adding an extra animation. A desktop companion can be quiet.

## Small problems crossed several layers

During testing, we encountered issues that were easy to notice and less obvious to diagnose:

- Caption data changed, but the view did not update.
- English phrases were split too aggressively and sounded unnatural.
- Schedule times needed a format such as `9:30 AM`.
- The gap between the cat and caption was too large, and dragging could trigger a click.
- After hiding the cat, the crowded menu bar made the restore control hard to find.

The fixes involved SwiftUI observation, speech segmentation, time formatting, and AppKit window and input handling. Each looked like a small item in a feature list, yet affected everyday use.

## Make the end of narration quiet

Chinese and English segments use system voices for their respective languages. English spaces are preserved, and `TODO` is expanded to “to-do list” before speech.

Completing or stopping speech changes the speaking state without clearing the caption. Clearing text belongs to the explicit third page.

Greetings use the computer's current time. In the morning, the assistant looks ahead; in the evening, it reviews the day. A calendar event ending is not evidence that its work is complete. To-do completion is tracked separately.

## Restore the cat without finding an icon

The global shortcut **Control + Option + Command + P (⌃⌥⌘P)** toggles visibility. Reopening the app also restores a hidden cat.

Restoring it preserves the position and caption without replaying narration. This is useful when the menu bar is crowded.

## Where the version stands

The cat is still a static image. Walking, sleeping, and other frame animations are not implemented. The current app build targets **Apple Silicon Macs running macOS 14 or later** and has only been verified on my own machine. Intel Macs, Windows, and Linux are not supported yet.

Installation and distribution need more work as well. Getting a personal prototype running is one milestone; making it easy for others to install and use reliably is the next.

## What I want to write next

I plan to document specific implementation decisions and feedback: how a problem appeared, how its behavior changed, and how we checked the fix. The code was built collaboratively with AI, and these notes will include my choices about the product and its everyday experience.

This article is the first record.
