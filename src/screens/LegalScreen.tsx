import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type PolicySectionProps = {
  children: ReactNode;
  title: string;
};

function PolicySection({ children, title }: PolicySectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function LegalScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel="Back to profile"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Profile</Text>
        </Pressable>

        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>Privacy & support</Text>
        <Text style={styles.subtitle}>
          How Fortomnia handles your information and account.
        </Text>

        <PolicySection title="Support">
          <Text style={styles.body}>
            Public support contact information will be added before release.
            Never send passwords, authentication codes, complete medical
            records, government identifiers, or payment-card information in a
            support request.
          </Text>
        </PolicySection>

        <PolicySection title="Privacy policy">
          <Text style={styles.updated}>Last updated September 1, 2026</Text>
          <Text style={styles.body}>
            Fortomnia provides tools for tracking fitness, nutrition,
            supplements, and related personal performance information. This
            policy summarizes what the current version collects and how that
            information is used.
          </Text>

          <Text style={styles.subheading}>Information collected</Text>
          <Text style={styles.body}>
            Fortomnia stores your account email and identifier, optional
            display name, preferred weight unit, workouts, exercises, sets,
            repetitions, weight, RIR, templates, nutrition entries and goals,
            supplement protocols and adherence, custom exercises, notes, and
            timestamps. Some of this information may be sensitive or
            health-related.
          </Text>

          <Text style={styles.subheading}>How information is used</Text>
          <Text style={styles.body}>
            Information is used to authenticate your account, provide and
            synchronize app features, display your history and summaries,
            maintain security, diagnose errors, and meet legal obligations.
            Fortomnia does not sell personal information, display third-party
            advertising, or use personal information for cross-app tracking.
          </Text>

          <Text style={styles.subheading}>Technical information</Text>
          <Text style={styles.body}>
            Fortomnia collects limited app and device versions, operating
            system, app lifecycle events, screen names, a pseudonymous account
            identifier, and error information. Workout, nutrition, supplement,
            recovery, note, email, and password values are not sent to the
            analytics provider.
          </Text>

          <Text style={styles.subheading}>Service providers</Text>
          <Text style={styles.body}>
            Supabase provides authentication, database hosting, and backend
            functions. Expo and its infrastructure providers may support app
            build, delivery, and technical operations. PostHog provides
            privacy-limited product analytics and error monitoring; session
            replay, touch capture, precise location collection, and advertising
            tracking are disabled. Providers may process information only as
            needed to deliver their services and are expected to protect it
            appropriately.
          </Text>

          <Text style={styles.subheading}>Retention and deletion</Text>
          <Text style={styles.body}>
            Records are retained while your account is active or as needed to
            provide Fortomnia. You can permanently delete your account from
            Profile. Limited information may be retained when legally required,
            and encrypted backup copies may remain temporarily until overwritten
            through normal backup processes.
          </Text>

          <Text style={styles.subheading}>Security and choices</Text>
          <Text style={styles.body}>
            Fortomnia uses reasonable safeguards, but no storage or transmission
            method is completely secure. Depending on where you live, you may
            have rights to access, correct, obtain, restrict, or delete personal
            information. Identity verification may be required for a request.
          </Text>

          <Text style={styles.subheading}>Children</Text>
          <Text style={styles.body}>
            Fortomnia is not directed to children under 13 and does not
            knowingly collect their personal information. Higher minimum ages
            may apply in some locations.
          </Text>
        </PolicySection>

        <PolicySection title="Account deletion">
          <Text style={styles.body}>
            To delete your account, return to Profile, select Delete account,
            review the warning, and confirm. Successful deletion signs you out
            and permanently removes the authentication account and associated
            profile, workouts, templates, nutrition records, supplement
            records, and custom exercises. This cannot be undone.
          </Text>
        </PolicySection>

        <PolicySection title="Terms of use">
          <Text style={styles.updated}>Last updated August 9, 2026</Text>
          <Text style={styles.subheading}>Recordkeeping, not medical advice</Text>
          <Text style={styles.body}>
            Fortomnia is a recordkeeping and informational tool, not a
            healthcare provider. It does not provide diagnoses, treatment,
            prescriptions, or emergency services. User-entered information
            about supplements, peptides, hormones, medications, or other
            substances is not an endorsement or recommendation.
          </Text>

          <Text style={styles.body}>
            Consult qualified healthcare professionals before making decisions
            that may affect your health. Contact local emergency services if you
            believe you are experiencing an emergency.
          </Text>

          <Text style={styles.subheading}>Your account and information</Text>
          <Text style={styles.body}>
            You are responsible for accurate account information, protecting
            your credentials, and activity through your account. You retain
            ownership of information you enter and permit Fortomnia to host,
            process, transmit, and display it as necessary to operate and secure
            the service.
          </Text>

          <Text style={styles.subheading}>Acceptable use</Text>
          <Text style={styles.body}>
            You may not use Fortomnia to violate law, interfere with the
            service, gain unauthorized access, distribute malicious code, or
            infringe another person's rights.
          </Text>

          <Text style={styles.subheading}>Availability and disclaimers</Text>
          <Text style={styles.body}>
            Features may change over time. To the maximum extent permitted by
            law, Fortomnia is provided as is and as available without guarantees
            of uninterrupted or error-free operation. Some jurisdictions do not
            permit certain warranty exclusions or liability limitations.
          </Text>
        </PolicySection>

        <Text style={styles.releaseNotice}>
          Support contact details and final legally reviewed policies will be
          added before public release.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  content: {
    paddingBottom: 48,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  navigation: {
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  navigationText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "700",
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 10,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
  },
  updated: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  subheading: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 14,
  },
  body: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  releaseNotice: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
