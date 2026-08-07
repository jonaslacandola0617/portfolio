import { LogOut } from "lucide-react";
import { signOut } from "@/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="label flex w-full items-center justify-center gap-2 border border-border px-3 py-2 text-text-dim transition-colors hover:border-border-strong hover:text-text"
      >
        <LogOut className="h-3 w-3" />
        Sign out
      </button>
    </form>
  );
}
