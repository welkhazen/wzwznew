import SwiftUI
import UIKit
import UserNotifications
import WebKit

@main
struct RAWApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("notification.device_token", token)
        NotificationPermissionCoordinator.registeredDeviceToken(token)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("notification.registration.error", error.localizedDescription)
    }
}

enum NotificationPermissionCoordinator {
    private static weak var webView: WKWebView?

    static func request(webView: WKWebView?) {
        self.webView = webView
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if let error = error {
                print("notification.permission.error", error.localizedDescription)
                sendResult("denied")
                return
            }

            guard granted else {
                print("notification.permission.denied")
                sendResult("denied")
                return
            }

            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
                sendResult("granted")
            }
        }
    }

    static func registeredDeviceToken(_ token: String) {
        DispatchQueue.main.async {
            let script = "window.dispatchEvent(new CustomEvent('raw:apple-notification-device-token',{detail:{token:'\(token)'}}));"
            webView?.evaluateJavaScript(script)
        }
    }

    private static func sendResult(_ status: String) {
        DispatchQueue.main.async {
            let script = "window.dispatchEvent(new CustomEvent('raw:apple-notification-permission',{detail:{status:'\(status)'}}));"
            webView?.evaluateJavaScript(script)
        }
    }
}
