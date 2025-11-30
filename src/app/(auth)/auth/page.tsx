"use client";
import Image from "next/legacy/image";
import AuthIcon from "@/assets/icons/auth.svg";
import Button from "@/components/Button";
import { Input, InputLabel } from "@/components/Input";
import { useCallback, useEffect, useState } from "react";
import { getUserSession } from "./actions";
import { useRouter, useSearchParams } from "next/navigation";
import InstallPWAPrompt from "@/components/InstallPWAPrompt";
export default function Page() {
  const goTo = useSearchParams().get("goto");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  function showError(error: string) {
    setError(error);
    setLoading(false);
    setTimeout(() => {
      setError("");
    }, 3000);
  }

  const trySignIn = useCallback(
    async (formData: FormData) => {
      const uid = formData.get("sysregister-username") as string;
      const pass = formData.get("sysregister-password") as string;
      setLoading(true);
      try {
        const error = await getUserSession({ uid, pass });
        localStorage.setItem("username", uid);
        if (error) {
          showError(error);
        } else {
          if (goTo) {
            router.push(goTo);
          } else {
            router.push("/");
          }
        }
      } catch {
        return;
      }
      setLoading(false);
    },
    [goTo, router]
  );

  useEffect(() => {
    async function doAutoAuth() {
      const form = new FormData();
      form.set(
        "sysregister-username",
        localStorage.getItem("username") as string
      );
      form.set(
        "sysregister-password",
        localStorage.getItem("password") as string
      );
      trySignIn(form);
    }
    if (localStorage.getItem("username") && localStorage.getItem("password")) {
      doAutoAuth();
    }
  }, [trySignIn]);

  return (
    <div className="flex flex-col items-center justify-center h-svh">
      <div className="flex items-center justify-center flex-col flex-1">
        <div className="relative overflow-hidden p-9 rounded-[55px] shadow mb-6">
          <div className="bg-secondary absolute opacity-45 -z-10 top-0 right-0 bottom-0 left-0" />
          <Image
            src={AuthIcon}
            width={100}
            height={100}
            alt="Authentication Icon"
          />
        </div>
        <div className="text-center mb-4">
          <p className="text-4xl font-bold text-accent">Autenticati</p>
          <p className="text-secondary text-sm">Inserisci le tue credenziali classeviva per fare l&apos;accesso</p>
        </div>
      </div>
      <div className="flex-1 flex w-full px-6 items-center flex-col justify-end">
        <div className="p-4 px-0 w-full">
          <InstallPWAPrompt /></div>
        <form
          className="w-full"
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await trySignIn(formData);
          }}
        >
          <div className="w-full">
            <InputLabel text={"Nome utente"} />
            <Input name="sysregister-username" placeholder="G123456789P" />
          </div>
          <div className="w-full mt-4">
            <InputLabel text={"Password"} />
            <Input
              name="sysregister-password"
              placeholder="••••••••••••••"
              type="password"
            />
          </div>
          <span className="text-accent text-left text-sm mt-1 w-full">
            {error.toString()}
          </span>
          <Button loading={loading} className="w-full mt-7">
            Accesso
          </Button>
          <p className="text-sm text-center text-secondary py-5 pb-8">
            Non hai queste credenziali?{" "}
            <a
              href="https://web.spaggiari.eu/home/app/default/login.php"
              target="_blank"
            >
              <u>recuperale</u>
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
