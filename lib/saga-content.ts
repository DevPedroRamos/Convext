/**
 * Copy da home da Saga, num só lugar.
 *
 * Origem: referência em docs/proposals/lp-saga/referencia-lp-saga.md.
 * Títulos e números vêm da referência. Trechos marcados com "REESCRITO" eram
 * ilegíveis na imagem e foram escritos no mesmo tom — revisar com o time.
 */

export type PieceKind = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";

export const sagaNav = [
  { href: "/#metodo", label: "Método Saga" },
  { href: "/#solucoes", label: "Soluções" },
  { href: "/#cases", label: "Cases" },
  { href: "/#quem-somos", label: "Quem somos" },
  { href: "/login", label: "Saga OS" },
];

export const hero = {
  eyebrow: "Assessoria e consultoria de marketing e comercial para o mercado imobiliário",
  lines: ["Sua marca vista.", "Lembrada.", "Escolhida."],
  accent: "E vendendo.",
  lead: "Toda grande marca tem uma história. A nossa é acelerar a sua.",
  // REESCRITO (final da frase ilegível)
  body: "A Saga conecta marca, conteúdo, mídia e operação comercial numa única estratégia — do primeiro contato com o comprador à venda assinada.",
  proof: [
    { value: "800 mil+", label: "leads gerados" },
    { value: "R$ 5 bi+", label: "em VGV" },
    { value: "6+ anos", label: "de consultoria" },
  ],
};

export const competencies = ["Posicionamento", "Conteúdo", "Tráfego", "CRM", "Atendimento", "Vendas"];

export const numbers = {
  eyebrow: "A Saga em números",
  title: "Experiência que se mede.",
  // REESCRITO
  body: "Números de operações reais do mercado imobiliário — lançamentos, estoque e revenda — em São Paulo e no Rio de Janeiro.",
  items: [
    { value: 6, prefix: "", suffix: "+", label: "anos de experiência" },
    { value: 800, prefix: "", suffix: " mil+", label: "leads gerados" },
    { value: 50, prefix: "R$ ", suffix: " mi+", label: "investidos em mídia" },
    { value: 5, prefix: "R$ ", suffix: " bi+", label: "em VGV impactado" },
    { value: 15, prefix: "", suffix: "+", label: "especialistas no time" },
  ],
};

export const problem = {
  eyebrow: "O problema não é falta de marketing",
  title: ["Marketing sozinho", "não ganha"],
  accent: "o jogo.",
  body: "Campanhas podem gerar volume, mas negócios precisam de um sistema. Quando posicionamento, conteúdo, performance e comercial jogam separados, cada um vence a própria partida — e a empresa perde a dela.",
  // REESCRITO (descrições)
  pillars: [
    { title: "Posicionamento", body: "Como a marca quer ser percebida — e por quem." },
    { title: "Conteúdo", body: "O que ela diz, com que frequência e em que tom." },
    { title: "Performance", body: "Mídia medida pelo custo da oportunidade, não do clique." },
    { title: "Comercial", body: "CRM, atendimento e o time que transforma interesse em contrato." },
  ],
};

export const method = {
  eyebrow: "O Método Saga",
  title: ["O mercado é o tabuleiro."],
  accent: "A Saga é a estratégia.",
  body: "Cada peça representa uma competência. Juntas, elas transformam marketing e vendas em vantagem competitiva.",
  subEyebrow: "O tabuleiro em movimento",
  subTitle: "Uma decisão muda",
  subAccent: "todo o jogo.",
  // REESCRITO — cada etapa corresponde a um lance no tabuleiro
  steps: [
    { notation: "1. e4 e5", title: "Diagnóstico", body: "Lemos o tabuleiro antes de mexer qualquer peça: marca, funil, mídia, CRM e a conversa do comercial com o comprador." },
    { notation: "2. Cf3 Cc6", title: "Estratégia", body: "Definimos a jogada: onde investir, com que mensagem, para qual público e com quais metas de oportunidade — não de clique." },
    { notation: "3. Bc4 Bc5", title: "Execução integrada", body: "Conteúdo, mídia, atendimento e vendas entram em campo juntos, com o mesmo plano e os mesmos indicadores." },
    { notation: "4. O-O", title: "Ajuste contínuo", body: "Cada semana é um lance novo. Leitura de dados, feedback do comercial e realocação de verba onde a venda acontece." },
  ],
};

