import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Neutral white-label email layout: white background, dark text, no logo,
 * no marketing footer, no brand colors.
 */
export function EmailLayout({
  appName,
  preview,
  children,
}: {
  appName: string;
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{ backgroundColor: "#ffffff", color: "#101828", fontFamily: "Arial, sans-serif" }}
      >
        <Container style={{ maxWidth: "560px", padding: "32px 24px" }}>
          <Text style={{ fontSize: "14px", color: "#475467", margin: "0 0 24px" }}>{appName}</Text>
          <Section>{children}</Section>
          <Text style={{ fontSize: "12px", color: "#667085", marginTop: "32px" }}>
            Jeśli to nie Ty wywołałeś tę operację, zignoruj tę wiadomość.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
