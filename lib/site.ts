export const siteConfig = {
  name: "Convext",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
    { number: "01", title: "Branding", description: "Sistemas de marca com estratégia, voz e presença memorável." },
    { number: "02", title: "Social Media", description: "Conteúdo, rotina criativa e narrativa para marcas em movimento." },
    { number: "03", title: "Performance", description: "Campanhas, dados e otimização para crescimento sustentável." },
    { number: "04", title: "Web & Technology", description: "Sites, interfaces e experiências digitais rápidas e sofisticadas." },
    { number: "05", title: "Creative Strategy", description: "Ideias com direção, contexto e clareza para cada canal." },
    { number: "06", title: "Content", description: "Produção visual e textual para campanhas, lançamentos e comunidades." },
  ],
  projects: [
    { title: "Projeto 01", category: "Branding + Website", image: "/media/case-01.svg" },
    { title: "Projeto 02", category: "Growth + Performance", image: "/media/case-02.svg" },
    { title: "Projeto 03", category: "Social + Creative", image: "/media/case-03.svg" },
  ],
  metrics: [
    { value: 30, prefix: "+", label: "clientes" },
    { value: 50, prefix: "+", label: "imobiliárias" },
    { value: 1, prefix: "+R$ ", suffix: " bi", label: "em VGV impactado" },
    { value: 30, prefix: "+R$ ", suffix: " mi", label: "em tráfego pago" },
  ],
};
