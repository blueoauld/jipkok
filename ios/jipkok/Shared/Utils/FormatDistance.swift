import Foundation

func formatDistance(_ meters: Double) -> String {
    (meters / 1_000).formatted(.number.precision(.fractionLength(1))) + "km"
}
