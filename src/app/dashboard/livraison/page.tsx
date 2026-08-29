import { Bike, Car, Footprints, Trash2, Truck, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeliveryPartnerForm, DeliveryZoneForm } from "@/components/shop/delivery-forms";
import { deleteDeliveryZone, toggleDeliveryPartner } from "@/lib/network/actions";
import { getShopPartners, getShopZones } from "@/lib/network/queries";
import { requirePublishedShop } from "@/lib/shop/queries";
import { formatMoney } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import type { VehicleType } from "@/lib/supabase/types";

export const metadata = { title: "Livraison — Watshop" };

const VEHICULE_ICONS = {
  moto: Truck,
  velo: Bike,
  voiture: Car,
  a_pied: Footprints,
} satisfies Record<VehicleType, typeof Truck>;

const VEHICULE_LABELS: Record<VehicleType, string> = {
  moto: "Moto",
  velo: "Vélo",
  voiture: "Voiture",
  a_pied: "À pied",
};

export default async function DeliveryPage() {
  const shop = await requirePublishedShop();
  const [zones, partners] = await Promise.all([getShopZones(shop.id), getShopPartners(shop.id)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Livraison</h1>
        <p className="text-sm text-muted-foreground">
          Vos zones fixent les frais proposés à l&apos;acheteur au moment de commander.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zones de livraison</CardTitle>
          <CardDescription>
            Sans zone, la livraison est affichée à 0 et l&apos;acheteur n&apos;a rien à choisir.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {zones.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {zones.map((zone) => (
                <li
                  key={zone.id}
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{zone.zone_name}</p>
                    <p className="text-muted-foreground">
                      {formatMoney(zone.price, shop.currency_symbol)}
                      {zone.estimated_delay ? (
                        <>
                          <span className="mx-1.5">·</span>
                          {zone.estimated_delay}
                        </>
                      ) : null}
                      {zone.free_above !== null ? (
                        <>
                          <span className="mx-1.5">·</span>
                          gratuite dès {formatMoney(zone.free_above, shop.currency_symbol)}
                        </>
                      ) : null}
                    </p>
                  </div>

                  <form action={deleteDeliveryZone}>
                    <input type="hidden" name="zoneId" value={zone.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Supprimer la zone ${zone.zone_name}`}
                    >
                      <Trash2 />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}

          <DeliveryZoneForm currency={shop.currency_symbol} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Livreurs partenaires</CardTitle>
          <CardDescription>
            Vous leur confiez une commande depuis sa fiche. Ils voient l&apos;adresse, le montant à
            encaisser, et peuvent la marquer livrée.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {partners.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {partners.map((partner) => {
                const Icone = VEHICULE_ICONS[partner.vehicle_type];

                return (
                  <li
                    key={partner.id}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                  >
                    <Icone className="size-4 shrink-0 text-muted-foreground" />

                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-muted-foreground">
                        {formatPhone(partner.whatsapp_number)}
                        <span className="mx-1.5">·</span>
                        {partner.city}
                        <span className="mx-1.5">·</span>
                        {VEHICULE_LABELS[partner.vehicle_type]}
                      </p>
                    </div>

                    {partner.user_id ? (
                      <Badge variant="secondary" className="hidden sm:inline-flex">
                        <UserCheck className="size-3" />
                        Compte lié
                      </Badge>
                    ) : null}

                    <form action={toggleDeliveryPartner}>
                      <input type="hidden" name="partnerId" value={partner.id} />
                      <Button type="submit" variant="outline" size="sm">
                        {partner.is_active ? "Désactiver" : "Réactiver"}
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <DeliveryPartnerForm countryCode={shop.country_code} />
        </CardContent>
      </Card>
    </div>
  );
}
