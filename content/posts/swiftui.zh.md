在 PetAssistant 里，字幕文字存放在协调器的 `lastSpokenText` 属性中。数据已经改变，猫上方却没有出现预期的气泡。

这次问题提醒我：数据能变化，和界面会响应这个变化，是两件需要分别检查的事。

## 检查状态是怎样进入视图的

协调器是一个 `ObservableObject`，字幕属性使用 `@Published`。但是宠物视图最初只是用普通的 `let` 属性保存协调器引用。

简化后的结构是：

```swift
struct PetView: View {
    let coordinator: AppCoordinator

    var body: some View {
        Text(coordinator.lastSpokenText)
    }
}
```

这个引用让视图能够读取数据，却没有建立需要的对象观察关系。修正后的入口使用 `@ObservedObject`：

```swift
struct PetView: View {
    @ObservedObject var coordinator: AppCoordinator

    var body: some View {
        Text(coordinator.lastSpokenText)
    }
}
```

这里的对象由外部协调器管理，视图接收并观察它。字幕变化之后，同一个宿主视图就能更新。

## 更新出现以后，再检查布局

字幕能显示以后，还有一个视觉问题：气泡和猫之间隔得太远。

旧布局带着较大的固定高度和空白占位。移除多余的空白后，让垂直布局按内容收紧，再把实际内容高度反馈给 AppKit 的悬浮面板，窗口就能跟随字幕变化。

拖动与点击也需要分别处理。移动超过阈值时按拖动处理，避免放开鼠标的一刻又触发朗读。

## 完成朗读不等于清空文字

另一个容易混在一起的状态是“正在说话”和“当前显示什么”。语音完成后，应结束说话状态；字幕是否清空，则由点击循环决定。

把这两件事分开，日程才会在读完以后继续留在屏幕上。

## 这次怎样检查

我们在同一个 `NSHostingView` 上依次切换空白、日程和待办文字，并通过渲染与 OCR 检查文字是否真的出现在画面里。随后又在实际界面中检查点击循环和向上拖动。

这个检查覆盖了用户看到的结果，而不只是内存里的一段字符串。

这是一份具体项目里的调试记录，不代表所有字幕问题都会有同一个原因。但下次遇到“数据有了、画面没动”，我会先顺着状态进入视图的路径检查。
