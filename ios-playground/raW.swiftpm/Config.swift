import Foundation

enum Config {
    // Same OneSignal project as web + RN clients.
    static let oneSignalAppId = "debf83a7-182a-4f37-8bd1-614de363322f"

    // Fill these with the values from .env (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).
    // For App Store distribution, prefer reading from Info.plist via Bundle.main.object(forInfoDictionaryKey:).
    static let supabaseUrl = URL(string: "REPLACE_WITH_VITE_SUPABASE_URL")!
    static let supabasePublishableKey = "REPLACE_WITH_VITE_SUPABASE_PUBLISHABLE_KEY"
}
