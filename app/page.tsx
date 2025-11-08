import { redirect } from "next/navigation";

export default function RootPage() {
  // Редирект на дашборд (в будущем здесь будет проверка авторизации)
  redirect("/dashboard");
}
