import SwiftUI

struct ContentView: View {
    @State private var pushStatus: String?

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Text("raW")
                .font(.system(size: 64, weight: .bold, design: .default))
                .tracking(8)
                .foregroundStyle(Color.rawGold)

            Text("Find your people.\nGrow behind your avatar.")
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundStyle(Color.rawSilver)

            Spacer()

            Button {
                Task {
                    let granted = await OneSignalManager.shared.requestPushPermission()
                    pushStatus = granted ? "Push enabled" : "Push denied"
                }
            } label: {
                Text("Enable notifications")
                    .font(.system(size: 13, weight: .bold))
                    .tracking(2)
                    .textCase(.uppercase)
                    .foregroundStyle(Color.rawBlack)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 14)
                    .background(
                        Capsule().fill(Color.rawGold)
                    )
            }

            if let pushStatus {
                Text(pushStatus)
                    .font(.footnote)
                    .foregroundStyle(Color.rawSilver)
            }

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.rawBlack.ignoresSafeArea())
    }
}

extension Color {
    static let rawBlack = Color(red: 0.05, green: 0.05, blue: 0.05)
    static let rawGold = Color(red: 0.945, green: 0.769, blue: 0.176)
    static let rawSilver = Color(red: 0.66, green: 0.66, blue: 0.66)
}

#Preview {
    ContentView()
        .preferredColorScheme(.dark)
}
