"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { uploadImage } from "@/lib/storage";
import { toE164 } from "@/lib/phone";
import { getMyShop, getProduct, requireShop } from "@/lib/shop/queries";
import { productSlug } from "@/lib/tenant";
import {
  appearanceSchema,
  fieldErrors,
  orderStatusSchema,
  productSchema,
  shopIdentitySchema,
  whatsappSchema,
} from "@/lib/shop/schemas";
import type { FormState } from "@/lib/shop/state";
import type { Database } from "@/lib/supabase/types";

// Écritures du vendeur. Toutes passent par le client de l'utilisateur connecté :
// la RLS refuse une écriture sur une boutique qui n'est pas la sienne, même si
// un identifiant était falsifié dans le formulaire.

const MAX_IMAGES = 4;

/** Code Postgres d'une violation de contrainte d'unicité. */
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === UNIQUE_VIOLATION;
}

// ============================================================
// Onboarding — étape 2 : identité de la boutique
// ============================================================

export async function saveShopIdentity(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = shopIdentitySchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    category: (formData.get("category") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    countryCode: (formData.get("countryCode") as string) || undefined,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const session = await verifySession();
  const supabase = await createClient();
  const existing = await getMyShop();

  const values = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    category: parsed.data.category ?? null,
    description: parsed.data.description ?? null,
    country_code: parsed.data.countryCode,
  };

  if (existing) {
    const { error } = await supabase
      .from("shops")
      .update({ ...values, onboarding_step: Math.max(existing.onboarding_step, 3) })
      .eq("id", existing.id);

    if (error) {
      return isUniqueViolation(error)
        ? { errors: { slug: "Cette adresse est déjà prise." } }
        : { message: "Enregistrement impossible. Réessayez." };
    }
  } else {
    const { error } = await supabase
      .from("shops")
      .insert({ ...values, user_id: session.userId, onboarding_step: 3 });

    if (error) {
      return isUniqueViolation(error)
        ? { errors: { slug: "Cette adresse est déjà prise." } }
        : { message: "Création impossible. Réessayez." };
    }
  }

  revalidatePath("/onboarding", "layout");
  redirect("/onboarding/apparence");
}

// ============================================================
// Onboarding — étape 3 : logo et couleur
// ============================================================

