import Foundation

func relativeTime(from date: Date, now: Date = Date()) -> String {
    now.timeIntervalSince(date) < 60
        ? "방금 전"
        : date.formatted(.relative(presentation: .numeric))
}
