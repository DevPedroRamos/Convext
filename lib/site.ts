export const siteConfig = {
  name: "Convext",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8080",
  description: "Performance para o mercado imobiliário. Mais leads qualificados e mais oportunidades para vender.",
  contact: {
    email: "contato@convext.com.br",
    phone: "+55 (11) 0000-0000",
    instagram: "https://instagram.com/convext",
    linkedin: "https://linkedin.com/company/convext",
    behance: "https://behance.net/convext",
  },
  nav: [
    { href: "/#servicos", label: "Serviços" },
    { href: "/#cases", label: "Cases" },
    { href: "/#sobre", label: "Sobre" },
    { href: "/contato", label: "Contato" },
  ],
  services: [
    { number: "01", title: "Estratégia dedicada ao Mercado Imobiliário", description: "Entendemos o empreendimento, região, público, produto, condições comerciais e objetivo da operação antes de colocar verba na mídia. A campanha começa antes do anúncio." },
    { number: "02", title: "Gestão de Mídia Paga", description: "Estruturamos e otimizamos campanhas para encontrar pessoas com maior potencial de compra. Acompanhamos a performance continuamente e redistribuímos o investimento onde há mais resultado comercial." },
    { number: "03", title: "Criativos de Alta Performance", description: "Desenvolvemos e testamos diferentes ângulos, ofertas, formatos e mensagens para mostrar por que o seu empreendimento merece a atenção do comprador." },
    { number: "04", title: "Análise e Otimização Contínua", description: "Analisamos dados constantemente para identificar gargalos (seja região, público, oferta ou criativo) e testar novas possibilidades de otimização de oportunidades." },
    { number: "05", title: "Conexão Mídia + Comercial", description: "Usamos o feedback do seu time de vendas para calibrar a inteligência das campanhas. Mídia e comercial alinhados garantem que você pare de investir dinheiro em leads sem perfil." },
  ],
  projects: [
    { title: "Projeto 01", category: "Branding + Website", image: "/media/case-01.svg" },
    { title: "Projeto 02", category: "Growth + Performance", image: "/media/case-02.svg" },
    { title: "Projeto 03", category: "Social + Creative", image: "/media/case-03.svg" },
  ],
  metrics: [
    { value: 1, prefix: "+R$ ", suffix: " bi", label: "em VGV impactado" },
    { value: 30, prefix: "+R$ ", suffix: " mi", label: "investidos em tráfego pago" },
    { value: 30, prefix: "+", label: "clientes atendidos" },
    { value: 50, prefix: "+", label: "imobiliárias impactadas" },
  ],
};
