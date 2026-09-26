import { SettingsForm } from "@/components/forms/settings-form";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <div><p className="label text-primary">Configurações</p><h2 className="mt-2 font-display text-h2">Conta e segurança.</h2></div>
      <SettingsForm />
    </div>
  );
}
