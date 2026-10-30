const ALLOWED_TAGS = new Set(["p", "h2", "h3", "strong", "em", "ul", "ol", "li", "blockquote", "a", "br"]);
const VOID_TAGS = new Set(["br"]);

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*58;/gi, ":")
    .replace(/&#x0*3a;/gi, ":")
    .replace(/&colon;/gi, ":");
}

function safeHref(value: string) {
  const href = decodeEntities(value).trim();
  if (!/^https?:\/\//i.test(href)) return null;
  return href;
}

function parseTag(raw: string) {
  const match = raw.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)\/?>$/);
  if (!match) return null;
  return {
    name: match[1].toLowerCase(),
    closing: raw.startsWith("</"),
    attrs: match[2] || "",
  };
}

function hrefFromAttrs(attrs: string) {
  const match = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!match) return null;
  return safeHref(match[1] ?? match[2] ?? match[3] ?? "");
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plainTextToHtml(value: string) {
  const blocks = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (!blocks.length) return "";
  return blocks.map((block) => `<p>${escapeText(block).replace(/\n/g, "<br>")}</p>`).join("");
}

export function sanitizeConceptHtml(html: string) {
  const withoutDanger = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");

  const stack: string[] = [];
  let result = "";
  const token = /(<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = token.exec(withoutDanger))) {
    result += withoutDanger.slice(last, match.index);
    last = match.index + match[0].length;
    const parsed = parseTag(match[0]);
    if (!parsed) continue;

    if (parsed.closing) {
      if (VOID_TAGS.has(parsed.name)) continue;
      const index = stack.lastIndexOf(parsed.name);
      if (index === -1) continue;
      while (stack.length > index) {
        const name = stack.pop();
        if (name) result += `</${name}>`;
      }
      continue;
    }

    if (!ALLOWED_TAGS.has(parsed.name)) continue;

    if (parsed.name === "a") {
      const href = hrefFromAttrs(parsed.attrs);
      if (!href) continue;
      stack.push("a");
      result += `<a href="${escapeAttr(href)}" rel="noopener noreferrer" target="_blank">`;
      continue;
    }

    if (VOID_TAGS.has(parsed.name)) {
      result += `<${parsed.name}>`;
      continue;
    }

    stack.push(parsed.name);
    result += `<${parsed.name}>`;
  }

  result += withoutDanger.slice(last);
  while (stack.length) {
    const name = stack.pop();
    if (name) result += `</${name}>`;
  }
  return result.trim();
}

function isEmptyHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/\s+/g, "").length === 0;
}

export function prepareConceptHtml(value?: string | null) {
  const raw = value?.trim() || "";
  if (!raw) return "";
  const html = looksLikeHtml(raw) ? raw : plainTextToHtml(raw);
  const sanitized = sanitizeConceptHtml(html);
  return isEmptyHtml(sanitized) ? "" : sanitized;
}

export function persistConcept(value?: string | null) {
  return prepareConceptHtml(value) || null;
}
