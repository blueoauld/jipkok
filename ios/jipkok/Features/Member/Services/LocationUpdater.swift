import CoreLocation
import UIKit

@MainActor
final class LocationUpdater {
    
    private let provider = LocationProvider()
    private let repository: MemberRepository
    private var isUpdating = false
    
    init(repository: MemberRepository = MemberRepository()) {
        self.repository = repository
    }
    
    func update() async -> String? {
        guard !isUpdating else { return nil }
        
        isUpdating = true
        
        defer { isUpdating = false }
        
        guard await provider.requestAuthorization() else {
            return "위치 권한을 허용해야 거리가 표시됩니다."
        }
        
        guard let location = await provider.currentLocation() else {
            return "위치를 확인하지 못했습니다. 잠시 후 다시 시도해주세요."
        }
        
        do {
            try await sendHeartbeat(coordinate: location.coordinate)
            
            return nil
        } catch {
            return APIError.from(error).message
        }
    }
    
    func refresh() async {
        guard !isUpdating else { return }
        
        isUpdating = true
        
        defer { isUpdating = false }
        
        try? await sendHeartbeat(coordinate: await cachedCoordinate())
    }
    
    private func cachedCoordinate() async -> CLLocationCoordinate2D? {
        guard provider.isAuthorized else { return nil }
        
        if let cached = provider.lastKnownLocation {
            return cached.coordinate
        }
        
        return await provider.currentLocation()?.coordinate
    }
    
    private func sendHeartbeat(coordinate: CLLocationCoordinate2D?) async throws {
        try await repository.heartbeat(
            latitude: coordinate?.latitude,
            longitude: coordinate?.longitude,
            deviceName: UIDevice.current.model
        )
    }
}
