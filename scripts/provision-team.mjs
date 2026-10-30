import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEDRO_ID = "78c8d7bf-847c-46aa-8960-1182f2de13ab";
const COMPANY = "Convext Mídias";

const members = [
  { email: "fduran1901@gmail.com", firstName: "Francisco", lastName: "", role: "admin", cargo: "HEAD OPERAÇÃO" },
  { email: "marcusderaldo@gmail.com", firstName: "Marcus", lastName: "", role: "admin", cargo: "HEAD TRAFEGO" },
  { email: "teuvdl123@gmail.com", firstName: "Matheus", lastName: "", role: "traffic", cargo: "GESTOR DE TRAFEGO" },
  { email: "amandabg1617@gmail.com", firstName: "Amanda", lastName: "", role: "traffic", cargo: "GESTOR DE TRAFEGO" },
  { email: "monteiroduda767@gmail.com", firstName: "Duda", lastName: "", role: "traffic", cargo: "GESTOR DE TRAFEGO JUNIOR" },
  { email: "lemesluana066@gmail.com", firstName: "Luana", lastName: "", role: "coordinator", cargo: "SUCESSO DO CLIENTE" },
  { email: "gneiva400@gmail.com", firstName: "Gabriel", lastName: "", role: "creator", cargo: "GERENTE DE CRIAÇÃO" },
  { email: "pratesduda2004@gmail.com", firstName: "Maria", lastName: "Eduarda", role: "creator", cargo: "DESIGNER" },
  { email: "esterbramos17@gmail.com", firstName: "Ester", lastName: "", role: "creator", cargo: "EDITORA DE VIDEO" },
];

if (!url || !serviceKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserIdByEmail(email) {
  const target = email.toLowerCase();
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < 200) return null;
    page += 1;
  }
  return null;
}

async function upsertMember(member) {
  let userId = await findUserIdByEmail(member.email);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: member.email,
      password: member.email,
      email_confirm: true,
      user_metadata: { first_name: member.firstName, last_name: member.lastName || "" },
    });
    if (error || !data.user) throw error || new Error(`Falha ao criar ${member.email}`);
    userId = data.user.id;
    console.log(`created ${member.email}`);
  } else {
    console.log(`exists ${member.email}`);
  }

  const { error } = await admin.from("profiles").update({
    first_name: member.firstName,
    last_name: member.lastName || null,
    email: member.email,
    role: member.role,
    cargo: member.cargo,
    company: COMPANY,
    onboarding_completed: false,
  }).eq("id", userId);
  if (error) throw error;
}

const { error: pedroAuthError } = await admin.auth.admin.updateUserById(PEDRO_ID, {
  email: "pedroramosnext@gmail.com",
  email_confirm: true,
});
if (pedroAuthError) throw pedroAuthError;

const { error: pedroProfileError } = await admin.from("profiles").update({
  email: "pedroramosnext@gmail.com",
  first_name: "Pedro",
  last_name: "Ramos",
  role: "admin",
  cargo: "TECH LEAD",
  company: COMPANY,
  onboarding_completed: true,
}).eq("id", PEDRO_ID);
if (pedroProfileError) throw pedroProfileError;
console.log("updated Pedro Ramos");

for (const member of members) {
  await upsertMember(member);
}

console.log("done");
