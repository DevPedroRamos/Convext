import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ContactFormValues } from "@/lib/validations/contact";

export function ContactNotificationEmail({ contact }: { contact: ContactFormValues }) {
  return (
    <Html>
      <Head />
      <Preview>Novo contato pelo site — Convext</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Novo contato pelo site</Heading>
          <Text style={muted}>Tipo: {contact.inquiryType}</Text>
          <Hr style={hr} />
          <Section>
            <Text><strong>Nome:</strong> {contact.firstName} {contact.lastName}</Text>
            <Text><strong>E-mail:</strong> {contact.email}</Text>
            <Text><strong>Telefone:</strong> {contact.phone || "Não informado"}</Text>
            <Text><strong>Empresa:</strong> {contact.company || "Não informada"}</Text>
            <Text><strong>Website / Instagram:</strong> {contact.website || "Não informado"}</Text>
            <Text><strong>Mensagem:</strong></Text>
            <Text>{contact.message}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#0f0f0f", color: "#fcfcfc", fontFamily: "Arial, sans-serif" };
const container = { margin: "0 auto", padding: "32px", backgroundColor: "#151515", borderRadius: "20px" };
const heading = { color: "#f35703", fontSize: "32px" };
const muted = { color: "#898989" };
const hr = { borderColor: "#292929" };
