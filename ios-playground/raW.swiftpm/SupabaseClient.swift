import Foundation
import Supabase

/// Shared Supabase client. Same project as the web + RN apps,
/// so users / polls / communities are unified across surfaces.
enum SupabaseService {
    static let client = SupabaseClient(
        supabaseURL: Config.supabaseUrl,
        supabaseKey: Config.supabasePublishableKey
    )
}
