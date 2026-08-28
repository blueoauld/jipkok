import type { Metadata } from "next";

import { LegalPage, Section, Table } from "@/app/components/legal";

export const metadata: Metadata = {
  title: "Delete Your Account | Jipkok",
  description:
    "How to delete your 집콕 (Jipkok) account and what happens to your data.",
};

export default function DeleteAccount() {
  return (
    <LegalPage title="Delete Your Account" effectiveDate="August 28, 2026">
      <p>
        집콕 (Jipkok) is the app published on Google Play by blueoauld. This
        page explains how to delete your account, what to do if you have already
        uninstalled the app, and what happens to your data afterwards.
      </p>

      <Section title="1. Deleting your account in the app">
        <ul>
          <li>Open 집콕 (Jipkok) and go to the Settings tab.</li>
          <li>Tap the exit icon at the top, then choose Delete account.</li>
          <li>Confirm. The account is deleted straight away.</li>
        </ul>
        <p>
          Deleting your account removes your profile, conversations, and
          activity for good. It cannot be undone, and signing up again creates a
          new account with nothing carried over.
        </p>
      </Section>

      <Section title="2. If you have already uninstalled the app">
        <p>
          You do not need to install 집콕 (Jipkok) again. Send an email to{" "}
          <a
            href="mailto:hello@jipkok.app"
            className="underline underline-offset-4"
          >
            hello@jipkok.app
          </a>{" "}
          with &ldquo;Account deletion&rdquo; as the subject and the mobile
          phone number you signed up with.
        </p>
        <p>
          We reply to confirm the request came from the owner of that number,
          then delete the account. There is no charge, and we complete it within
          30 days of confirming the request.
        </p>
      </Section>

      <Section title="3. What happens to your data">
        <Table
          head={["Data", "What happens"]}
          rows={[
            [
              "Profile, profile photos, private photos, bio, comment",
              "No longer appears in the Service from the moment you delete the account, and is erased completely 90 days later",
            ],
            [
              "Likes, favorites, blocks, private photo access, profile view history, point history",
              "Erased immediately",
            ],
            [
              "Feed posts, Worry posts, and the likes and comments you left",
              "Erased immediately. The photo files are removed from storage within 90 days",
            ],
            [
              "Conversations",
              "Disappear from your chats immediately, and are erased with any photos 90 days later",
            ],
            [
              "Notification tokens and saved logins",
              "Erased immediately, so the app stops sending you notifications",
            ],
          ]}
        />
        <p>
          The 90 day period is there to prevent misuse, such as deleting an
          account and signing up again at once to escape a report. Nothing is
          kept beyond it unless the law requires us to keep it.
        </p>
      </Section>

      <Section title="4. Who to contact">
        <Table
          head={["Item", "Detail"]}
          rows={[
            ["App", "집콕 (Jipkok)"],
            ["Developer", "blueoauld"],
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
    </LegalPage>
  );
}
