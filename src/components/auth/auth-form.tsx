"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2, MessageCircle, Mail, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requestOtp, verifyOtp } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/state";
import type { Channel } from "@/lib/auth/schemas";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, getCountry } from "@/lib/phone";

import { GoogleButton } from "@/components/auth/google-button";

type Props = { mode: "login" | "register"; next?: string };

export function AuthForm({ mode, next }: Props) {
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [requestState, requestAction, requestPending] = useActionState(
    requestOtp,
    initialAuthState,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyOtp, initialAuthState);

  // L'étape affichée vient entièrement de la réponse du serveur : les valeurs
  // saisies vivent en état local, l'étape non.
  const onCodeStep = requestState.step === "code";
  const country = getCountry(countryCode);

  if (onCodeStep) {
    return (
      <div className="flex flex-col gap-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {requestState.channel === "whatsapp"
              ? "Nous avons envoyé un code à 6 chiffres sur WhatsApp au"
              : "Nous avons envoyé un code à 6 chiffres à"}
          </p>
          <p className="font-medium">{requestState.label}</p>
        </div>

        <form action={verifyAction} className="flex flex-col gap-5">
          <input type="hidden" name="channel" value={requestState.channel} />
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <input type="hidden" name="identifier" value={requestState.identifier ?? ""} />
          <input type="hidden" name="label" value={requestState.label ?? ""} />
          <input type="hidden" name="countryCode" value={countryCode} />
          <input type="hidden" name="name" value={name} />

          <Field>
            <FieldLabel htmlFor="token">Code de vérification</FieldLabel>
            <InputOTP
              id="token"
              name="token"
              maxLength={6}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              containerClassName="justify-between sm:justify-start sm:gap-2"
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="size-12 rounded-lg border text-lg"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <FieldError>{verifyState.errors?.token}</FieldError>
          </Field>

          {verifyState.message ? (
            <p role="alert" className="text-sm text-destructive">
              {verifyState.message}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="h-11 w-full" disabled={verifyPending}>
            {verifyPending ? <Loader2 className="animate-spin" /> : null}
            Valider le code
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <form action={requestAction}>
            <input type="hidden" name="intent" value="back" />
            <input type="hidden" name="channel" value={requestState.channel} />
            <Button type="submit" variant="ghost" size="sm" disabled={requestPending}>
              <ArrowLeft />
              Modifier
            </Button>
          </form>

          <form action={requestAction}>
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="channel" value={requestState.channel} />
            <input type="hidden" name="countryCode" value={countryCode} />
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="email" value={email} />
            <Button type="submit" variant="link" size="sm" disabled={requestPending}>
              {requestPending ? <Loader2 className="animate-spin" /> : null}
              Renvoyer un code
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={channel} onValueChange={(value) => setChannel(value as Channel)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="whatsapp">
            <MessageCircle />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail />
            Email
          </TabsTrigger>
        </TabsList>

        <form action={requestAction} className="mt-5">
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="channel" value={channel} />

          <FieldGroup className="gap-4">
            {mode === "register" ? (
              <Field>
                <FieldLabel htmlFor="name">Votre nom</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  className="h-11"
                  autoComplete="name"
                  placeholder="Aissatou Diallo"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={Boolean(requestState.errors?.name)}
                />
                <FieldError>{requestState.errors?.name}</FieldError>
              </Field>
            ) : null}

            <TabsContent value="whatsapp" className="m-0">
              <Field>
                <FieldLabel htmlFor="phone">Numéro WhatsApp</FieldLabel>
                <div className="flex gap-2">
                  <Select
                    name="countryCode"
                    value={countryCode}
                    onValueChange={setCountryCode}
                  >
                    <SelectTrigger className="h-11 w-[7.5rem]" aria-label="Pays">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          +{item.dial} {item.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    className="h-11 flex-1"
                    placeholder={country.example}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    aria-invalid={Boolean(requestState.errors?.phone)}
                  />
                </div>
                <FieldError>{requestState.errors?.phone}</FieldError>
              </Field>
            </TabsContent>

            <TabsContent value="email" className="m-0">
              <Field>
                <FieldLabel htmlFor="email">Adresse email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="h-11"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(requestState.errors?.email)}
                />
                <FieldError>{requestState.errors?.email}</FieldError>
              </Field>
            </TabsContent>

            {requestState.message ? (
              <p role="alert" className="text-sm text-destructive">
                {requestState.message}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="h-11 w-full" disabled={requestPending}>
              {requestPending ? <Loader2 className="animate-spin" /> : null}
              Recevoir mon code
            </Button>
          </FieldGroup>
        </form>
      </Tabs>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton next={next} />

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Créer une boutique
            </Link>
          </>
        ) : (
          <>
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
