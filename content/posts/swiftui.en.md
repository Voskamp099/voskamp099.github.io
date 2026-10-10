In PetAssistant, the caption is stored in the coordinator's `lastSpokenText` property. The value changed, but the expected speech bubble did not appear above the cat.

The issue was a useful reminder: changing data and making a view respond to it require separate checks.

## Trace how state reaches the view

The coordinator was an `ObservableObject`, and its caption property used `@Published`. The pet view, however, held the coordinator in an ordinary `let` property.

Here is a simplified version:

```swift
struct PetView: View {
    let coordinator: AppCoordinator

    var body: some View {
        Text(coordinator.lastSpokenText)
    }
}
```

The reference allowed the view to read the value, but did not establish the required observation relationship. The corrected entry point used `@ObservedObject`:

```swift
struct PetView: View {
    @ObservedObject var coordinator: AppCoordinator

    var body: some View {
        Text(coordinator.lastSpokenText)
    }
}
```

The object is managed externally; the view receives and observes it. Caption changes can then update the same hosting view.

## Check layout after the update appears

Once the caption rendered, the gap between it and the cat was still too large.

The old layout included a large fixed height and extra empty space. Removing that space let the vertical layout fit its content. Reporting the content height back to the AppKit floating panel made the window follow the caption.

Dragging and clicking also needed separate handling. Movement past a threshold counts as a drag, so releasing the mouse does not unexpectedly start narration.

## Finishing speech does not mean clearing text

Two states had to stay distinct: whether the app was speaking, and what it was displaying. Speech completion ends the speaking state. The click cycle decides when the caption is cleared.

That separation allows the schedule to remain on screen after it has been read.

## How the fix was checked

We changed the caption from empty to schedule to to-do text on the same `NSHostingView`, then checked the rendered result with OCR. We also tested the click cycle and upward dragging in the actual interface.

The checks covered what a person could see, beyond the value of a string in memory.

This is a debugging note from one project, not a claim that every caption bug has the same cause. When data changes but a view does not, I will start by tracing the state into the view.
