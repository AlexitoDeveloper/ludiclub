export function PrivacyContentEn() {
  return (
    <>
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Data Controller and General Information</h2>
        <p>
          In compliance with Regulation (EU) 2016/679 of the European Parliament and of the Council (General Data Protection Regulation - GDPR) and the Spanish Organic Law 3/2018 on Personal Data Protection and Digital Rights Guarantee (LOPDGDD), the data controller responsible for the processing of personal data collected via the <strong>Ludiclub</strong> platform and mobile app (hereinafter, &quot;the App&quot; or &quot;the Platform&quot;) is:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li><strong>Project / Trade Name:</strong> Ludiclub</li>
          <li><strong>Jurisdiction & Location:</strong> Spain (European Union)</li>
          <li><strong>Privacy & Data Protection Contact:</strong> <span className="font-mono text-primary">support@ludiclub.app</span></li>
          <li><strong>Web Account Deletion Portal:</strong> <a href="/delete-account" className="text-primary underline">ludiclub.app/delete-account</a></li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Personal Data We Collect and Data Categories</h2>
        <p>
          Ludiclub only collects personal information necessary to coordinate board game meetups, manage personal game collections, and enable communication between tabletop enthusiasts:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
          <li>
            <strong>Identity and Account Data:</strong> Email address, unique user identifier (UUID), public username or display alias, optional user avatar photo, and account credentials protected by cryptographic one-way salted hashing.
          </li>
          <li>
            <strong>User-Generated Content (UGC) and Community Activity:</strong> Meetup titles, dates, descriptions, and rosters; messages sent inside table or group chat rooms; board game collection entries (owned, wishlist, loaned); game ratings, poll votes, and tier lists.
          </li>
          <li>
            <strong>Declarative Meetup Location Data:</strong> Venue name or physical address manually entered by the table host. <em>Ludiclub does not collect, monitor, or track continuous or background GPS geolocation from your mobile device.</em>
          </li>
          <li>
            <strong>Technical Connection and Usage Data:</strong> IP address, server connection access logs required for technical diagnostics, cyberattack prevention, and system security, along with app version and operating system details.
          </li>
          <li>
            <strong>Moderation, Support, and Safety Data:</strong> Reports filed by or against users regarding objectionable conduct, preventive block records, and correspondence with our community support team.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Purposes and Legal Bases for Processing</h2>
        <p>
          Under Article 6 of the GDPR, we process your personal data under the following legal bases:
        </p>
        <div className="space-y-2 text-muted-foreground">
          <p>
            <strong>A. Contract Performance & Terms of Service (Art. 6.1.b GDPR):</strong> Creating and administering user accounts, coordinating table sessions, enabling chat messaging, catalog browsing, collection management, and sending essential operational service alerts.
          </p>
          <p>
            <strong>B. Legitimate Interest (Art. 6.1.f GDPR):</strong> Safeguarding the integrity and security of our IT infrastructure, preventing abuse, spam, or fraud, moderating reported content to enforce Community Guidelines, and maintaining a safe gaming environment.
          </p>
          <p>
            <strong>C. Legal Obligations (Art. 6.1.c GDPR):</strong> Complying with statutory requests from law enforcement, judicial authorities, and electronic commerce regulations (including the Spanish LSSI-CE and European digital services directives).
          </p>
          <p>
            <strong>D. Explicit Consent (Art. 6.1.a GDPR):</strong> For voluntary upload of avatar photos from your device library and enabling push notifications on your mobile device (revocable anytime in OS system settings).
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Data Retention and Blocking Obligations</h2>
        <p>
          Your personal data is retained for as long as your Ludiclub user account remains active.
        </p>
        <p className="text-muted-foreground">
          When you request the deletion of your account (either inside the app or via our web portal), your public profile, credentials, and active data are immediately purged from our active systems.
        </p>
        <p className="text-muted-foreground">
          In accordance with <strong>Article 32 of Spanish LOPDGDD</strong>, data strictly required to meet statutory, tax, or legal liabilities will be preserved in a <strong>blocked state</strong> (accessible exclusively to judges, courts, the Public Prosecutor, or competent public authorities) during the statutory limitation periods (generally 3 to 5 years under Spanish civil law). Once this period expires, all retained records are permanently deleted or irreversibly anonymized.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Third-Party Sub-processors and Data Transfers</h2>
        <p>
          Ludiclub <strong>never sells, rents, or monetizes personal user data</strong> with advertisers or data brokers. We rely on verified sub-processors to deliver core app functionality:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
          <li>
            <strong>Supabase Inc.:</strong> Cloud infrastructure provider for managed PostgreSQL databases, encrypted authentication, and file storage. Data transfers and processing comply with EU Standard Contractual Clauses (SCCs) and the EU-U.S. Data Privacy Framework.
          </li>
          <li>
            <strong>BoardGameGeek (BGG):</strong> Open public API integration for retrieving board game cover images and metadata. No personal user data is ever transmitted to BGG.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">6. Your Rights (GDPR / ARCO-POL)</h2>
        <p>
          Under Articles 15 to 22 of the GDPR and Spanish data protection law, you have the right to exercise:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li><strong>Right of Access:</strong> Obtain confirmation and copies of your personal data being processed.</li>
          <li><strong>Right to Rectification:</strong> Update inaccurate or outdated information via your profile settings.</li>
          <li><strong>Right to Erasure (&quot;Right to be forgotten&quot;):</strong> Request permanent deletion of your account and personal records.</li>
          <li><strong>Right to Restriction of Processing:</strong> Request temporary freezing of your data in legally specified scenarios.</li>
          <li><strong>Right to Data Portability:</strong> Receive your personal data in a structured, commonly used, machine-readable format.</li>
          <li><strong>Right to Object:</strong> Object at any time to data processing based on our legitimate interest.</li>
          <li><strong>Right not to be subject to Automated Decision-Making:</strong> Ludiclub does not utilize automated profiling producing legal effects.</li>
        </ul>
        <div className="bg-muted/40 p-3.5 rounded-lg border border-border/50 text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground">How to exercise your rights?</p>
          <p>
            You can delete your account immediately in-app via <strong>Profile → Settings → Delete account</strong>, or online at <a href="/delete-account" className="text-primary underline">ludiclub.app/delete-account</a>.
          </p>
          <p>
            For any other privacy request, contact us at <span className="font-mono text-primary">support@ludiclub.app</span> stating your username and the right you wish to exercise.
          </p>
          <p>
            You also hold the right to lodge a formal complaint with the Spanish Data Protection Supervisory Authority, the <strong>Agencia Española de Protección de Datos (AEPD)</strong>, C/ Jorge Juan 6, 28001 Madrid, or online at <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.aepd.es</a>.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">7. Protection of Minors</h2>
        <p className="text-muted-foreground">
          Pursuant to <strong>Article 7 of Spanish LOPDGDD</strong>, the legal minimum age to independently consent to data processing for online services in Spain is <strong>14 years old</strong>.
        </p>
        <p className="text-muted-foreground">
          Ludiclub is not directed to individuals under 14 without verifiable parental consent. If we learn that personal data of a child under 14 has been collected without parental consent, we will promptly delete that account and all associated data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">8. Technical and Organizational Security (Art. 32 GDPR)</h2>
        <p className="text-muted-foreground">
          Ludiclub applies rigorous industry-standard security safeguards:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>End-to-end data transmission encryption via TLS 1.3 / HTTPS.</li>
          <li>One-way salted cryptographic hashing for all stored credentials.</li>
          <li>Database row-level isolation via Supabase Row Level Security (RLS) policies.</li>
          <li>Strict least-privilege administrative access and redundant automated backups.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">9. Local Storage and Technical Cookies</h2>
        <p className="text-muted-foreground">
          The Platform exclusively utilizes client-side storage technologies (such as <code>localStorage</code> and <code>sessionStorage</code>) for <strong>strictly technical and functional purposes</strong>: persisting your authenticated session and saving UI preferences (language selection and light/dark theme). We do not deploy third-party advertising cookies or cross-site tracking pixels.
        </p>
      </section>
    </>
  )
}
