import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export function InviteEmail({ firstName, inviteUrl }: { firstName: string; inviteUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Você foi convidado para a Convext.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Convite para a Convext</Heading>
          <Text>Olá, {firstName}.</Text>
          <Text>Você foi convidado para acessar a área da Convext. Confirme seus dados e crie sua senha para entrar.</Text>
          <Button href={inviteUrl} style={button}>
            Confirmar acesso
          </Button>
          <Text style={muted}>Se você não esperava este convite, ignore este e-mail.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#0f0f0f", color: "#fcfcfc", fontFamily: "Arial, sans-serif" };
const container = { margin: "0 auto", padding: "32px", backgroundColor: "#151515", borderRadius: "20px" };
const heading = { color: "#f35703", fontSize: "32px" };
const muted = { color: "#898989" };
const button = {
  backgroundColor: "#f35703",
  color: "#ffffff",
  borderRadius: "12px",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 20px",
  textDecoration: "none",
};
