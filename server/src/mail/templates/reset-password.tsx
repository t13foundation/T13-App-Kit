import { Button, Text } from "@react-email/components";

import { EmailLayout } from "./layout.tsx";

export function ResetPassword({ appName, url }: { appName: string; url: string }) {
  return (
    <EmailLayout appName={appName} preview="Zmiana hasła">
      <Text style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 12px" }}>
        Ustaw nowe hasło
      </Text>
      <Text style={{ fontSize: "14px", color: "#475467", margin: "0 0 24px" }}>
        Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.
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
        Ustaw nowe hasło
      </Button>
      <Text style={{ fontSize: "12px", color: "#667085", marginTop: "24px" }}>
        Link jest jednorazowy i wygasa po godzinie. Hasła nie zmieniamy bez tego kroku.
      </Text>
    </EmailLayout>
  );
}
