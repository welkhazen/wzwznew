import Foundation
import OneSignalFramework

/// Thin wrapper around the OneSignal iOS SDK so the rest of the app
/// doesn't import OneSignal directly. Same App ID as web + RN.
final class OneSignalManager {
    static let shared = OneSignalManager()

    private init() {}

    /// Call once on app launch.
    func start() {
        #if DEBUG
        OneSignal.Debug.setLogLevel(.LL_VERBOSE)
        #endif
        OneSignal.initialize(Config.oneSignalAppId, withLaunchOptions: nil)
    }

    /// Show the OS permission prompt. Resolves to true if granted.
    @discardableResult
    func requestPushPermission() async -> Bool {
        await withCheckedContinuation { continuation in
            OneSignal.Notifications.requestPermission({ accepted in
                continuation.resume(returning: accepted)
            }, fallbackToSettings: true)
        }
    }

    /// Tie the device subscription to your Supabase user id.
    func identify(userId: String) {
        OneSignal.login(userId)
    }

    /// Drop identity on logout.
    func clearIdentity() {
        OneSignal.logout()
    }

    var isOptedIn: Bool {
        OneSignal.User.pushSubscription.optedIn
    }
}
