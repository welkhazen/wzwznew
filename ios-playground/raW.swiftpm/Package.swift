// swift-tools-version:5.9

// Swift Playgrounds App Project for raW.
// Open this folder on iPad in Swift Playgrounds, or in Xcode 15+ on macOS.
// "Distribute" inside Swift Playgrounds builds a signed IPA for the App Store.

import PackageDescription
import AppleProductTypes

let package = Package(
    name: "raW",
    platforms: [
        .iOS("17.0")
    ],
    products: [
        .iOSApplication(
            name: "raW",
            targets: ["AppModule"],
            bundleIdentifier: "app.raw.mobile",
            teamIdentifier: "",
            displayVersion: "0.1",
            bundleVersion: "1",
            appIcon: .placeholder(icon: .signature),
            accentColor: .presetColor(.yellow),
            supportedDeviceFamilies: [.phone],
            supportedInterfaceOrientations: [.portrait],
            capabilities: [
                .pushNotifications()
            ],
            appCategory: .socialNetworking
        )
    ],
    dependencies: [
        // OneSignal native iOS SDK — same App ID as the web + RN apps.
        .package(url: "https://github.com/OneSignal/OneSignal-iOS-SDK.git", from: "5.2.0"),
        // Supabase Swift client — shares the same Supabase project as the web app.
        .package(url: "https://github.com/supabase-community/supabase-swift.git", from: "2.5.0")
    ],
    targets: [
        .executableTarget(
            name: "AppModule",
            dependencies: [
                .product(name: "OneSignalFramework", package: "OneSignal-iOS-SDK"),
                .product(name: "Supabase", package: "supabase-swift")
            ],
            path: "."
        )
    ]
)
