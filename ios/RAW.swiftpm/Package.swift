// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RAW",
    platforms: [
        .iOS("16.0")
    ],
    products: [
        .iOSApplication(
            name: "RAW",
            targets: ["RAW"],
            bundleIdentifier: "com.raw.wzwz",
            teamIdentifier: "",
            displayVersion: "1.0",
            bundleVersion: "1",
            appIcon: .asset("AppIcon"),
            accentColor: .asset("AccentColor"),
            supportedDeviceFamilies: [
                .pad,
                .phone
            ],
            supportedInterfaceOrientations: [
                .portrait,
                .landscapeRight,
                .landscapeLeft
            ]
        )
    ],
    targets: [
        .executableTarget(
            name: "RAW",
            path: ".",
            exclude: ["Package.swift"],
            resources: [
                .process("Assets.xcassets")
            ]
        )
    ]
)