export const pieces = {
  eyebrow: "Cada peça é uma estratégia",
  title: "Cinco peças.",
  accent: "Uma visão completa.",
  body: "Escolha uma peça para abrir a explicação. Cada solução funciona sozinha — e rende mais quando joga com as outras.",
  // Categorias aproximadas da referência; descrições REESCRITAS
  items: [
    {
      kind: "king" as PieceKind,
      name: "O Movimento",
      category: "Gestão completa de marketing e comercial",
      body: "A Saga assume o tabuleiro inteiro: planejamento, marca, conteúdo, mídia, CRM e rotina com o time de vendas, sob uma única liderança estratégica.",
      deliverables: ["Planejamento trimestral", "Squad dedicado", "Rituais com o comercial", "Saga OS"],
    },
    {
      kind: "queen" as PieceKind,
      name: "A Escala",
      category: "Mídia, dados e crescimento",
      body: "Para operações que já funcionam e precisam crescer sem perder eficiência: estrutura de mídia multicanal, testes contínuos e leitura de dados até a venda.",
      deliverables: ["Mídia multicanal", "Testes de criativo e oferta", "Atribuição até a venda"],
    },
    {
      kind: "rook" as PieceKind,
      name: "A Conquista",
      category: "Tecnologia comercial, CRM e atendimento",
      body: "A base que segura o resultado: CRM configurado, cadência de atendimento, automações e indicadores para o gestor comercial enxergar cada oportunidade.",
      deliverables: ["Implantação de CRM", "Cadências e scripts", "Painel do gestor"],
    },
    {
      kind: "knight" as PieceKind,
      name: "A Jornada",
      category: "Tráfego pago e geração de demanda",
      body: "Campanhas pensadas pelo caminho do comprador, do primeiro anúncio à visita ao decorado — otimizadas pela qualidade da oportunidade, não pelo custo do lead.",
      deliverables: ["Meta e Google Ads", "Criativos de performance", "Otimização por oportunidade"],
    },
    {
      kind: "pawn" as PieceKind,
      name: "A Origem",
      category: "Posicionamento, conteúdo e identidade",
      body: "Onde toda partida começa: o que a marca é, como fala e por que o comprador deveria escolhê-la. Território, narrativa e conteúdo que sustentam a mídia.",
      deliverables: ["Posicionamento", "Identidade e narrativa", "Linha editorial"],
    },
  ],
};

export const audience = {
  eyebrow: "Para quem",
  title: "Quem joga",
  accent: "com a Saga.",
  // REESCRITO (descrições)
  items: [
    { title: "Incorporadoras e construtoras", body: "Lançamentos e estoque que precisam de demanda qualificada antes, durante e depois do stand." },
    { title: "Imobiliárias", body: "Times de venda e locação que querem previsibilidade de oportunidades e um CRM que funcione." },
    { title: "Empresas do ecossistema", body: "Crédito, decoração, proptechs e serviços que vendem para quem compra ou constrói." },
  ],
};

export const sagaOs = {
  eyebrow: "Saga OS / Portal do cliente",
  title: "Você acompanha",
  accent: "cada resultado.",
  // REESCRITO
  body: "O Saga OS é o portal onde o cliente acompanha tudo o que a Saga faz: campanhas, entregas, reuniões e resultados, com os mesmos números que o nosso time usa para decidir.",
  bullets: ["Resultados das campanhas em tempo real", "Entregas, aprovações e agenda num só lugar", "Histórico de cada decisão estratégica"],
};

export const cases = {
  eyebrow: "Cases de sucesso",
  title: "O resultado é a consequência.",
  accent: "A jogada é o diferencial.",
  // REESCRITO
  body: "Três operações, três desafios diferentes. Em todas, o resultado veio de mudar a jogada — não só o anúncio.",
  // Números da referência; os rótulos eram ilegíveis — CONFIRMAR com o time antes de publicar.
  items: [
    { name: "Econ Construtora", tag: "Lançamentos em escala", metrics: [{ value: "400 mil+", label: "leads gerados" }, { value: "R$ 1 bi+", label: "em VGV" }] },
    { name: "Metrocasa", tag: "Performance de expansão", metrics: [{ value: "300 mil+", label: "leads gerados" }, { value: "R$ 1 bi+", label: "em VGV" }] },
    { name: "HabCasa", tag: "Geração regional", metrics: [{ value: "70+", label: "empreendimentos" }, { value: "R$ 50 mi+", label: "em VGV" }] },
  ],
};

