import { Button, Text } from "@react-email/components";

import { EmailLayout } from "./layout.tsx";

export function VerifyEmail({ appName, url }: { appName: string; url: string }) {
  return (
    <EmailLayout appName={appName} preview="Potwierdź adres e-mail">
      <Text style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 12px" }}>
        Potwierdź adres e-mail
      </Text>
      <Text style={{ fontSize: "14px", color: "#475467", margin: "0 0 24px" }}>
        Aby dokończyć zakładanie konta, potwierdź swój adres e-mail.
      </Text>
      <Button
        href={url}
        style={{
          backgroundColor: "#101828",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "10px 16px",
          fontSize: "14px",
        }}
      >
        Potwierdź adres
      </Button>
      <Text style={{ fontSize: "12px", color: "#667085", marginTop: "24px" }}>
        Link jest jednorazowy i wygasa po godzinie.
      </Text>
    </EmailLayout>
  );
}
