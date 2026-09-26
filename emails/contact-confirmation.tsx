import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export function ContactConfirmationEmail({ firstName }: { firstName: string }) {
  return (
    <Html>
      <Head />
      <Preview>Recebemos sua mensagem.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Recebemos sua mensagem.</Heading>
          <Text>Olá, {firstName}.</Text>
          <Text>Obrigado por falar com a Convext. Nosso time vai analisar seu contato e retornar em breve.</Text>
          <Text style={muted}>Estratégia, criatividade e tecnologia para marcas em movimento.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#0f0f0f", color: "#fcfcfc", fontFamily: "Arial, sans-serif" };
const container = { margin: "0 auto", padding: "32px", backgroundColor: "#151515", borderRadius: "20px" };
const heading = { color: "#f35703", fontSize: "32px" };
const muted = { color: "#898989" };
