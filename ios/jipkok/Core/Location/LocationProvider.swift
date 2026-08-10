import CoreLocation

@MainActor
final class LocationProvider: NSObject, CLLocationManagerDelegate {

    private let manager = CLLocationManager()
    private var authorizationContinuation: CheckedContinuation<Void, Never>?
    private var locationContinuation: CheckedContinuation<CLLocation?, Never>?

    override init() {
        super.init()

        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    var isAuthorized: Bool {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways: true
        default: false
        }
    }

    var lastKnownLocation: CLLocation? {
        manager.location
    }

    func requestAuthorization() async -> Bool {
        guard manager.authorizationStatus == .notDetermined else { return isAuthorized }

        await withCheckedContinuation { continuation in
            authorizationContinuation = continuation
            manager.requestWhenInUseAuthorization()
        }

        return isAuthorized
    }

    func currentLocation(timeout: Duration = .seconds(10)) async -> CLLocation? {
        let timeoutTask = Task {
            try? await Task.sleep(for: timeout)

            guard !Task.isCancelled else { return }

            finishLocation(nil)
        }

        defer { timeoutTask.cancel() }

        let location = await withCheckedContinuation { continuation in
            locationContinuation = continuation
            manager.requestLocation()
        }

        return location ?? manager.location
    }

    private func finishLocation(_ location: CLLocation?) {
        locationContinuation?.resume(returning: location)
        locationContinuation = nil
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            authorizationContinuation?.resume()
            authorizationContinuation = nil
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            finishLocation(locations.last)
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            finishLocation(nil)
        }
    }
}