export const team = {
  eyebrow: "Quem somos",
  quote: "Estratégia é importante.",
  quoteAccent: "Pessoas fazem acontecer.",
  title: "Experiência real.",
  accent: "Visão compartilhada.",
  // REESCRITO
  body: "A Saga nasceu de quem viveu o mercado imobiliário dos dois lados da mesa — no marketing e no stand de vendas. Por isso trabalhamos como sócios da operação: perto do comercial, com metas que são de negócio.",
};

export const diagnostic = {
  eyebrow: "Sua próxima jogada",
  title: ["Seu crescimento", "merece"],
  accent: "uma estratégia.",
  // REESCRITO
  body: "Conte sobre a sua operação. Vamos analisar o cenário e entender quais peças podem destravar o seu próximo ciclo de crescimento.",
  checks: ["Contato direcionado ao seu desafio", "Avaliação de prioridades, canais e indicadores", "Sem promessa de resultado sem diagnóstico"],
  challenges: [
    "Gerar mais oportunidades qualificadas",
    "Lançar um empreendimento",
    "Organizar CRM e atendimento",
    "Fortalecer marca e posicionamento",
    "Integrar marketing e comercial",
    "Outro",
  ],
  budgets: ["Até R$ 10 mil", "R$ 10 mil a R$ 30 mil", "R$ 30 mil a R$ 100 mil", "Acima de R$ 100 mil", "Prefiro não informar"],
};

export const footer = {
  // REESCRITO
  about: "Estratégia, performance, conteúdo e tecnologia comercial para quem constrói, incorpora e vende imóveis.",
  next: "Uma conversa objetiva sobre o seu negócio e o que dá para destravar no próximo trimestre.",
};

// Frase-manifesto (base: "gerar lead é fácil…", da home anterior da Convext).
// Palavras com `pill` ganham uma etiqueta de lance de xadrez quando acendem.
const manifestoText =
  "Gerar lead é fácil. Gerar lead que pode virar venda é o que importa. Por isso colocamos marca, conteúdo, mídia e comercial no mesmo tabuleiro — e jogamos cada lance pensando no próximo.";
const manifestoPills: Record<string, string> = { "venda": "1. e4", "tabuleiro": "2. Cf3", "próximo.": "O-O" };

export const manifesto = {
  eyebrow: "Manifesto",
  words: manifestoText.split(" ").map((text) => ({ text, pill: manifestoPills[text] })),
};

export const faq = {
  eyebrow: "Perguntas frequentes",
  title: "Antes do",
  accent: "primeiro lance.",
  // Respostas derivadas da própria copy do site — revisar com o time.
  items: [
    { q: "Vocês atendem só o mercado imobiliário?", a: "Sim. Toda a operação — estratégia, mídia, conteúdo e comercial — é pensada para incorporadoras, construtoras, imobiliárias e empresas do ecossistema imobiliário." },
    { q: "Onde vocês atuam?", a: "Temos presença consolidada em São Paulo e no Rio de Janeiro, e atendemos operações em outras praças a partir daqui." },
    { q: "Preciso contratar as cinco soluções?", a: "Não. Cada peça funciona sozinha. O diagnóstico mostra quais delas destravam o seu próximo ciclo — e em que ordem vale jogar." },
    { q: "Como funciona o diagnóstico?", a: "Você conta sobre a operação no formulário, um especialista retorna em até 1 dia útil e analisamos marca, funil, mídia, CRM e o retorno do comercial antes de propor qualquer jogada." },
    { q: "Como acompanho os resultados?", a: "Pelo Saga OS, o portal do cliente: campanhas, entregas, agenda e resultados com os mesmos números que o nosso time usa para decidir." },
    { q: "Vocês olham só para o custo por lead?", a: "Não. Decidimos pelo equilíbrio entre volume, custo e qualidade — e pelo retorno do time de vendas sobre cada oportunidade." },
  ],
};
