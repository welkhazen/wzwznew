import SwiftUI
import OneSignalFramework

@main
struct RawApp: App {
    init() {
        OneSignalManager.shared.start()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}