export async function saveAppearance(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = appearanceSchema.safeParse({
    primaryColor: (formData.get("primaryColor") as string) || undefined,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const session = await verifySession();
  const shop = await requireShop();
  const supabase = await createClient();

  const patch: { primary_color: string; logo_url?: string; onboarding_step: number } = {
    primary_color: parsed.data.primaryColor,
    onboarding_step: Math.max(shop.onboarding_step, 4),
  };

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const upload = await uploadImage(logo, {
      userId: session.userId,
      shopId: shop.id,
      folder: "logo",
    });
    if (!upload.ok) return { errors: { logo: upload.reason } };
    patch.logo_url = upload.url;
  }

  const { error } = await supabase.from("shops").update(patch).eq("id", shop.id);
  if (error) return { message: "Enregistrement impossible. Réessayez." };

  revalidatePath("/onboarding", "layout");
  redirect("/onboarding/produits");
}

// ============================================================
// Produits
// ============================================================

async function uploadProductImages(
  files: File[],
  params: {
    userId: string;
    shopId: string;
    productId: string;
    productName: string;
    startPosition: number;
  },
): Promise<string | null> {
  const supabase = await createClient();
  let position = params.startPosition;

  for (const file of files.slice(0, MAX_IMAGES)) {
    if (!(file instanceof File) || file.size === 0) continue;

    const upload = await uploadImage(file, {
      userId: params.userId,
      shopId: params.shopId,
      folder: "produits",
    });
    if (!upload.ok) return upload.reason;

    await supabase.from("product_images").insert({
      product_id: params.productId,
      url: upload.url,
      // Alternative textuelle renseignée dès l'insertion : l'audit du legacy
      // relevait des images sans alt un peu partout. Le nom du produit est un
      // défaut correct, que le vendeur pourra affiner plus tard.
      alt_text: params.productName,
      position,
    });
    position += 1;
  }

  return null;
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = productSchema.safeParse({
    name: formData.get("name") ?? "",
    price: formData.get("price") ?? "",
    promoPrice: (formData.get("promoPrice") as string) ?? "",
    quantity: (formData.get("quantity") as string) ?? "",
    description: (formData.get("description") as string) || undefined,
    sizes: (formData.get("sizes") as string) || undefined,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const session = await verifySession();
  const shop = await requireShop();
  const supabase = await createClient();

  // L'identifiant est tiré ici plutôt que par la base : il entre dans le slug,
  // qu'on veut poser dès l'insertion.
  const productId = crypto.randomUUID();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      id: productId,
      shop_id: shop.id,
      name: parsed.data.name,
      slug: productSlug(parsed.data.name, productId),
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      promo_price: parsed.data.promoPrice,
      quantity: parsed.data.quantity,
      sizes: parsed.data.sizes,
    })
    .select("id")
    .single();

  if (error || !product) return { message: "Création du produit impossible. Réessayez." };

  const images = formData.getAll("images").filter((item): item is File => item instanceof File);
  const uploadError = await uploadProductImages(images, {
    userId: session.userId,
    shopId: shop.id,
    productId: product.id,
    productName: parsed.data.name,
    startPosition: 0,
  });

  revalidatePath("/dashboard/produits");
  revalidatePath("/onboarding/produits");

  // Le produit existe même si une photo a échoué : on le dit plutôt que de
  // faire croire à un échec complet.
  if (uploadError) {
    return { ok: true, message: `Produit ajouté, mais une image n'a pas pu être envoyée (${uploadError})` };
  }

  return { ok: true, message: "Produit ajouté." };
}

export async function updateProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const productId = String(formData.get("productId") ?? "");
  const parsed = productSchema.safeParse({
    name: formData.get("name") ?? "",
    price: formData.get("price") ?? "",
    promoPrice: (formData.get("promoPrice") as string) ?? "",
    quantity: (formData.get("quantity") as string) ?? "",
    description: (formData.get("description") as string) || undefined,
    sizes: (formData.get("sizes") as string) || undefined,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const session = await verifySession();
  const shop = await requireShop();
  const existing = await getProduct(shop.id, productId);
  if (!existing) return { message: "Produit introuvable." };

  const supabase = await createClient();
  // Le slug n'est volontairement pas recalculé : renommer un produit ne doit
  // pas invalider les liens déjà partagés.
  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      promo_price: parsed.data.promoPrice,
      quantity: parsed.data.quantity,
      sizes: parsed.data.sizes,
    })
    .eq("id", productId);

  if (error) return { message: "Enregistrement impossible. Réessayez." };

  const images = formData.getAll("images").filter((item): item is File => item instanceof File);
  const uploadError = await uploadProductImages(images, {
    userId: session.userId,
    shopId: shop.id,
    productId,
    productName: parsed.data.name,
    startPosition: existing.product_images?.length ?? 0,
  });

  revalidatePath("/dashboard/produits");
  revalidatePath(`/dashboard/produits/${productId}`);

  if (uploadError) {
    return { ok: true, message: `Produit modifié, mais une image n'a pas pu être envoyée (${uploadError})` };
  }

  return { ok: true, message: "Produit modifié." };
}

export async function toggleProduct(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const shop = await requireShop();
  const product = await getProduct(shop.id, productId);
  if (!product) return;

  const supabase = await createClient();
  await supabase.from("products").update({ is_active: !product.is_active }).eq("id", productId);

  revalidatePath("/dashboard/produits");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const shop = await requireShop();
  const supabase = await createClient();

  // product_images est en "on delete cascade" : les lignes partent avec le
  // produit. Les fichiers, eux, restent dans le bucket — un nettoyage
  // périodique viendra plus tard, une suppression ratée ne doit pas bloquer
  // le vendeur.
  await supabase.from("products").delete().eq("id", productId).eq("shop_id", shop.id);

  revalidatePath("/dashboard/produits");
  redirect("/dashboard/produits");
}

export async function finishProductsStep(): Promise<void> {
  const shop = await requireShop();
  const supabase = await createClient();

  await supabase
    .from("shops")
    .update({ onboarding_step: Math.max(shop.onboarding_step, 5) })
    .eq("id", shop.id);

  revalidatePath("/onboarding", "layout");
  redirect("/onboarding/whatsapp");
}

// ============================================================
// Onboarding — étape 5 : WhatsApp (et Mobile Money, optionnel)
// ============================================================

