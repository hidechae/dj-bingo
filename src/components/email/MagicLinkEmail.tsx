import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface MagicLinkEmailProps {
  url: string;
  host: string;
}

export function MagicLinkEmail({ url, host }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>DJ Bingoにログイン</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>DJ Bingoにログイン</Heading>
          <Text style={text}>
            以下のボタンをクリックして、DJ Bingoにログインしてください。
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={url}>
              ログインする
            </Button>
          </Section>
          <Text style={text}>このリンクは10分間有効です。</Text>
          <Text style={text}>
            ボタンが機能しない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：
          </Text>
          <Link href={url} style={link}>
            {url}
          </Link>
          <Hr style={hr} />
          <Text style={footer}>
            このメールに心当たりがない場合は、無視していただいて構いません。
            <br />
            このリンクは{host}からのログインリクエストに応じて送信されました。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
};

const buttonContainer = {
  margin: "27px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const link = {
  color: "#2563eb",
  fontSize: "14px",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "42px 0 26px",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "24px",
};
