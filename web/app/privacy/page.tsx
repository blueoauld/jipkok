import type { Metadata } from "next";

import { LegalPage, Section, Table } from "@/app/components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Jipkok",
  description: "How Jipkok handles your personal information.",
};

export default function EnglishPrivacy() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="September 15, 2026">
      <p>
        집콕 (Jipkok, the &ldquo;Service&rdquo;), published by blueoauld, treats
        your personal information with care and follows the Personal Information
        Protection Act and other applicable law. This policy explains what
        information we collect and why, how long we keep it, and what you can
        ask us to do.
      </p>

      <Section title="1. What we collect and why">
        <Table
          head={["Item", "Purpose", "Collected"]}
          rows={[
            [
              "Mobile phone number",
              "Sign-up, login, identity check, preventing duplicate rewards",
              "At sign-up",
            ],
            [
              "Password",
              "Login (stored encrypted in a form that cannot be reversed)",
              "At sign-up",
            ],
            [
              "Nickname, gender, birth year",
              "Profile display, age verification",
              "At sign-up",
            ],
            [
              "Location (latitude, longitude)",
              "Providing the list of members near you",
              "While using the app",
            ],
            [
              "Profile photos, private photos",
              "Profile display",
              "When you add photos",
            ],
            [
              "Bio, comment",
              "Profile display",
              "When you fill in your profile",
            ],
            ["Feed photos", "Publishing to the feed", "When you post"],
            ["Conversations", "Delivering notes and chat", "While chatting"],
            [
              "Report details",
              "Protecting users, deciding on action",
              "When you report",
            ],
            [
              "IP address",
              "Preventing misuse, limiting how often messages are sent",
              "While using the app",
            ],
            [
              "Device token",
              "Sending notifications",
              "When you allow notifications",
            ],
            ["Advertising ID", "Showing ads", "When you allow ad tracking"],
            [
              "App usage (screens visited, device details)",
              "Usage analytics, diagnosing errors, improving the Service",
              "While using the app",
            ],
          ]}
        />
        <p>
          Even where you do not enter it yourself, your IP address, device
          token, and app usage may be collected automatically as you use the
          Service.
        </p>
      </Section>

      <Section title="2. How long we keep it">
        <ul>
          <li>
            Account information is kept until you delete your account. At that
            point we immediately erase likes, favorites, blocks, feed posts and
            feed likes, private photo access, profile view history, point
            history, and device tokens.
          </li>
          <li>
            Information from a deleted account is kept for 90 days to prevent
            misuse, then erased completely.
          </li>
          <li>
            Conversations in a chat you have left are kept for 90 days after
            they stop being visible to the other person, and are then erased
            completely along with any photos. The same applies when you delete
            your account.
          </li>
          <li>
            Deleted feed posts and photos are erased completely from storage
            after 90 days.
          </li>
          <li>
            Reports are kept for 90 days from the date they are received, then
            erased.
          </li>
          <li>
            Records of suspensions are kept for 1 year after the suspension ends
            so that repeated violations can be assessed.
          </li>
          <li>
            Access records (IP address, device details) are kept for 90 days,
            then erased.
          </li>
          <li>
            Where the law requires information to be retained, we keep it for
            that period.
          </li>
        </ul>
      </Section>

      <Section title="3. Processing entrusted to others">
        <p>
          We entrust the processing of personal information to the following
          providers, to the extent needed to operate the Service.
        </p>
        <Table
          head={["Provider", "What they handle", "What they receive"]}
          rows={[
            [
              "Amazon Web Services",
              "Running servers and the database",
              "All collected information",
            ],
            ["Cloudflare", "Photo storage, traffic handling", "Photos"],
            [
              "Solapi",
              "Sending verification codes by SMS",
              "Mobile phone number",
            ],
            [
              "OpenAI",
              "Screening bios and comments, generating replies from accounts operated by us",
              "Bio, comment, nickname, age, gender, language, messages exchanged with accounts operated by us",
            ],
            [
              "Discord",
              "Passing reports and screening results to operators",
              "Nickname, member ID, reported conversation content",
            ],
            ["Expo", "Sending notifications", "Device token"],
            [
              "Google",
              "Showing ads, usage analytics",
              "Advertising ID, app usage",
            ],
          ]}
        />
        <p>
          Amazon Web Services and Cloudflare store information in a domestic
          region. For other providers, information may be transferred overseas
          to the extent needed to provide the Service.
        </p>
      </Section>

      <Section title="4. Sharing with third parties">
        <p>
          We do not sell or hand over your personal information to third
          parties. We may provide it where investigative authorities request it
          through a lawful process under applicable law.
        </p>
      </Section>

      <Section title="5. Your rights">
        <p>
          You may view, correct, delete, or stop the processing of your personal
          information at any time. You can edit your profile or delete your
          account from the app settings, or make a request at the contact below.
        </p>
      </Section>

      <Section title="6. How we erase information">
        <p>
          Information is destroyed without delay once the retention period ends
          or the purpose of processing has been met. Electronic files are
          deleted in a way that cannot be recovered, and paper documents are
          shredded or incinerated.
        </p>
      </Section>

      <Section title="7. How we keep information safe">
        <ul>
          <li>
            Passwords are stored encrypted in a form that cannot be reversed.
          </li>
          <li>Traffic is encrypted in transit.</li>
          <li>
            We keep the number of people who handle personal information to a
            minimum and manage their access rights.
          </li>
          <li>
            Bios and comments are screened automatically so that inappropriate
            content is hidden.
          </li>
        </ul>
      </Section>

      <Section title="8. Protection of children and young people">
        <p>
          People under 19 cannot sign up for the Service. We collect your birth
          year at sign-up to verify age, and if we learn that a minor has signed
          up, we delete the account and its information.
        </p>
        <p>
          Where we confirm signs of sexual exploitation or abuse of children and
          young people, we preserve the related material and report it to
          investigative authorities under the Act on the Protection of Children
          and Youth Against Sex Offenses and other applicable law, and retain
          that material for the period the law requires.
        </p>
      </Section>

      <Section title="9. Data protection officer">
        <Table
          head={["Item", "Detail"]}
          rows={[
            ["Officer", "Suhwan Kim"],
            [
              "Contact",
              <a
                key="email"
                href="mailto:hello@jipkok.app"
                className="underline underline-offset-4"
              >
                hello@jipkok.app
              </a>,
            ],
          ]}
        />
      </Section>

      <Section title="10. Where to seek help">
        <p>
          If you need help with anything relating to personal information, you
          can contact the following bodies.
        </p>
        <ul>
          <li>
            Privacy Infringement Report Center (
            <a
              href="https://privacy.kisa.or.kr"
              className="underline underline-offset-4"
            >
              privacy.kisa.or.kr
            </a>
            , 118)
          </li>
          <li>
            Personal Information Dispute Mediation Committee (
            <a
              href="https://kopico.go.kr"
              className="underline underline-offset-4"
            >
              kopico.go.kr
            </a>
            , 1833-6972)
          </li>
          <li>
            Supreme Prosecutors&rsquo; Office Cyber Investigation Division (
            <a
              href="https://spo.go.kr"
              className="underline underline-offset-4"
            >
              spo.go.kr
            </a>
            , 1301)
          </li>
          <li>
            National Police Agency Cyber Bureau (
            <a
              href="https://ecrm.police.go.kr"
              className="underline underline-offset-4"
            >
              ecrm.police.go.kr
            </a>
            , 182)
          </li>
        </ul>
        <p>
          For harm involving children and young people, or digital sex crimes,
          the following bodies offer counselling and help with removal.
        </p>
        <ul>
          <li>
            Digital Sex Crime Victim Support Center (
            <a
              href="https://d4u.stop.or.kr"
              className="underline underline-offset-4"
            >
              d4u.stop.or.kr
            </a>
            , 02-735-8994)
          </li>
          <li>
            Women&rsquo;s Emergency Hotline (
            <a
              href="https://women1366.kr"
              className="underline underline-offset-4"
            >
              women1366.kr
            </a>
            , 1366)
          </li>
          <li>
            Youth Counselling Hotline (
            <a
              href="https://1388.go.kr"
              className="underline underline-offset-4"
            >
              1388.go.kr
            </a>
            , 1388)
          </li>
          <li>
            Reporting illegal or harmful information (Korea Communications
            Standards Commission,{" "}
            <a
              href="https://kocsc.or.kr"
              className="underline underline-offset-4"
            >
              kocsc.or.kr
            </a>
            , 1377)
          </li>
        </ul>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          When we change this policy, we announce it in the Service from 7 days
          before the effective date. Changes that materially affect users are
          announced 30 days in advance.
        </p>
      </Section>
    </LegalPage>
  );
}
