import SwiftUI
import WebKit

private let appURL = URL(string: "https://wzwz-william-el-khazens-projects.vercel.app")!
private let gold = UIColor(red: 241/255, green: 196/255, blue: 45/255, alpha: 1)

// MARK: - ViewModel

final class WebViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var progress: Double = 0
    weak var webView: WKWebView?

    func share() {
        let url = webView?.url ?? appURL
        let av = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first?.rootViewController else { return }
        if let pop = av.popoverPresentationController {
            pop.sourceView = root.view
            pop.sourceRect = CGRect(x: root.view.bounds.maxX - 60, y: root.view.bounds.maxY - 80, width: 44, height: 44)
        }
        root.present(av, animated: true)
    }
}

// MARK: - WebView

struct AppWebView: UIViewRepresentable {
    @ObservedObject var viewModel: WebViewModel

    func makeCoordinator() -> Coordinator { Coordinator(viewModel: viewModel) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.userContentController.add(context.coordinator, name: "rawNotifications")

        let wv = WKWebView(frame: .zero, configuration: config)
        wv.navigationDelegate = context.coordinator
        wv.allowsBackForwardNavigationGestures = true
        wv.scrollView.contentInsetAdjustmentBehavior = .never
        wv.isOpaque = false
        wv.backgroundColor = UIColor(red: 0.05, green: 0.05, blue: 0.05, alpha: 1)

        let refresh = UIRefreshControl()
        refresh.tintColor = gold
        refresh.addTarget(context.coordinator, action: #selector(Coordinator.handleRefresh(_:)), for: .valueChanged)
        wv.scrollView.addSubview(refresh)
        context.coordinator.refreshControl = refresh

        context.coordinator.progressObserver = wv.observe(\.estimatedProgress, options: .new) { [weak viewModel] wv, _ in
            DispatchQueue.main.async { viewModel?.progress = wv.estimatedProgress }
        }

        viewModel.webView = wv
        wv.load(URLRequest(url: appURL))
        return wv
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    // MARK: Coordinator

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        let viewModel: WebViewModel
        var refreshControl: UIRefreshControl?
        var progressObserver: NSKeyValueObservation?

        init(viewModel: WebViewModel) { self.viewModel = viewModel }

        @objc func handleRefresh(_ sender: UIRefreshControl) {
            viewModel.webView?.reload()
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "rawNotifications" else { return }
            NotificationPermissionCoordinator.request(webView: viewModel.webView)
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation _: WKNavigation!) {
            DispatchQueue.main.async { self.viewModel.isLoading = true }
        }

        func webView(_ webView: WKWebView, didFinish _: WKNavigation!) {
            DispatchQueue.main.async {
                self.viewModel.isLoading = false
                self.refreshControl?.endRefreshing()
            }
        }

        func webView(_ webView: WKWebView, didFail _: WKNavigation!, withError _: Error) {
            DispatchQueue.main.async {
                self.viewModel.isLoading = false
                self.refreshControl?.endRefreshing()
            }
        }

        func webView(_ webView: WKWebView,
                     decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { return decisionHandler(.allow) }

            // Open tel/mailto/sms natively
            if ["tel", "mailto", "sms"].contains(url.scheme ?? "") {
                UIApplication.shared.open(url)
                return decisionHandler(.cancel)
            }

            // Open truly external links in Safari
            if action.navigationType == .linkActivated,
               let host = url.host,
               !host.contains("wzwz") && !host.contains("vercel") && !host.contains("supabase") {
                UIApplication.shared.open(url)
                return decisionHandler(.cancel)
            }

            decisionHandler(.allow)
        }
    }
}

// MARK: - ContentView

struct ContentView: View {
    @StateObject private var viewModel = WebViewModel()

    var body: some View {
        ZStack(alignment: .top) {
            AppWebView(viewModel: viewModel)
                .ignoresSafeArea()

            // Gold progress bar
            if viewModel.isLoading {
                GeometryReader { geo in
                    Rectangle()
                        .fill(Color(red: 241/255, green: 196/255, blue: 45/255))
                        .frame(width: geo.size.width * viewModel.progress, height: 2)
                        .animation(.linear(duration: 0.1), value: viewModel.progress)
                }
                .frame(height: 2)
                .ignoresSafeArea()
            }
        }
        // Native share button — counts as native functionality for App Store review
        .overlay(alignment: .bottomTrailing) {
            Button { viewModel.share() } label: {
                Image(systemName: "square.and.arrow.up")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color(red: 241/255, green: 196/255, blue: 45/255))
                    .padding(14)
                    .background(.ultraThinMaterial, in: Circle())
            }
            .padding(.trailing, 20)
            .padding(.bottom, 48)
        }
    }
}
