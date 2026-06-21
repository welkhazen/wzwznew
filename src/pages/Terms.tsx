import { Link } from "react-router-dom";
import { BrandName } from "@/components/ui/brand-name";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-raw-black">
      <header className="border-b border-raw-border/30 bg-raw-black/85 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link to="/" className="font-display text-xl tracking-[0.2em] text-raw-text/85">
            <BrandName />
          </Link>
          <Link
            to="/"
            className="shrink-0 rounded-lg border border-raw-border/40 bg-raw-black/35 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-raw-silver/75 transition hover:border-raw-gold/35 hover:text-raw-gold sm:text-xs"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <section className="px-4 py-10 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Legal</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">Terms of Service</h1>

          <div className="mt-6 space-y-5 text-raw-silver/75 sm:mt-8 sm:space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-raw-text">1. Acceptance of Terms</h2>
              <p className="mt-2 text-sm leading-relaxed">
                By accessing and using raW, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">2. Use License</h2>
              <p className="mt-2 text-sm leading-relaxed">
                Permission is granted to temporarily download one copy of the materials (information or software) on raW for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Modifying or copying the materials</li>
                <li>• Using the materials for any commercial purpose or for any public display</li>
                <li>• Attempting to decompile or reverse engineer any software contained on raW</li>
                <li>• Removing any copyright or other proprietary notations from the materials</li>
                <li>• Transferring the materials to another person or "mirroring" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">3. Disclaimer</h2>
              <p className="mt-2 text-sm leading-relaxed">
                The materials on raW are provided on an 'as is' basis. raW makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">4. Limitations</h2>
              <p className="mt-2 text-sm leading-relaxed">
                In no event shall raW or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on raW, even if raW or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">5. Accuracy of Materials</h2>
              <p className="mt-2 text-sm leading-relaxed">
                The materials appearing on raW could include technical, typographical, or photographic errors. raW does not warrant that any of the materials on raW are accurate, complete, or current. raW may make changes to the materials contained on raW at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">6. Links</h2>
              <p className="mt-2 text-sm leading-relaxed">
                raW has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by raW of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">7. Modifications</h2>
              <p className="mt-2 text-sm leading-relaxed">
                raW may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">8. Governing Law</h2>
              <p className="mt-2 text-sm leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which raW operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section className="pt-4 border-t border-raw-border/30">
              <p className="text-xs text-raw-silver/50">Last updated: April 2026</p>
            </section>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
