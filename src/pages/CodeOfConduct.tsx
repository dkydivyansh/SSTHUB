import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  BookOpen,
  Code2,
  MessageSquareWarning,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Users,
  FileText,
  ExternalLink
} from 'lucide-react';

export default function CodeOfConduct() {
  return (
    <div className="min-h-screen bg-[#FFF5E1] text-black font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black uppercase tracking-widest text-xs sm:text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
          <div className="bg-black text-white px-3 py-1.5 border-2 border-black font-black uppercase tracking-widest text-xs">
            SSTHUB
          </div>
        </div>

        {/* Hero Header Card */}
        <div className="bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4">
            Student Code of Conduct
          </h1>
          <p className="text-base sm:text-lg font-bold text-gray-700 leading-relaxed">
            SST Hub is the digital community platform for Scaler School of Technology students, faculty, and mentors.
            This Code of Conduct outlines the standards of academic honesty, integrity, safety, and mutual respect
            expected from every member of our institution.
          </p>
          <div className="mt-6 pt-6 border-t-2 border-black flex flex-wrap gap-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
            <span>Version: 2.1</span>
            <span>•</span>
            <span>Applies to: All Registered Students & Platform Users</span>
          </div>
        </div>

        {/* Important Notice Alert Card */}
        <div className="bg-[#FFF] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(239,68,68,1)] border-l-[12px] border-l-red-500 flex flex-col sm:flex-row gap-4 items-start">
          <ShieldAlert size={32} className="text-red-500 shrink-0 mt-1" />
          <div className="flex flex-col gap-1">
            <h3 className="font-black text-lg uppercase tracking-wide text-red-600">
              Institutional Monitoring & Investigation Policy
            </h3>
            <p className="text-sm font-bold text-gray-800 leading-relaxed">
              SST Hub is an institutional resource. To maintain a safe learning environment, prevent harassment, and enforce academic integrity,
              <strong> user communications, chat logs, group posts, and submitted materials may be accessed, audited, and investigated by the SST Disciplinary Committee and platform administrators</strong> upon receipt of violation reports or credible suspicion of misconduct.
            </p>
          </div>
        </div>

        {/* Section 1: Community Safety & Anti-Harassment */}
        <section className="bg-white border-4 border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-2 border-black pb-3">
            <div className="bg-emerald-400 p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Users size={24} className="text-black" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              1. Community Safety & Anti-Harassment
            </h2>
          </div>

          <p className="font-bold text-gray-700 text-sm sm:text-base leading-relaxed">
            Every student has the fundamental right to learn, collaborate, and interact in an environment free from intimidation, discrimination, and hostility.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-[#f4f4f5] border-2 border-black p-4">
              <h4 className="font-black uppercase text-sm mb-2 flex items-center gap-2 text-red-600">
                <AlertTriangle size={16} /> Zero Tolerance Violations
              </h4>
              <ul className="list-disc list-inside text-xs sm:text-sm font-bold text-gray-800 space-y-1.5">
                <li>Harassment, stalking, or persistent unsolicited messaging</li>
                <li>Hate speech, bigotry, slurs, or discriminatory remarks</li>
                <li>Bullying, intimidation, or character defamation</li>
                <li>Sharing explicit, offensive, or non-consensual media</li>
                <li>Threats of physical harm or online toxicity</li>
              </ul>
            </div>

            <div className="bg-[#f4f4f5] border-2 border-black p-4">
              <h4 className="font-black uppercase text-sm mb-2 flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={16} /> Expected Conduct
              </h4>
              <ul className="list-disc list-inside text-xs sm:text-sm font-bold text-gray-800 space-y-1.5">
                <li>Treat peers, mentors, and faculty with courtesy and dignity</li>
                <li>Provide constructive, respectful feedback in study groups</li>
                <li>Respect boundaries and individual privacy</li>
                <li>Foster an inclusive atmosphere for all cohorts and backgrounds</li>
                <li>Report safety concerns promptly to platform moderators</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Academic Integrity & Anti-Plagiarism */}
        <section className="bg-white border-4 border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-2 border-black pb-3">
            <div className="bg-amber-400 p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Code2 size={24} className="text-black" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              2. Academic Integrity & Anti-Plagiarism
            </h2>
          </div>

          <p className="font-bold text-gray-700 text-sm sm:text-base leading-relaxed">
            Scaler School of Technology emphasizes rigorous hands-on problem solving. True software engineering capability is built through independent effort and honest collaboration.
          </p>

          <div className="flex flex-col gap-3">
            <div className="border-2 border-black p-4 bg-[#FFF8E7]">
              <h4 className="font-black uppercase text-sm mb-1 text-black">
                Prohibition of Code Copying & Unauthorized Sharing
              </h4>
              <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                Copying code for graded assignments, contest problems, labs, capstones, or projects from peers, public repositories, or online forums without explicit authorization is strictly prohibited. Submitting code you do not understand or cannot explain constitutes academic dishonesty.
              </p>
            </div>

            <div className="border-2 border-black p-4 bg-[#FFF8E7]">
              <h4 className="font-black uppercase text-sm mb-1 text-black">
                Unauthorized Collaboration
              </h4>
              <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                Sharing solution files, test case inputs, assessment repos, or live test code via SST Hub chats, direct messages, or private groups is treated as aiding academic dishonesty and will penalize both the provider and the recipient.
              </p>
            </div>

            <div className="border-2 border-black p-4 bg-[#FFF8E7]">
              <h4 className="font-black uppercase text-sm mb-1 text-black">
                Generative AI Usage
              </h4>
              <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                Students must adhere to course-specific AI policies. Unattributed copy-pasting of AI-generated solutions into coursework where individual implementation is required violates this code.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Platform Security, Direct Messages & Investigations */}
        <section className="bg-white border-4 border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-2 border-black pb-3">
            <div className="bg-[#3B82F6] p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <MessageSquareWarning size={24} className="text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              3. Communication Channels & Investigation Protocol
            </h2>
          </div>

          <p className="font-bold text-gray-700 text-sm sm:text-base leading-relaxed">
            To protect community members from abuse and investigate misconduct:
          </p>

          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm font-bold text-gray-800 pl-1">
            <li>
              <strong>No Expectation of Absolute Anonymity:</strong> While privacy is respected, SST Hub accounts are linked to official Scaler institutional identities (<code className="bg-gray-200 px-1 py-0.5 border border-black text-xs font-mono">@sst.scaler.com</code>).
            </li>
            <li>
              <strong>Audit Trail & Logs:</strong> All chat interactions, attachment uploads, invite links, and group management actions maintain server-side audit logs.
            </li>
            <li>
              <strong>Investigation Access:</strong> If a formal grievance or safety report is filed regarding harassment, cheating, fraud, or abuse, authorized investigative officers may examine chat histories and relevant records to reach factual determinations.
            </li>
            <li>
              <strong>Protection of Evidence:</strong> Deleting accounts or messages to obstruct a disciplinary inquiry is considered an additional serious infraction.
            </li>
          </ul>
        </section>

        {/* Section 4: System Integrity & Prohibited Actions */}
        <section className="bg-white border-4 border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-2 border-black pb-3">
            <div className="bg-purple-400 p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Lock size={24} className="text-black" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              4. Platform Security & Prohibited Activities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-black p-4 bg-[#f4f4f5]">
              <p className="text-xs sm:text-sm font-bold text-gray-800">
                <strong>Unauthorized Scraping & Access:</strong> Attempting to scrape user profiles, harvest email addresses, or bypass API security controls.
              </p>
            </div>
            <div className="border-2 border-black p-4 bg-[#f4f4f5]">
              <p className="text-xs sm:text-sm font-bold text-gray-800">
                <strong>Malware & Phishing:</strong> Distributing malicious links, executables, scam invitations, or spoofed login portals.
              </p>
            </div>
            <div className="border-2 border-black p-4 bg-[#f4f4f5]">
              <p className="text-xs sm:text-sm font-bold text-gray-800">
                <strong>Account Impersonation:</strong> Misrepresenting identity, batch, roll number, or administrative affiliation.
              </p>
            </div>
            <div className="border-2 border-black p-4 bg-[#f4f4f5]">
              <p className="text-xs sm:text-sm font-bold text-gray-800">
                <strong>Exploit Disclosure:</strong> Discovered security flaws must be disclosed responsibly to SST Hub administrators rather than exploited or broadcasted.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Disciplinary Actions & Penalties */}
        <section className="bg-white border-4 border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-2 border-black pb-3">
            <div className="bg-red-500 p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Scale size={24} className="text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              5. Disciplinary Actions & Punitive Measures
            </h2>
          </div>

          <p className="font-bold text-gray-700 text-sm sm:text-base leading-relaxed">
            Violations of this Student Code of Conduct will result in progressive disciplinary action based on the severity and recurrence of the offense:
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4 p-4 border-2 border-black bg-white">
              <span className="bg-yellow-400 font-black px-2 py-1 border border-black text-xs shrink-0">Level 1</span>
              <div>
                <h5 className="font-black text-sm uppercase">Formal Warning & Content Deletion</h5>
                <p className="text-xs sm:text-sm font-bold text-gray-700">Official written warning issued on student record and immediate removal of offending content or attachments.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border-2 border-black bg-white">
              <span className="bg-orange-500 text-white font-black px-2 py-1 border border-black text-xs shrink-0">Level 2</span>
              <div>
                <h5 className="font-black text-sm uppercase">Temporary Suspension & Privilege Revocation</h5>
                <p className="text-xs sm:text-sm font-bold text-gray-700">Suspension of SST Hub account, forfeiture of group admin permissions, and formal notification to batch mentors and academic advisors.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border-2 border-black bg-white">
              <span className="bg-red-600 text-white font-black px-2 py-1 border border-black text-xs shrink-0">Level 3</span>
              <div>
                <h5 className="font-black text-sm uppercase">Permanent Platform Ban & Institutional Escalation</h5>
                <p className="text-xs sm:text-sm font-bold text-gray-700">Permanent exclusion from SST Hub and referral to the Scaler School of Technology Disciplinary Committee for academic suspension, course grade reduction (Grade 'F'), or permanent expulsion.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Reporting & Contact */}
        <section className="bg-black text-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-2 border-white/30 pb-3">
            <FileText size={24} className="text-[#3B82F6]" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              6. Reporting Violations & Grievances
            </h2>
          </div>

          <p className="font-bold text-gray-300 text-sm sm:text-base leading-relaxed">
            If you experience or witness harassment, academic malpractice, or platform abuse, you are encouraged to report it immediately. Reports are treated with strict confidentiality and protection against retaliation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <div className="bg-[#18181b] border-2 border-white/20 p-4 flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Disciplinary Contact</p>
              <a href="mailto:support-sst-hub@dkydivyansh.com" className="text-sm font-black text-white hover:text-[#3B82F6] transition-colors">
                support-sst-hub@dkydivyansh.com
              </a>
            </div>
            <div className="bg-[#18181b] border-2 border-white/20 p-4 flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Administration & IT Support</p>
              <a href="mailto:support-sst-hub@dkydivyansh.com" className="text-sm font-black text-white hover:text-[#3B82F6] transition-colors">
                support-sst-hub@dkydivyansh.com
              </a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-gray-400">
              By accessing SST Hub, you acknowledge and agree to abide by all stipulations of this Code of Conduct.
            </p>
            <Link
              to="/login"
              className="bg-[#3B82F6] text-white border-2 border-white px-6 py-2.5 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-colors shrink-0"
            >
              Return to Login
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-black/20 text-xs font-bold text-gray-600 uppercase tracking-widest">
          <span>Scaler School of Technology • SST Hub Policy</span>
          <div className="flex items-center gap-1.5 text-black">
            <span>Made by</span>
            <a
              href="https://dkydivyansh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white px-2.5 py-1 font-black hover:bg-[#3B82F6] hover:text-white transition-all inline-flex items-center gap-1"
            >
              dkydivyansh <ExternalLink size={10} />
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
}