export async function saveWhatsapp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = whatsappSchema.safeParse({
    phone: formData.get("phone") ?? "",
    mobileMoney: (formData.get("mobileMoney") as string) || undefined,
    countryCode: (formData.get("countryCode") as string) || undefined,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const shop = await requireShop();
  const supabase = await createClient();

  const { error } = await supabase
    .from("shops")
    .update({
      whatsapp_number: toE164(parsed.data.phone, parsed.data.countryCode),
      mobile_money_number: parsed.data.mobileMoney
        ? toE164(parsed.data.mobileMoney, parsed.data.countryCode)
        : null,
      onboarding_step: Math.max(shop.onboarding_step, 6),
    })
    .eq("id", shop.id);

  if (error) return { message: "Enregistrement impossible. Réessayez." };

  revalidatePath("/onboarding", "layout");
  redirect("/onboarding/publication");
}

// ============================================================
// Onboarding — étape 6 : publication
// ============================================================

export async function publishShop(_prev: FormState, _formData: FormData): Promise<FormState> {
  const shop = await requireShop();
  const supabase = await createClient();

  // Dernier filet : ces trois conditions sont ce qui rend une boutique
  // utilisable par un acheteur. Le Mobile Money n'en fait volontairement pas
  // partie tant que GNAKRYPAY n'est pas branché.
  if (!shop.whatsapp_number) {
    return { message: "Ajoutez d'abord votre numéro WhatsApp." };
  }

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shop.id);

  if (!count) {
    return { message: "Ajoutez au moins un produit avant de publier." };
  }

  const { error } = await supabase
    .from("shops")
    .update({ published_at: new Date().toISOString(), onboarding_step: 6 })
    .eq("id", shop.id);

  if (error) return { message: "Publication impossible. Réessayez." };

  revalidatePath("/", "layout");
  redirect("/dashboard?bienvenue=1");
}

// ============================================================
// Réglages de la boutique (hors onboarding)
// ============================================================

export async function updateShopSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = shopIdentitySchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    category: (formData.get("category") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    countryCode: (formData.get("countryCode") as string) || undefined,
  });

  if (!identity.success) return { errors: fieldErrors(identity.error) };

  const contact = whatsappSchema.safeParse({
    phone: formData.get("phone") ?? "",
    mobileMoney: (formData.get("mobileMoney") as string) || undefined,
    countryCode: (formData.get("countryCode") as string) || undefined,
  });

  if (!contact.success) return { errors: fieldErrors(contact.error) };

  const appearance = appearanceSchema.safeParse({
    primaryColor: (formData.get("primaryColor") as string) || undefined,
  });

  if (!appearance.success) return { errors: fieldErrors(appearance.error) };

  const session = await verifySession();
  const shop = await requireShop();
  const supabase = await createClient();

  const patch: Database["public"]["Tables"]["shops"]["Update"] = {
    name: identity.data.name,
    slug: identity.data.slug,
    category: identity.data.category ?? null,
    description: identity.data.description ?? null,
    country_code: identity.data.countryCode,
    primary_color: appearance.data.primaryColor,
    whatsapp_number: toE164(contact.data.phone, contact.data.countryCode),
    mobile_money_number: contact.data.mobileMoney
      ? toE164(contact.data.mobileMoney, contact.data.countryCode)
      : null,
  };

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const upload = await uploadImage(logo, {
      userId: session.userId,
      shopId: shop.id,
      folder: "logo",
    });
    if (!upload.ok) return { errors: { logo: upload.reason } };
    patch.logo_url = upload.url;
  }

  const { error } = await supabase.from("shops").update(patch).eq("id", shop.id);

  if (error) {
    return isUniqueViolation(error)
      ? { errors: { slug: "Cette adresse est déjà prise." } }
      : { message: "Enregistrement impossible. Réessayez." };
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Boutique mise à jour." };
}

// ============================================================
// Commandes
// ============================================================

export async function updateOrderStatus(formData: FormData): Promise<void> {
  const parsed = orderStatusSchema.safeParse({
    orderId: formData.get("orderId") ?? "",
    status: formData.get("status") ?? "",
  });

  if (!parsed.success) return;

  const shop = await requireShop();
  const supabase = await createClient();

  await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.orderId)
    .eq("shop_id", shop.id);

  revalidatePath("/dashboard/commandes");
  revalidatePath(`/dashboard/commandes/${parsed.data.orderId}`);
  revalidatePath("/dashboard");
}
