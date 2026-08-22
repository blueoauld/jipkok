import type { Metadata } from "next";

import { LegalPage, Section, Table } from "@/app/components/legal";

export const metadata: Metadata = {
  title: "Terms of Service | Jipkok",
  description: "The rules that apply when you use Jipkok.",
};

export default function EnglishTerms() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="August 24, 2026">
      <p>
        These terms set out what applies between us and you when you use Jipkok
        (the &ldquo;Service&rdquo;). By signing up, you agree to them.
      </p>

      <Section title="1. Signing up">
        <ul>
          <li>You must be 19 or older to sign up.</li>
          <li>
            Sign-up is complete once you verify your own mobile phone number.
          </li>
          <li>One person may not create multiple accounts.</li>
          <li>
            Using someone else&rsquo;s information, or entering information that
            is not true, may result in restricted access.
          </li>
        </ul>
      </Section>

      <Section title="2. What the Service does">
        <p>The Service provides the following.</p>
        <ul>
          <li>A list of members near you</li>
          <li>Notes and one-to-one chat</li>
          <li>A feed for photos and short posts</li>
          <li>Likes, favorites, and blocking</li>
          <li>
            Points earned from daily check-ins, login rewards, and watching ads
          </li>
        </ul>
        <p>
          What the Service offers may change as we operate it. We announce
          significant changes in advance.
        </p>
      </Section>

      <Section title="3. Prohibited conduct">
        <p>
          To protect our users, we take a zero-tolerance approach to
          inappropriate content. We may hide posts or suspend access without
          prior notice for any of the following, and may delete the account if
          it happens repeatedly.
        </p>
        <ul>
          <li>Posting sexual content, or implying paid sex</li>
          <li>Abuse, threats, or demeaning a particular group</li>
          <li>Harassing or stalking another person</li>
          <li>
            Writing out messaging IDs, phone numbers, or similar to move people
            off the Service
          </li>
          <li>Commercial promotion, or drawing users to another service</li>
          <li>
            Using another person&rsquo;s photos or information as your own
          </li>
          <li>Demanding money, or attempting fraud</li>
          <li>
            Using the Service through automated tools, or interfering with our
            systems
          </li>
        </ul>
      </Section>

      <Section title="4. Protection of children and young people">
        <p>
          The Service is for users 19 and older. We do not tolerate the sexual
          exploitation or abuse of children and young people under any
          circumstances.
        </p>
        <ul>
          <li>
            Posting, exchanging, or requesting sexual exploitation material
            involving children or young people
          </li>
          <li>
            Approaching or engaging a minor in conversation for sexual purposes
          </li>
          <li>Lying about your age to sign up, or helping a minor sign up</li>
          <li>
            Defending or glamorizing sexual expression directed at children and
            young people
          </li>
        </ul>
        <p>
          When such conduct is confirmed, we permanently suspend the account
          without prior notice, preserve the related material, and report it to
          investigative authorities under the Act on the Protection of Children
          and Youth Against Sex Offenses and other applicable law. We do not
          accept appeals against restrictions in these cases.
        </p>
        <p>
          If you come across an account that appears to belong to a minor, or
          conduct directed at children and young people, report it using the
          report feature in the app. We review those reports ahead of all
          others.
        </p>
      </Section>

      <Section title="5. Handling of content">
        <ul>
          <li>
            The rights to the photos and text you post remain yours. We use them
            only to the extent needed to display and deliver them.
          </li>
          <li>
            Bios and comments are screened automatically, and anything judged
            inappropriate is hidden from other users.
          </li>
          <li>
            Reported posts and conversations are reviewed and acted on within 24
            hours.
          </li>
          <li>
            We may remove content that breaks the law or infringes on
            someone&rsquo;s rights without prior notice.
          </li>
        </ul>
      </Section>

      <Section title="6. Reporting and blocking">
        <p>
          If you come across a profile or conversation you find unpleasant, you
          can report or block it at any time. Blocked users do not appear in
          your lists or feed, and no messages can pass between you.
        </p>
      </Section>

      <Section title="7. Points">
        <Table
          head={["Item", "Detail"]}
          rows={[
            ["How to earn", "Daily check-in, login reward, watching ads"],
            ["What they are for", "Sending notes"],
            ["Exchange for cash", "Not possible"],
            [
              "Expiry",
              "Remaining points are lost when you delete your account",
            ],
          ]}
        />
        <p>
          Points can only be used within the Service and cannot be exchanged for
          cash or anything else of value.
        </p>
      </Section>

      <Section title="8. Restrictions on use">
        <p>
          When these terms are broken, we apply restrictions in stages as
          follows. Where the matter is serious, we may move straight to
          permanent suspension.
        </p>
        <ul>
          <li>Hiding or deleting content</li>
          <li>Suspension for a set period</li>
          <li>Permanent suspension</li>
        </ul>
        <p>
          If you disagree with the reason for a restriction, you can contact us
          at the address below.
        </p>
      </Section>

      <Section title="9. Deleting your account">
        <p>
          You can delete your account at any time from the app settings. Once
          you do, your conversations, feed posts, likes, and points stop being
          visible to the other person and to other users, and this cannot be
          undone. To prevent misuse, we keep the deleted account&rsquo;s
          information and conversations for 90 days and then erase them
          completely.
        </p>
      </Section>

      <Section title="10. Limits of responsibility">
        <ul>
          <li>
            We are not responsible for what happens in conversations between
            users, or when they meet.
          </li>
          <li>
            We do not guarantee the accuracy of the information users post.
            Please use your own judgment before meeting anyone.
          </li>
          <li>
            We are not responsible where we cannot provide the Service for
            reasons beyond our control, such as natural disasters or network
            failures.
          </li>
        </ul>
      </Section>

      <Section title="11. Changes to these terms">
        <p>
          When we change these terms, we announce it in the Service from 7 days
          before the effective date. Changes that disadvantage users are
          announced 30 days in advance, and if you do not agree to the change,
          you may delete your account.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          If you have any questions about using the Service, please get in
          touch.
        </p>
        <p>
          <a href="mailto:hello@jipkok.app" className="font-medium">
            hello@jipkok.app
          </a>
        </p>
      </Section>
    </LegalPage>
  );
}
